package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.domain.AgendamentoConversa;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.CriarAgendamentoRequest;
import br.com.foursys.agendamento_salas.dto.request.SelecionarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.*;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import br.com.foursys.agendamento_salas.exception.ConversaNaoEncontradaException;
import br.com.foursys.agendamento_salas.exception.UsuarioSemPermissaoException;
import br.com.foursys.agendamento_salas.exception.ValidacaoBuscaException;
import br.com.foursys.agendamento_salas.port.out.AgendamentoConversaRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrquestradorAgendamentoService {

    private static final Logger log = LoggerFactory.getLogger(OrquestradorAgendamentoService.class);

    private final AgendamentoConversaRepositoryPort agendamentoConversaRepositoryPort;
    private final OllamaService ollamaService;
    private final SalaService salaService;
    private final AgendamentoService agendamentoService;

    public OrquestradorAgendamentoService(
            AgendamentoConversaRepositoryPort agendamentoConversaRepositoryPort,
            OllamaService ollamaService,
            SalaService salaService,
            AgendamentoService agendamentoService
    ) {
        this.agendamentoConversaRepositoryPort = agendamentoConversaRepositoryPort;
        this.ollamaService = ollamaService;
        this.salaService = salaService;
        this.agendamentoService = agendamentoService;
    }

    public IniciarConversaResponse iniciarConversa(Usuario usuario) {
        log.info("Iniciando conversa de agendamento. usuarioId={}", usuario.getId());

        AgendamentoConversa conversa = AgendamentoConversa.builder()
                .usuarioId(usuario)
                .status(StatusAgendamento.RECEBENDO_SOLICITACAO)
                .build();

         agendamentoConversaRepositoryPort.salvar(conversa);
         log.info("Conversa de agendamento iniciada. conversaId={}, estado={}", conversa.getId(), conversa.getStatus());

         return IniciarConversaResponse.builder()
                 .conversaId(conversa.getId())
                 .status(conversa.getStatus())
                 .build();


    }

    public OrquestradorAgendamentoResponse processarMensagem(
            Long conversaId,
            String mensagem,
            Long usuarioId
    ) {

        log.info("Processando mensagem de agendamento. conversaId={}, usuarioId={}", conversaId, usuarioId);
        AgendamentoConversa conversa = buscarConversaDoUsuario(conversaId, usuarioId);

        conversa.setStatus(StatusAgendamento.INTERPRETANDO);
        salvarConversa(conversa);

        InterpretarAgendamentoResponse interpretacao =
                ollamaService.interpretarAgendamento(
                        mensagem,
                        conversa.getDataAgendamento(),
                        conversa.getHoraInicio(),
                        conversa.getHoraFim(),
                        conversa.getQntdPessoas(),
                        conversa.getLocalizacao()
                );


        atualizarInformacoes(interpretacao, conversa);

        if (!validarInformacoes(conversa)) {
            salvarConversa(conversa);

            String pergunta = montarPerguntaInformacaoFaltante(conversa);
            log.info(
                    "Conversa aguarda informacoes para buscar salas. conversaId={}, estado={}",
                    conversaId,
                    conversa.getStatus()
            );

            return montarResposta(
                    conversa,
                    pergunta,
                    List.of()
            );
        }


        List<SalaResponse> salasEncontradas =
                consultarDisponibilidade(conversa);

        if (salasEncontradas.isEmpty()) {
            conversa.setStatus(StatusAgendamento.ERRO);
            salvarConversa(conversa);
            log.info("Nenhuma sala disponivel para a conversa. conversaId={}", conversaId);

            return montarResposta(
                    conversa,
                    "Não encontrei salas disponíveis para esse horário.",
                    List.of()
            );
        }


        List<SugestaoSalaResponse> sugestoes =
                montarSugestoes(salasEncontradas);

        conversa.setStatus(StatusAgendamento.AGUARDANDO_ESCOLHA);
        salvarConversa(conversa);
        log.info(
                "Disponibilidade consultada. conversaId={}, quantidadeSugestoes={}",
                conversaId,
                sugestoes.size()
        );

        return montarResposta(
                conversa,
                "Encontrei algumas salas disponíveis. Qual você prefere?",
                sugestoes
        );
    }

    public OrquestradorAgendamentoResponse selecionarSala(
            Long conversaId,
            SelecionarSalaRequest request,
            Long usuarioId
    ){
        log.info(
                "Registrando sala escolhida na conversa. conversaId={}, usuarioId={}, salaId={}",
                conversaId,
                usuarioId,
                request.salaId()
        );
        AgendamentoConversa conversa = buscarConversaDoUsuario(conversaId, usuarioId);

        Sala sala = salaService.buscarPorId(request.salaId());

        conversa.setSalaEscolhida(sala);
        conversa.setStatus(StatusAgendamento.AGUARDANDO_CONFIRMACAO);

        salvarConversa(conversa);
        log.info("Sala escolhida; aguardando confirmacao. conversaId={}, salaId={}", conversaId, sala.getId());

        return montarResposta(
                conversa,
                "Você escolheu a sala " + sala.getNome()
                        + ". Deseja confirmar o agendamento?",
                List.of()
        );
    }

    public OrquestradorAgendamentoResponse confirmarAgendamento(
            Long conversaId,
            Long usuarioId
    ){
        log.info("Iniciando confirmacao da conversa. conversaId={}, usuarioId={}", conversaId, usuarioId);
        AgendamentoConversa conversa = buscarConversaDoUsuario(conversaId, usuarioId);

        if (!validarInformacoes(conversa) || conversa.getSalaEscolhida() == null) {
            salvarConversa(conversa);
            throw new ValidacaoBuscaException(
                    "Faltam dados para confirmar o agendamento. Informe data, horários, pessoas e escolha uma sala."
            );
        }

        conversa.setStatus(StatusAgendamento.RESERVANDO);
        salvarConversa(conversa);

        CriarAgendamentoRequest criarAgendamentoRequest = new CriarAgendamentoRequest(
                new CriarAgendamentoRequest.SalaRef(conversa.getSalaEscolhida().getId()),
                conversa.getDataAgendamento(),
                conversa.getHoraInicio(),
                conversa.getHoraFim(),
                conversa.getQntdPessoas(),
                null,
                null
        );

        ConfimacaoAgendamentoResponse agendamento = agendamentoService.criar(
                criarAgendamentoRequest,
                conversa.getUsuarioId().getId()
        );

        conversa.setStatus(StatusAgendamento.CONFIRMADO);
        salvarConversa(conversa);
        log.info(
                "Agendamento confirmado pela conversa. conversaId={}, agendamentoId={}, usuarioId={}, salaId={}",
                conversaId,
                agendamento.id(),
                usuarioId,
                conversa.getSalaEscolhida().getId()
        );

        return montarResposta(
                conversa,
                "Agendamento realizado com sucesso!",
                List.of()
        );
    }

    public AgendamentoConversa buscarConversa(Long conversaId) {
        return agendamentoConversaRepositoryPort
                .buscarPorId(conversaId)
                .orElseThrow(ConversaNaoEncontradaException::new);
    }

    /** Garante que a conversa pertence ao usuário autenticado (evita IDOR). */
    public AgendamentoConversa buscarConversaDoUsuario(Long conversaId, Long usuarioId) {
        AgendamentoConversa conversa = buscarConversa(conversaId);

        if (conversa.getUsuarioId() == null
                || !conversa.getUsuarioId().getId().equals(usuarioId)) {
            throw new UsuarioSemPermissaoException();
        }

        return conversa;
    }


    private void atualizarInformacoes(
            InterpretarAgendamentoResponse interpretacao,
            AgendamentoConversa conversa
    ) {

        if (interpretacao.data() != null
                && interpretacao.data().informado()) {

            conversa.setDataAgendamento(
                    interpretacao.data().valor()
            );
        }

        if (interpretacao.inicio() != null
                && interpretacao.inicio().informado()) {

            conversa.setHoraInicio(
                    interpretacao.inicio().valor()
            );
        }

        if (interpretacao.fim() != null
                && interpretacao.fim().informado()) {

            conversa.setHoraFim(
                    interpretacao.fim().valor()
            );
        }

        if (interpretacao.quantidadePessoas() != null
                && interpretacao.quantidadePessoas().informado()) {

            conversa.setQntdPessoas(
                    interpretacao.quantidadePessoas().valor()
            );
        }

        if (interpretacao.localizacao() != null
                && interpretacao.localizacao().informado()) {

            conversa.setLocalizacao(
                    interpretacao.localizacao().valor()
            );
        }

        boolean fimInformado =
                interpretacao.fim() != null
                        && interpretacao.fim().informado();

        boolean duracaoInformada =
                interpretacao.duracaoMinutos() != null
                        && interpretacao.duracaoMinutos().informado()
                        && interpretacao.duracaoMinutos().valor() != null;

        // Duração ("por 1h") vira horário de término calculado em Java;
        // horário final explícito ("até 15h") tem prioridade.
        if (duracaoInformada
                && !fimInformado
                && conversa.getHoraInicio() != null) {

            conversa.setHoraFim(
                    conversa.getHoraInicio().plusMinutes(
                            interpretacao.duracaoMinutos().valor()
                    )
            );
        }
    }


    private boolean validarInformacoes(
            AgendamentoConversa conversa
    ) {

        boolean informacoesCompletas =
                conversa.getDataAgendamento() != null
                        && conversa.getHoraInicio() != null
                        && conversa.getHoraFim() != null
                        && conversa.getQntdPessoas() != null;

        if (!informacoesCompletas) {

            conversa.setStatus(
                    StatusAgendamento.AGUARDANDO_INFORMACAO
            );

            return false;
        }

        return true;
    }


    public List<SalaResponse> consultarDisponibilidade(
            AgendamentoConversa conversa
    ) {

        conversa.setStatus(
                StatusAgendamento.CONSULTANDO_DISPONIBILIDADE
        );

        salvarConversa(conversa);

        return salaService.buscarSalasDisponiveis(
                conversa.getDataAgendamento(),
                conversa.getHoraInicio(),
                conversa.getHoraFim(),
                conversa.getQntdPessoas(),
                conversa.getLocalizacao(),
                conversa.getUsuarioId().getEmail()

        );
    }


    private List<SugestaoSalaResponse> montarSugestoes(
            List<SalaResponse> salas
    ) {

        return salas.stream()
                .map(sala -> new SugestaoSalaResponse(
                        sala.id(),
                        sala.nome(),
                        sala.capacidade(),
                        sala.localizacao()
                ))
                .toList();
    }

    private void salvarConversa(
            AgendamentoConversa conversa
    ) {

        agendamentoConversaRepositoryPort.salvar(conversa);
    }


    private OrquestradorAgendamentoResponse montarResposta(
            AgendamentoConversa conversa,
            String mensagem,
            List<SugestaoSalaResponse> sugestoes
    ) {

        return new OrquestradorAgendamentoResponse(
                conversa.getId(),
                conversa.getStatus(),
                mensagem,
                sugestoes,
                conversa.getDataAgendamento(),
                conversa.getHoraInicio(),
                conversa.getHoraFim(),
                conversa.getQntdPessoas()
        );
    }

    private String montarPerguntaInformacaoFaltante(
            AgendamentoConversa conversa
    ) {
        if (conversa.getDataAgendamento() == null) {
            return "Qual data você deseja realizar o agendamento?";
        }

        if (conversa.getHoraInicio() == null) {
            return "A partir de qual horário você deseja reservar a sala?";
        }

        if (conversa.getHoraFim() == null) {
            return "Até qual horário você deseja reservar a sala?";
        }

        if (conversa.getQntdPessoas() == null) {
            return "Quantas pessoas utilizarão a sala?";
        }

        return null;
    }

}