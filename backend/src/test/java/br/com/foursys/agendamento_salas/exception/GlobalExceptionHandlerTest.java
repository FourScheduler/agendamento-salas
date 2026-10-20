package br.com.foursys.agendamento_salas.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void deveConverterValidacaoDeBuscaEmRespostaBadRequest() {
        var response = handler.validarBusca(new ValidacaoBuscaException("Data inválida"));

        assertEquals(400, response.getStatusCode().value());
        assertEquals(400, response.getBody().status());
        assertEquals("Data inválida", response.getBody().message());
        assertNotNull(response.getBody().timestamp());
    }

    @Test
    void deveConverterUsuarioInexistenteEmBadRequest() {
        var response = handler.handleUsuarioInexistente(new UsuarioInexistenteException());

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Usuario não encontrado", response.getBody().message());
    }

    @Test
    void deveConverterSalaInexistenteEmNotFound() {
        var response = handler.handleSalaInexistente(new SalaInexistenteException());

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Sala não encontrada", response.getBody().message());
    }

    @Test
    void deveConverterSalaDuplicadaEmConflict() {
        var response = handler.handleSalaJaExiste(new SalaJaExisteException());

        assertEquals(409, response.getStatusCode().value());
        assertEquals("A sala já existe", response.getBody().message());
    }

    @Test
    void deveConverterParametroInvalidoEmNotFound() {
        var response = handler.handleParametroInexistente();

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Recurso não encontrado.", response.getBody().message());
    }

    @Test
    void deveConverterFaltaDePermissaoEmForbidden() {
        var response = handler.handleUsuarioSemPermissao(new UsuarioSemPermissaoException());

        assertEquals(403, response.getStatusCode().value());
        assertEquals("O usuário não tem pemissão para realizar essa ação.", response.getBody().message());
    }

    @Test
    void deveConverterSalaIndisponivelEmBadRequest() {
        var response = handler.handleSalaIndisponivel(new SalaIndisponivelException());

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Sala indispovivel para reserva.", response.getBody().message());
    }

    @Test
    void deveConverterCapacidadeNaoSuportadaEmBadRequest() {
        var response = handler.handleCapacidadeNaoSuportadaException(new CapacidadeNaoSuportadaException());

        assertEquals(400, response.getStatusCode().value());
        assertEquals(400, response.getBody().status());
        assertEquals("Capacidade máxima da sala ultrapassada.", response.getBody().message());
        assertNotNull(response.getBody().timestamp());
    }

    @Test
    void deveConverterHorarioInvalidoEmBadRequest() {
        var response = handler.handleSalaIndisponivel(new HorarioAgendamentoInvalidoException());

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Horário de agendamento inválido.", response.getBody().message());
    }

    @Test
    void devePreservarStatusEDetalheDeErroDoSpring() {
        var response = handler.erroInesperado(new ErrorResponseException(HttpStatus.BAD_REQUEST));

        assertEquals(400, response.getStatusCode().value());
        assertEquals(400, response.getBody().status());
        assertEquals("Erro na requisição.", response.getBody().message());
    }

    @Test
    void deveRetornarMensagemGenericaParaErroInesperado() {
        var response = handler.erroInesperado(new IllegalStateException("detalhe interno"));

        assertEquals(500, response.getStatusCode().value());
        assertEquals("Erro interno inesperado.", response.getBody().message());
    }
}
