
package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.AgendamentoConversa;
import br.com.foursys.agendamento_salas.dto.response.CampoInterpretado;
import br.com.foursys.agendamento_salas.dto.response.InterpretarAgendamentoResponse;
import br.com.foursys.agendamento_salas.security.JwtAuthenticationFilter;
import br.com.foursys.agendamento_salas.security.AuthenticatedUser;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.OllamaService;
import br.com.foursys.agendamento_salas.service.OrquestradorAgendamentoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = OllamaController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
class OllamaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OllamaService ollamaService;

    @MockitoBean
    private OrquestradorAgendamentoService orquestradorAgendamentoService;

    @MockitoBean
    private SecurityUtils securityUtils;

    @Test
    void deveInterpretarAgendamentoComSucesso() throws Exception {

        String mensagem =
                "quero uma sala para hoje inicio as 14h e fim as 15h para cinco pessoas";

        LocalDate dataConhecida = null;
        LocalTime inicioConhecido = null;
        LocalTime fimConhecido = null;
        Integer quantidadePessoasConhecida = null;

        InterpretarAgendamentoResponse resposta =
                new InterpretarAgendamentoResponse(
                        new CampoInterpretado<>(
                                LocalDate.of(2026, 10, 9),
                                true
                        ),
                        new CampoInterpretado<>(
                                LocalTime.of(14, 0),
                                true
                        ),
                        new CampoInterpretado<>(
                                LocalTime.of(15, 0),
                                true
                        ),
                        new CampoInterpretado<>(
                                5,
                                true
                        ),
                        new CampoInterpretado<>(
                                "Tamboré",
                                true
                        ),
                        new CampoInterpretado<>(
                                null,
                                false
                        )
                );


        AgendamentoConversa conversa = AgendamentoConversa.builder()
                .id(1L)
                .dataAgendamento(null)
                .horaInicio(null)
                .horaFim(null)
                .qntdPessoas(null)
                .build();

        when(securityUtils.get()).thenReturn(new AuthenticatedUser(1L, "usuario@teste.com"));
        when(orquestradorAgendamentoService.buscarConversaDoUsuario(1L, 1L))
                .thenReturn(conversa);


        when(ollamaService.interpretarAgendamento(
                mensagem,
                dataConhecida,
                inicioConhecido,
                fimConhecido,
                quantidadePessoasConhecida,
                conversa.getLocalizacao()
        )).thenReturn(resposta);

        mockMvc.perform(
                        get("/api/ollama/1/interpretar")
                                .param("mensagem", mensagem)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valor").value("2026-10-09"))
                .andExpect(jsonPath("$.data.informado").value(true))
                .andExpect(jsonPath("$.inicio.valor").value("14:00:00"))
                .andExpect(jsonPath("$.inicio.informado").value(true))
                .andExpect(jsonPath("$.fim.valor").value("15:00:00"))
                .andExpect(jsonPath("$.fim.informado").value(true))
                .andExpect(jsonPath("$.quantidadePessoas.valor").value(5))
                .andExpect(jsonPath("$.quantidadePessoas.informado").value(true));

        verify(ollamaService).interpretarAgendamento(
                mensagem,
                dataConhecida,
                inicioConhecido,
                fimConhecido,
                quantidadePessoasConhecida,
                conversa.getLocalizacao()
        );

        verify(orquestradorAgendamentoService).buscarConversaDoUsuario(1L, 1L);
    }

    @Test
    void deveRetornarBadRequestQuandoMensagemNaoForInformada()
            throws Exception {

        mockMvc.perform(
                        get("/api/ollama/1/interpretar")
                )
                .andExpect(status().isBadRequest());
    }
}
