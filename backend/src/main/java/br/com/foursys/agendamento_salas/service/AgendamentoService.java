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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;


@Service
public class AgendamentoService {

    private static final Logger logger = LoggerFactory.getLogger(AgendamentoService.class);

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
        LocalDateTime agora = LocalDateTime.now();
        List<Long> salaIds = extrairIdSalas(agendamentoRequest);

        logger.info(
                "Iniciando validacao do agendamento. usuarioId={}, salaId={}, data={}, inicio={}, fim={}, pessoas={}",
                idUsuario,
                salaIds,
                agendamentoRequest.data(),
                agendamentoRequest.horaInicio(),
                agendamentoRequest.horaFim(),
                agendamentoRequest.qntdPessoas()
        );

        Usuario usuario = buscarUsuario(idUsuario);

        validarPermissaoQtdSalasAgendamento(usuario.getPerfilUsuario(), salaIds.size());
        validarDataAgendamento(agendamentoRequest.data());
        validarQuantidadePessoas(agendamentoRequest.qntdPessoas());
        validarHorarioAgendamento(agendamentoRequest.horaInicio(), agendamentoRequest.horaFim());

        // Adquirir os locks em ordem estável reduz deadlocks em reservas integradas.
        List<Sala> salas = salaIds.stream()
                .sorted()
                .map(salaId -> salaRepositoryPort
                        .buscarPorIdComBloqueio(salaId)
                        .orElseThrow(SalaInexistenteException::new))
                .toList();

        salas.forEach(sala -> logger.info(
                "Sala carregada para validação do agendamento. salaId={}, capacidade={}, disponivel={}",
                sala.getId(),
                sala.getCapacidade(),
                sala.getDisponivel()
        ));

        validarQuantidadeHorasAgendamento(agendamentoRequest.horaInicio(),
                agendamentoRequest.horaFim(), usuario.getPerfilUsuario());

        validarCapacidadeSala(agendamentoRequest, salas);
        validarSalasRestritas(salas, usuario.getPerfilUsuario());
        validarDisponibilidadeSalas(salas);

        salas.forEach(sala -> validarConflitoHorario(
                        sala.getId(),
                        agendamentoRequest.data(),
                        agendamentoRequest.horaInicio(),
                        agendamentoRequest.horaFim()
                )
        );

        // Reserva em nome de outro usuário: a pertence ao solicitante e aparece nos
        // Minhas reservas dele — não nos do administrador que fez o registro.
        Usuario solicitante = buscarSolicitante(agendamentoRequest, usuario);
        Usuario dono = solicitante != null ? solicitante : usuario;

        List<Agendamento> agendamentos = salas.stream()
                .map(sala -> Agendamento.builder()
                        .usuarioId(dono)
                        .salaId(sala)
                        .dataAgendamento(agendamentoRequest.data())
                        .dataCriacao(agora)
                        .horaInicio(agendamentoRequest.horaInicio())
                        .horaFim(agendamentoRequest.horaFim())
                        .qntdPessoas(agendamentoRequest.qntdPessoas())
                        .titulo(agendamentoRequest.titulo())
                        .status(StatusAgendamento.CONFIRMADO)
                        .ultimaAtualizacao(agora)
                        .build())
                .toList();

        if (solicitante != null) {
            agendamentos.forEach(agendamento ->
                    agendamento.setUsuarioIdSolicitante(solicitante)
            );
        }

        List<Agendamento> agendamentosSalvos = agendamentoRepositoryPort.salvar(agendamentos);

        salvarLogsCriacao(agendamentosSalvos, usuario, agora);

        logger.info(
                "Agendamentos registrados e logs de auditoria salvos. " +
                        "agendamentoIds={}, usuarioId={}, salasId={}",
                agendamentosSalvos.stream()
                        .map(Agendamento::getId)
                        .toList(),
                idUsuario,
                agendamentosSalvos.stream()
                        .map(Agendamento::getSalaId)
                        .map(Sala::getId)
                        .toList()
        );

        return construirRespostaAgendamento(agendamentosSalvos);
    }

    private SalaResponse toSalaResponse(Sala sala) {
        return SalaResponse.builder()
                .id(sala.getId())
                .nome(sala.getNome())
                .disponivel(sala.getDisponivel())
                .capacidade(sala.getCapacidade())
                .localizacao(sala.getLocalizacao())
                .restrito(Boolean.TRUE.equals(sala.getRestrito()))
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

    private void validarPermissaoQtdSalasAgendamento(PerfilUsuario perfilUsuario, int tamanhoListaSalar) {
        if(perfilUsuario.equals(PerfilUsuario.USER)) {
            if(tamanhoListaSalar > 1) {
                throw new UsuarioSemPermissaoException();
            }
        }
    }

    private void validarCapacidadeSala(CriarAgendamentoRequest agendamentoRequest, List<Sala> salas) {
        // Salas sem capacidade definida (Arena, de eventos) não limitam as pessoas.
        boolean semCapacidade = salas.stream().anyMatch(sala -> sala.getCapacidade() == null);
        if (semCapacidade) {
            return;
        }

        long capacidadeTotal = salas.stream().mapToLong(Sala::getCapacidade).sum();
        if (agendamentoRequest.qntdPessoas() > capacidadeTotal) {
            throw new CapacidadeNaoSuportadaException();
        }
    }

    /**
     * Salas marcadas como restritas (Arena) são de reserva de eventos e ficam
     * disponíveis apenas para o perfil ADMIN.
     */
    private void validarSalasRestritas(List<Sala> salas, PerfilUsuario perfilUsuario) {
        boolean restrita = salas.stream()
                .anyMatch(sala -> Boolean.TRUE.equals(sala.getRestrito()));

        if (restrita && !PerfilUsuario.ADMIN.equals(perfilUsuario)) {
            throw new UsuarioSemPermissaoException();
        }
    }

    private void validarDisponibilidadeSalas(List<Sala> salas) {
        salas.forEach(sala -> {
            if (!sala.getDisponivel()) {
                throw new SalaIndisponivelException();
            }
        });
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepositoryPort.buscarPorId(id)
                .orElseThrow(UsuarioInexistenteException::new);
    }

    /**
     * Resolve o solicitante escolhido pelo administrador; {@code null} quando a reserva
     * é do próprio usuário autenticado. Somente ADMIN pode indicar outro solicitante.
     */
    private Usuario buscarSolicitante(CriarAgendamentoRequest agendamentoRequest, Usuario usuario) {
        if (agendamentoRequest.usuarioIdSolicitante() == null) {
            return null;
        }

        if (!PerfilUsuario.ADMIN.equals(usuario.getPerfilUsuario())) {
            throw new UsuarioSemPermissaoException();
        }

        return usuarioRepositoryPort
                .buscarPorId(agendamentoRequest.usuarioIdSolicitante().id())
                .orElseThrow(UsuarioInexistenteException::new);
    }

    private Agendamento buscarAgendamento(Long id) {
        return agendamentoRepositoryPort.buscarPorId(id)
                .orElseThrow(AgendamentoInexistenteException::new);
    }

    private List<Long> extrairIdSalas(CriarAgendamentoRequest agendamentoRequest) {
        if (agendamentoRequest == null
                || agendamentoRequest.salaId() == null
                || agendamentoRequest.salaId().isEmpty()) {
            throw new ValidacaoBuscaException("Informe ao menos uma sala válida para o agendamento.");
        }

        if (agendamentoRequest.salaId().stream()
                .anyMatch(sala -> sala == null || sala.id() == null)) {
            throw new ValidacaoBuscaException(
                    "Informe ao menos uma sala válida para o agendamento."
            );
        }

        List<Long> salaIds = agendamentoRequest.salaId().stream()
                .map(CriarAgendamentoRequest.SalaRef::id)
                .toList();

        if (salaIds.size() != salaIds.stream().distinct().count()) {
            throw new ValidacaoBuscaException(
                    "Não informe a mesma sala mais de uma vez."
            );
        }

        return salaIds;
    }

    private void salvarLogsCriacao(List<Agendamento> agendamentos, Usuario usuario, LocalDateTime dataCriacao) {
        agendamentos.forEach(agendamento -> {
            Log log = Log.builder()
                    .agendamento(agendamento)
                    .usuario(usuario)
                    .status(StatusLog.CRIACAO)
                    .dataCriacao(dataCriacao)
                    .build();

            logRepositoryPort.salvar(log);
        });
    }

    private ConfimacaoAgendamentoResponse construirRespostaAgendamento(List<Agendamento> agendamentos) {
        Agendamento primeiroAgendamento = agendamentos.get(0);

        return ConfimacaoAgendamentoResponse.builder()
                .id(primeiroAgendamento.getId())
                .sala(toSalaResponse(primeiroAgendamento.getSalaId()))
                .inicio(primeiroAgendamento.getHoraInicio())
                .fim(primeiroAgendamento.getHoraFim())
                .status(primeiroAgendamento.getStatus())
                .solicitante(
                        primeiroAgendamento.getUsuarioIdSolicitante() != null
                                ? toUsuarioResponse(primeiroAgendamento.getUsuarioIdSolicitante())
                                : null
                )
                .agendamentos(agendamentos.stream()
                        .map(agendamento ->
                                new ConfimacaoAgendamentoResponse.AgendamentoCriado(
                                        agendamento.getId(),
                                        toSalaResponse(agendamento.getSalaId())))
                        .toList()).build();
    }
}