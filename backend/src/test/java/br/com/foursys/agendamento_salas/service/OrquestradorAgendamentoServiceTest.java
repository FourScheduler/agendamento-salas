
package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.domain.AgendamentoConversa;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.SelecionarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.CampoInterpretado;
import br.com.foursys.agendamento_salas.dto.response.InterpretarAgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.OrquestradorAgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import br.com.foursys.agendamento_salas.exception.ConversaNaoEncontradaException;
import br.com.foursys.agendamento_salas.exception.UsuarioSemPermissaoException;
import br.com.foursys.agendamento_salas.port.out.AgendamentoConversaRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrquestradorAgendamentoServiceTest {

    @Mock
    private AgendamentoConversaRepositoryPort agendamentoConversaRepositoryPort;

    @Mock
    private OllamaService ollamaService;

    @Mock
    private SalaService salaService;

    @Mock
    private AgendamentoService agendamentoService;

    @InjectMocks
    private OrquestradorAgendamentoService orquestradorService;

    private Usuario usuario;
    private AgendamentoConversa conversa;

    @BeforeEach
    void setUp() {
        usuario = Usuario.builder()
                .id(1L)
                .email("teste@email.com")
                .build();

        conversa = AgendamentoConversa.builder()
                .id(1L)
                .usuarioId(usuario)
                .status(StatusAgendamento.RECEBENDO_SOLICITACAO)
                .build();
    }

    @Test
    void deveIniciarConversaComSucesso() {
        doAnswer(invocation -> {
            AgendamentoConversa salva = invocation.getArgument(0);
            salva.setId(1L);
            return null;
        }).when(agendamentoConversaRepositoryPort).salvar(any(AgendamentoConversa.class));

        var resposta = orquestradorService.iniciarConversa(usuario);

        assertEquals(1L, resposta.conversaId());
        assertEquals(StatusAgendamento.RECEBENDO_SOLICITACAO, resposta.status());

        verify(agendamentoConversaRepositoryPort).salvar(any(AgendamentoConversa.class));
    }

    @Test
    void deveBuscarConversaExistente() {
        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));

        AgendamentoConversa resultado = orquestradorService.buscarConversa(1L);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());

        verify(agendamentoConversaRepositoryPort).buscarPorId(1L);
    }

    @Test
    void deveLancarExcecaoQuandoConversaNaoExistir() {
        when(agendamentoConversaRepositoryPort.buscarPorId(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ConversaNaoEncontradaException.class,
                () -> orquestradorService.buscarConversa(99L)
        );

        verify(agendamentoConversaRepositoryPort).buscarPorId(99L);
    }

    @Test
    void deveSolicitarDataQuandoInformacoesEstiveremVazias() {
        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));

        when(ollamaService.interpretarAgendamento(
                eq("quero reservar uma sala"),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull()
        )).thenReturn(new InterpretarAgendamentoResponse(
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null,false),
                new CampoInterpretado<>(null, false)
        ));

        when(agendamentoConversaRepositoryPort.salvar(any(AgendamentoConversa.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrquestradorAgendamentoResponse resposta =
                orquestradorService.processarMensagem(
                        1L,
                        "quero reservar uma sala",
                        1L
                );

        assertEquals(
                StatusAgendamento.AGUARDANDO_INFORMACAO,
                resposta.estado()
        );
        assertEquals(
                "Qual data você deseja realizar o agendamento?",
                resposta.mensagem()
        );
        assertTrue(resposta.sugestoes().isEmpty());

        verify(ollamaService).interpretarAgendamento(
                eq("quero reservar uma sala"),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                isNull()
        );

        verify(agendamentoConversaRepositoryPort, atLeastOnce())
                .salvar(any(AgendamentoConversa.class));

        verifyNoInteractions(salaService);
    }

    @Test
    void deveInformarQuandoNaoExistiremSalasDisponiveis() {
        conversa.setDataAgendamento(LocalDate.of(2026, 10, 10));
        conversa.setHoraInicio(LocalTime.of(14, 0));
        conversa.setHoraFim(LocalTime.of(15, 0));
        conversa.setQntdPessoas(5);

        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));

        when(ollamaService.interpretarAgendamento(
                eq("amanhã"),
                eq(conversa.getDataAgendamento()),
                eq(conversa.getHoraInicio()),
                eq(conversa.getHoraFim()),
                eq(5),
                isNull()
        )).thenReturn(new InterpretarAgendamentoResponse(
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>("tamboré", true),
                new CampoInterpretado<>(null, false)
        ));

        when(salaService.buscarSalasDisponiveis(
                any(LocalDate.class),
                any(LocalTime.class),
                any(LocalTime.class),
                eq(5),
                eq("tamboré"),
                eq("teste@email.com")
        )).thenReturn(List.of());

        when(agendamentoConversaRepositoryPort.salvar(any(AgendamentoConversa.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrquestradorAgendamentoResponse resposta =
                orquestradorService.processarMensagem(1L, "amanhã", 1L);

        assertEquals(StatusAgendamento.ERRO, resposta.estado());
        assertEquals(
                "Não encontrei salas disponíveis para esse horário.",
                resposta.mensagem()
        );
        assertTrue(resposta.sugestoes().isEmpty());

        assertEquals("tamboré", conversa.getLocalizacao());

        verify(salaService).buscarSalasDisponiveis(
                conversa.getDataAgendamento(),
                conversa.getHoraInicio(),
                conversa.getHoraFim(),
                5,
                "tamboré",
                "teste@email.com"
        );
    }


    @Test
    void deveRetornarSugestoesQuandoExistiremSalasDisponiveis() {
        conversa.setDataAgendamento(LocalDate.of(2026, 10, 10));
        conversa.setHoraInicio(LocalTime.of(14, 0));
        conversa.setHoraFim(LocalTime.of(15, 0));
        conversa.setQntdPessoas(5);

        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));


        when(ollamaService.interpretarAgendamento(
                eq("amanhã"),
                eq(conversa.getDataAgendamento()),
                eq(conversa.getHoraInicio()),
                eq(conversa.getHoraFim()),
                eq(5),
                isNull()
        )).thenReturn(new InterpretarAgendamentoResponse(
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>("Tamboré", true),
                new CampoInterpretado<>(null, false)
        ));


        SalaResponse salaResponse =
                new SalaResponse(10L, "Sala Focus", true,2, "Tamboré");

        when(salaService.buscarSalasDisponiveis(
                any(LocalDate.class),
                any(LocalTime.class),
                any(LocalTime.class),
                eq(5),
                eq("Tamboré"),
                eq("teste@email.com")
        )).thenReturn(List.of(salaResponse));

        when(agendamentoConversaRepositoryPort.salvar(any(AgendamentoConversa.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrquestradorAgendamentoResponse resposta =
                orquestradorService.processarMensagem(1L, "amanhã", 1L);

        assertEquals(
                StatusAgendamento.AGUARDANDO_ESCOLHA,
                resposta.estado()
        );
        assertEquals(
                "Encontrei algumas salas disponíveis. Qual você prefere?",
                resposta.mensagem()
        );
        assertEquals(1, resposta.sugestoes().size());
        assertEquals("Sala Focus", resposta.sugestoes().get(0).nome());

        assertEquals(conversa.getId(), resposta.conversaId());
        assertEquals(LocalDate.of(2026, 10, 10), resposta.data());
        assertEquals(LocalTime.of(14, 0), resposta.horaInicio());
        assertEquals(LocalTime.of(15, 0), resposta.horaFim());
        assertEquals(5, resposta.qntdPessoas());

        verify(salaService).buscarSalasDisponiveis(
                any(LocalDate.class),
                any(LocalTime.class),
                any(LocalTime.class),
                eq(5),
                eq("Tamboré"),
                eq("teste@email.com")
        );
    }

    @Test
    void deveCalcularHoraFimQuandoInformadaDuracao() {
        conversa.setDataAgendamento(LocalDate.of(2026, 10, 10));
        conversa.setQntdPessoas(6);

        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));

        when(ollamaService.interpretarAgendamento(
                eq("sala para 6 amanhã às 14h por 1h"),
                eq(LocalDate.of(2026, 10, 10)),
                isNull(),
                isNull(),
                eq(6),
                isNull()
        )).thenReturn(new InterpretarAgendamentoResponse(
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(LocalTime.of(14, 0), true),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(6, true),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(60, true)
        ));

        SalaResponse salaResponse =
                new SalaResponse(10L, "Sala Focus", true, 8, "Tamboré");

        when(salaService.buscarSalasDisponiveis(
                any(LocalDate.class),
                any(LocalTime.class),
                any(LocalTime.class),
                eq(6),
                isNull(),
                eq("teste@email.com")
        )).thenReturn(List.of(salaResponse));

        when(agendamentoConversaRepositoryPort.salvar(any(AgendamentoConversa.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrquestradorAgendamentoResponse resposta =
                orquestradorService.processarMensagem(
                        1L,
                        "sala para 6 amanhã às 14h por 1h",
                        1L
                );

        assertEquals(StatusAgendamento.AGUARDANDO_ESCOLHA, resposta.estado());
        assertEquals(LocalTime.of(14, 0), resposta.horaInicio());
        assertEquals(LocalTime.of(15, 0), resposta.horaFim());
        assertEquals(1, resposta.sugestoes().size());
    }

    @Test
    void devePriorizarHorarioFinalExplicitoSobreDuracao() {
        conversa.setDataAgendamento(LocalDate.of(2026, 10, 10));
        conversa.setQntdPessoas(6);

        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));

        when(ollamaService.interpretarAgendamento(
                eq("14h até 16h, mas deixa 1h"),
                eq(LocalDate.of(2026, 10, 10)),
                isNull(),
                isNull(),
                eq(6),
                isNull()
        )).thenReturn(new InterpretarAgendamentoResponse(
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(LocalTime.of(14, 0), true),
                new CampoInterpretado<>(LocalTime.of(16, 0), true),
                new CampoInterpretado<>(6, true),
                new CampoInterpretado<>(null, false),
                new CampoInterpretado<>(60, true)
        ));

        when(salaService.buscarSalasDisponiveis(
                any(LocalDate.class),
                any(LocalTime.class),
                any(LocalTime.class),
                eq(6),
                isNull(),
                eq("teste@email.com")
        )).thenReturn(List.of());

        when(agendamentoConversaRepositoryPort.salvar(any(AgendamentoConversa.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrquestradorAgendamentoResponse resposta =
                orquestradorService.processarMensagem(
                        1L,
                        "14h até 16h, mas deixa 1h",
                        1L
                );

        assertEquals(LocalTime.of(16, 0), resposta.horaFim());
    }

    @Test
    void deveSelecionarSalaEEsperarConfirmacao() {
        Sala sala = Sala.builder()
                .id(10L)
                .nome("Sala Focus")
                .disponivel(true)
                .capacidade(8)
                .localizacao("Tamboré")
                .build();

        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));

        when(salaService.buscarPorId(10L)).thenReturn(sala);

        when(agendamentoConversaRepositoryPort.salvar(any(AgendamentoConversa.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrquestradorAgendamentoResponse resposta =
                orquestradorService.selecionarSala(
                        1L,
                        new SelecionarSalaRequest(10L),
                        1L
                );

        assertEquals(
                StatusAgendamento.AGUARDANDO_CONFIRMACAO,
                resposta.estado()
        );
        assertEquals(
                "Você escolheu a sala Sala Focus. Deseja confirmar o agendamento?",
                resposta.mensagem()
        );
        assertEquals(10L, conversa.getSalaEscolhida().getId());

        verify(salaService).buscarPorId(10L);
        verify(agendamentoConversaRepositoryPort)
                .salvar(any(AgendamentoConversa.class));
    }

    @Test
    void deveRejeitarAcessoAConversaDeOutroUsuario() {
        when(agendamentoConversaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(conversa));

        assertThrows(
                br.com.foursys.agendamento_salas.exception.UsuarioSemPermissaoException.class,
                () -> orquestradorService.processarMensagem(1L, "olá", 99L)
        );

        verifyNoInteractions(ollamaService, salaService, agendamentoService);
        verify(agendamentoConversaRepositoryPort, never())
                .salvar(any(AgendamentoConversa.class));
    }
}
