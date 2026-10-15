
package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.exception.InterpretacaoIaException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;

class OllamaServiceTest {

    private OllamaService ollamaService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {

        objectMapper = new ObjectMapper();

        ollamaService = spy(
                new OllamaService(
                        null,
                        "gemma3:4b",
                        objectMapper
                )
        );
    }

    @Test
    void deveInterpretarAgendamentoComTodosOsCampos() {

        String respostaOllama = """
                {
                  "data": {
                    "valor": "2026-10-09",
                    "informado": true
                  },
                  "inicio": {
                    "valor": "14:00:00",
                    "informado": true
                  },
                  "fim": {
                    "valor": "15:00:00",
                    "informado": true
                  },
                  "quantidadePessoas": {
                    "valor": 5,
                    "informado": true
                  }
                }
                """;

        doReturn(respostaOllama)
                .when(ollamaService)
                .gerarResposta(anyString());

        var resposta = ollamaService.interpretarAgendamento(
                "quero uma sala hoje das 14h às 15h para cinco pessoas",
                null,
                null,
                null,
                null,
                null
        );

        assertNotNull(resposta);

        assertEquals(
                LocalDate.of(2026, 10, 9),
                resposta.data().valor()
        );
        assertTrue(resposta.data().informado());

        assertEquals(
                LocalTime.of(14, 0),
                resposta.inicio().valor()
        );
        assertTrue(resposta.inicio().informado());

        assertEquals(
                LocalTime.of(15, 0),
                resposta.fim().valor()
        );
        assertTrue(resposta.fim().informado());

        assertEquals(5, resposta.quantidadePessoas().valor());
        assertTrue(resposta.quantidadePessoas().informado());
    }

    @Test
    void deveManterCamposNaoInformadosComoNull() {

        String respostaOllama = """
                {
                  "data": {
                    "valor": null,
                    "informado": false
                  },
                  "inicio": {
                    "valor": "14:00:00",
                    "informado": true
                  },
                  "fim": {
                    "valor": null,
                    "informado": false
                  },
                  "quantidadePessoas": {
                    "valor": null,
                    "informado": false
                  }
                }
                """;

        doReturn(respostaOllama)
                .when(ollamaService)
                .gerarResposta(anyString());

        var resposta = ollamaService.interpretarAgendamento(
                "quero uma sala às 14h",
                null,
                null,
                null,
                null,
                null
        );

        assertNotNull(resposta);

        assertNull(resposta.data().valor());
        assertFalse(resposta.data().informado());

        assertEquals(
                LocalTime.of(14, 0),
                resposta.inicio().valor()
        );
        assertTrue(resposta.inicio().informado());

        assertNull(resposta.fim().valor());
        assertFalse(resposta.fim().informado());

        assertNull(resposta.quantidadePessoas().valor());
        assertFalse(resposta.quantidadePessoas().informado());
    }

    @Test
    void deveInterpretarDataDeAmanha() {

        String respostaOllama = """
                {
                  "data": {
                    "valor": "2026-10-10",
                    "informado": true
                  },
                  "inicio": {
                    "valor": "14:00:00",
                    "informado": true
                  },
                  "fim": {
                    "valor": "15:00:00",
                    "informado": true
                  },
                  "quantidadePessoas": {
                    "valor": 5,
                    "informado": true
                  }
                }
                """;

        doReturn(respostaOllama)
                .when(ollamaService)
                .gerarResposta(anyString());

        var resposta = ollamaService.interpretarAgendamento(
                "quero uma sala amanhã das 14h às 15h para cinco pessoas",
                null,
                null,
                null,
                null,
                null
        );

        assertNotNull(resposta);

        assertEquals(
                LocalDate.of(2026, 10, 10),
                resposta.data().valor()
        );
        assertTrue(resposta.data().informado());

        assertEquals(
                LocalTime.of(14, 0),
                resposta.inicio().valor()
        );
        assertTrue(resposta.inicio().informado());

        assertEquals(
                LocalTime.of(15, 0),
                resposta.fim().valor()
        );
        assertTrue(resposta.fim().informado());

        assertEquals(5, resposta.quantidadePessoas().valor());
        assertTrue(resposta.quantidadePessoas().informado());
    }

    @Test
    void devePreservarDadosConhecidosAoInterpretarContinuacao() {

        String respostaOllama = """
                {
                  "data": {
                    "valor": "2026-10-10",
                    "informado": true
                  },
                  "inicio": {
                    "valor": null,
                    "informado": false
                  },
                  "fim": {
                    "valor": null,
                    "informado": false
                  },
                  "quantidadePessoas": {
                    "valor": null,
                    "informado": false
                  }
                }
                """;

        doReturn(respostaOllama)
                .when(ollamaService)
                .gerarResposta(anyString());

        var resposta = ollamaService.interpretarAgendamento(
                "amanhã",
                null,
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                5,
                "Tamboré"
        );

        assertNotNull(resposta);

        assertEquals(
                LocalDate.of(2026, 10, 10),
                resposta.data().valor()
        );
        assertTrue(resposta.data().informado());

        assertNull(resposta.inicio().valor());
        assertFalse(resposta.inicio().informado());

        assertNull(resposta.fim().valor());
        assertFalse(resposta.fim().informado());

        assertNull(resposta.quantidadePessoas().valor());
        assertFalse(resposta.quantidadePessoas().informado());
    }

    @Test
    void deveInterpretarDuracaoEmMinutos() {

        String respostaOllama = """
                {
                  "data": {
                    "valor": "2026-10-10",
                    "informado": true
                  },
                  "inicio": {
                    "valor": "14:00:00",
                    "informado": true
                  },
                  "fim": {
                    "valor": null,
                    "informado": false
                  },
                  "quantidadePessoas": {
                    "valor": 6,
                    "informado": true
                  },
                  "localizacao": {
                    "valor": null,
                    "informado": false
                  },
                  "duracaoMinutos": {
                    "valor": 60,
                    "informado": true
                  }
                }
                """;

        doReturn(respostaOllama)
                .when(ollamaService)
                .gerarResposta(anyString());

        var resposta = ollamaService.interpretarAgendamento(
                "sala para 6 pessoas amanhã às 14h por 1h",
                null,
                null,
                null,
                null,
                null
        );

        assertNotNull(resposta);

        assertEquals(
                LocalTime.of(14, 0),
                resposta.inicio().valor()
        );
        assertTrue(resposta.inicio().informado());

        assertNull(resposta.fim().valor());
        assertFalse(resposta.fim().informado());

        assertEquals(60, resposta.duracaoMinutos().valor());
        assertTrue(resposta.duracaoMinutos().informado());
    }

    @Test
    void deveManterDuracaoNulaQuandoAusenteNoJson() {

        String respostaOllama = """
                {
                  "data": {
                    "valor": null,
                    "informado": false
                  },
                  "inicio": {
                    "valor": "14:00:00",
                    "informado": true
                  },
                  "fim": {
                    "valor": null,
                    "informado": false
                  },
                  "quantidadePessoas": {
                    "valor": null,
                    "informado": false
                  }
                }
                """;

        doReturn(respostaOllama)
                .when(ollamaService)
                .gerarResposta(anyString());

        var resposta = ollamaService.interpretarAgendamento(
                "quero uma sala às 14h",
                null,
                null,
                null,
                null,
                null
        );

        assertNotNull(resposta);
        assertNull(resposta.duracaoMinutos());
    }

    @Test
    void deveLancarExcecaoQuandoOllamaRetornarJsonInvalido() {

        String respostaInvalida = "isso não é um JSON válido";

        doReturn(respostaInvalida)
                .when(ollamaService)
                .gerarResposta(anyString());

        InterpretacaoIaException exception = assertThrows(
                InterpretacaoIaException.class,
                () -> ollamaService.interpretarAgendamento(
                        "quero uma sala amanhã",
                        null,
                        null,
                        null,
                        null,
                        null
                )
        );

        assertEquals(
                "Não foi possível interpretar a solicitação agora. Tente novamente.",
                exception.getMessage()
        );
    }
}
