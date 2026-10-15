package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.dto.request.CriarAgendamentoRequest;
import br.com.foursys.agendamento_salas.dto.response.AgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.ConfimacaoAgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.dto.response.UsuarioResponse;
import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.domain.Log;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.enums.StatusLog;
import br.com.foursys.agendamento_salas.exception.*;
import br.com.foursys.agendamento_salas.mapper.AgendamentoMapper;
import br.com.foursys.agendamento_salas.port.out.AgendamentoRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.LogRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.SalaRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.UsuarioRepositoryPort;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;


@Service
public class AgendamentoService {

    private final AgendamentoRepositoryPort agendamentoRepositoryPort;
    private final LogRepositoryPort logRepositoryPort;
    private final SalaRepositoryPort salaRepositoryPort;
    private final UsuarioRepositoryPort usuarioRepositoryPort;

    private final AgendamentoMapper agendamentoMapper;

    public AgendamentoService(AgendamentoRepositoryPort agendamentoRepositoryPort, LogRepositoryPort logRepositoryPort, SalaRepositoryPort salaRepositoryPort, UsuarioRepositoryPort usuarioRepositoryPort,
                              AgendamentoMapper agendamentoMapper) {
        this.agendamentoRepositoryPort = agendamentoRepositoryPort;
        this.logRepositoryPort = logRepositoryPort;
        this.salaRepositoryPort = salaRepositoryPort;
        this.usuarioRepositoryPort = usuarioRepositoryPort;
        this.agendamentoMapper = agendamentoMapper;
    }

    @Transactional
    public ConfimacaoAgendamentoResponse criar(CriarAgendamentoRequest agendamentoRequest, Long idUsuario) {
        Usuario usuario = buscarUsuario(idUsuario);

        validarDataAgendamento(agendamentoRequest.data());
        validarQuantidadePessoas(agendamentoRequest.qntdPessoas());
        validarHorarioAgendamento(agendamentoRequest.horaInicio(), agendamentoRequest.horaFim());

        // Lock pessimista na sala serializa reservas concorrentes da mesma sala,
        // evitando dupla reserva entre o check de conflito e o insert.
        Sala sala = salaRepositoryPort.buscarPorIdComBloqueio(agendamentoRequest.salaId().id())
                .orElseThrow(SalaInexistenteException::new);

        validarQuantidadeHorasAgendamento(agendamentoRequest.horaInicio(),
                agendamentoRequest.horaFim(), usuario.getPerfilUsuario());

        validarCapacidadeMaximaSala(agendamentoRequest.qntdPessoas(), sala.getCapacidade());

        validarConflitoHorario(sala.getId(), agendamentoRequest.data(), agendamentoRequest.horaInicio(),
                agendamentoRequest.horaFim());

        if(!sala.getDisponivel()) {
            throw new SalaIndisponivelException();
        }

        Agendamento agendamento = Agendamento
                .builder()
                .usuarioId(usuario)
                .salaId(sala)
                .dataAgendamento(agendamentoRequest.data())
                .dataCriacao(LocalDateTime.now())
                .horaInicio(agendamentoRequest.horaInicio())
                .horaFim(agendamentoRequest.horaFim())
                .qntdPessoas(agendamentoRequest.qntdPessoas())
                .titulo(agendamentoRequest.titulo())
                .status(StatusAgendamento.CONFIRMADO)
                .ultimaAtualizacao(LocalDateTime.now())
                .build();

        if(agendamentoRequest.usuarioIdSolicitante() != null) {
            if(!usuario.getPerfilUsuario().equals(PerfilUsuario.ADMIN)) {
                throw new UsuarioSemPermissaoException();
            }

            Usuario solicitante = usuarioRepositoryPort
                    .buscarPorId(agendamentoRequest.usuarioIdSolicitante().id())
                    .orElseThrow(UsuarioInexistenteException::new);

            agendamento.setUsuarioIdSolicitante(solicitante);
        }

        agendamentoRepositoryPort.salvar(agendamento);

        Log log = Log
                .builder()
                .agendamento(agendamento)
                .usuario(usuario).status(StatusLog.CRIACAO)
                .dataCriacao(LocalDateTime.now())
                .build();

        logRepositoryPort.salvar(log);

        return ConfimacaoAgendamentoResponse.builder()
                .id(agendamento.getId())
                .sala(SalaResponse.builder()
                        .id(sala.getId())
                        .nome(sala.getNome())
                        .disponivel(sala.getDisponivel())
                        .capacidade(sala.getCapacidade())
                        .localizacao(sala.getLocalizacao())
                        .build())
                .inicio(agendamento.getHoraInicio())
                .fim(agendamento.getHoraFim())
                .status(agendamento.getStatus())
                .solicitante(agendamento.getUsuarioIdSolicitante() != null
                        ? toUsuarioResponse(agendamento.getUsuarioIdSolicitante())
                        : null)
                .build();
    }

    private UsuarioResponse toUsuarioResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNome(),
                usuario.getPerfilUsuario()
        );
    }

    public List<AgendamentoResponse> buscaAgendamentos(Long usuarioAutenticado, boolean todosUsuarios) {

        Usuario usuario = buscarUsuario(usuarioAutenticado);

        boolean isAdmin = usuario.getPerfilUsuario() == PerfilUsuario.ADMIN;

        if (todosUsuarios && !isAdmin) {
            throw new UsuarioSemPermissaoException();
        }

        Long usuarioId = todosUsuarios ? null : usuario.getId();

        return agendamentoRepositoryPort.buscarFiltrados(
                        usuarioId, null, null, null
                )
                .stream()
                .map(agendamentoMapper::entityToResponse)
                .toList();
    }

    public List<AgendamentoResponse> buscaFiltrada(Long usuarioAutenticado, LocalDate dataInicio,
            LocalDate dataFim, StatusAgendamento statusAgendamento, boolean todosUsuarios) {

        Usuario usuario = buscarUsuario(usuarioAutenticado);

        boolean isAdmin = usuario.getPerfilUsuario() == PerfilUsuario.ADMIN;

        if (todosUsuarios && !isAdmin) {
            throw new UsuarioSemPermissaoException();
        }

        Long usuarioId = todosUsuarios ? null : usuario.getId();

        return agendamentoRepositoryPort.buscarFiltrados(
                        usuarioId,
                        dataInicio,
                        dataFim,
                        statusAgendamento)
                .stream()
                .map(agendamentoMapper::entityToResponse)
                .toList();
    }

    @Transactional
    public void cancelarAgendamento(Long idAgendamento, Long usuarioAutenticado) {
        Usuario usuario = buscarUsuario(usuarioAutenticado);

        boolean isAdmin = usuario.getPerfilUsuario() == PerfilUsuario.ADMIN;

        Agendamento agendamento = buscarAgendamento(idAgendamento);

        Long donoDoAgendamento = agendamento.getUsuarioId() != null
                ? agendamento.getUsuarioId().getId()
                : null;

        if (!isAdmin && !usuarioAutenticado.equals(donoDoAgendamento)) {
            throw new UsuarioSemPermissaoException();
        }

        agendamento.setDataCancelamento(LocalDateTime.now());
        agendamento.setStatus(StatusAgendamento.CANCELADO);

        agendamentoRepositoryPort.cancelar(agendamento);

        Log log = Log
                .builder()
                .agendamento(agendamento)
                .usuario(usuario).status(StatusLog.CANCELAMENTO)
                .dataCriacao(LocalDateTime.now())
                .build();

        logRepositoryPort.salvar(log);
    }

//  Métodos Utilitarios
    private long calcularDuracao(LocalTime inicio, LocalTime fim) {
        return Duration.between(inicio, fim).toMinutes();
    }

    private void validarDataAgendamento(LocalDate data) {
        if (data == null || data.isBefore(LocalDate.now())) {
            throw new ValidacaoBuscaException("A data não pode estar no passado.");
        }
    }

    private void validarQuantidadePessoas(Integer qntdPessoas) {
        if (qntdPessoas == null || qntdPessoas < 1) {
            throw new ValidacaoBuscaException("A quantidade de pessoas deve ser ao menos 1.");
        }
    }

    private void validarQuantidadeHorasAgendamento(LocalTime horaInicio, LocalTime horaFim, PerfilUsuario perfilUsuario) {
        if (calcularDuracao(horaInicio, horaFim) > 120
                && perfilUsuario != PerfilUsuario.ADMIN) {
            throw new ValidacaoBuscaException(
                    "A duração não pode ser maior que 2 horas."
            );
        }
    }

    private void validarCapacidadeMaximaSala(int qtdPessoas, int capacidadeSala) {
        if(qtdPessoas > capacidadeSala) {
            throw new CapacidadeNaoSuportadaException();
        }
    }

    private void validarConflitoHorario(Long idSala, LocalDate dataAgendamento, LocalTime horaInicio, LocalTime horaFim) {
        boolean conflito = agendamentoRepositoryPort.existeConflito(idSala, dataAgendamento, horaInicio, horaFim);

        if(conflito) {
            throw new SalaIndisponivelException();
        }
    }

    private void validarHorarioAgendamento(LocalTime horaInicio, LocalTime horaFim) {
        if (horaInicio == null || horaFim == null) {
            throw new HorarioAgendamentoInvalidoException();
        }

        if (!horaFim.isAfter(horaInicio)) {
            throw new HorarioAgendamentoInvalidoException();
        }
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepositoryPort.buscarPorId(id)
                .orElseThrow(UsuarioInexistenteException::new);
    }

    private Agendamento buscarAgendamento(Long id) {
        return agendamentoRepositoryPort.buscarPorId(id)
                .orElseThrow(AgendamentoInexistenteException::new);
    }
}
