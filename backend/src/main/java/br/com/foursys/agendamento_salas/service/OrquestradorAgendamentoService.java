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
import br.com.foursys.agendamento_salas.port.out.AgendamentoConversaRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrquestradorAgendamentoService {

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

        AgendamentoConversa conversa = AgendamentoConversa.builder()
                .usuarioId(usuario)
                .status(StatusAgendamento.RECEBENDO_SOLICITACAO)
                .build();

         agendamentoConversaRepositoryPort.salvar(conversa);

         return IniciarConversaResponse.builder()
                 .conversaId(conversa.getId())
                 .status(conversa.getStatus())
                 .build();


    }

    public OrquestradorAgendamentoResponse processarMensagem(
            Long conversaId,
            String mensagem
    ) {

        AgendamentoConversa conversa = buscarConversa(conversaId);

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

        return montarResposta(
                conversa,
                "Encontrei algumas salas disponíveis. Qual você prefere?",
                sugestoes
        );
    }

    public OrquestradorAgendamentoResponse selecionarSala(
            Long conversaId,
            SelecionarSalaRequest request
    ){
        AgendamentoConversa conversa = buscarConversa(conversaId);

        Sala sala = salaService.buscarPorId(request.salaId());

        conversa.setSalaEscolhida(sala);
        conversa.setStatus(StatusAgendamento.AGUARDANDO_CONFIRMACAO);

        salvarConversa(conversa);

        return montarResposta(
                conversa,
                "Você escolheu a sala " + sala.getNome()
                        + ". Deseja confirmar o agendamento?",
                List.of()
        );
    }

    public OrquestradorAgendamentoResponse confirmarAgendamento(
            Long conversaId
    ){
        AgendamentoConversa conversa = buscarConversa(conversaId);
        validarInformacoes(conversa);

        conversa.setStatus(StatusAgendamento.RESERVANDO);
        salvarConversa(conversa);

        CriarAgendamentoRequest criarAgendamentoRequest = new CriarAgendamentoRequest(conversa.getSalaEscolhida(),conversa.getDataAgendamento(),conversa.getHoraInicio(), conversa.getHoraFim(),conversa.getQntdPessoas(),null,null);

        ConfimacaoAgendamentoResponse agendamento = agendamentoService.criar(criarAgendamentoRequest,conversa.getUsuarioId().getId());

        conversa.setStatus(StatusAgendamento.CONFIRMADO);
        salvarConversa(conversa);

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
                sugestoes
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