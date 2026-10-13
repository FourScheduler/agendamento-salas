package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.dto.request.BuscaAgendamentoFiltradaRequest;
import br.com.foursys.agendamento_salas.dto.request.BuscaAgendamentoRequest;
import br.com.foursys.agendamento_salas.dto.request.CriarAgendamentoRequest;
import br.com.foursys.agendamento_salas.dto.response.AgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.ConfimacaoAgendamentoResponse;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import br.com.foursys.agendamento_salas.security.AuthenticatedUser;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.AgendamentoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("AgendamentoController - Fluxo de agendamentos")
class AgendamentoControllerTests {

    private AgendamentoService agendamentoService;
    private SecurityUtils securityUtils;
    private AgendamentoController agendamentoController;

    @BeforeEach
    void setUp() {
        agendamentoService = mock(AgendamentoService.class);
        securityUtils = mock(SecurityUtils.class);
        agendamentoController = new AgendamentoController(agendamentoService, securityUtils);
    }

    @Test
    @DisplayName("Deve criar agendamento e retornar a confirmação com status 201")
    void deveCriarAgendamentoRetornandoStatus201EConfirmacaoDoNovoFluxo() {
        when(securityUtils.get()).thenReturn(new AuthenticatedUser(42L, "usuario@email.com"));

        Sala sala = Sala.builder()
                .id(12L)
                .nome("Sala Focus")
                .capacidade(8)
                .disponivel(true)
                .build();

        CriarAgendamentoRequest request = new CriarAgendamentoRequest(
                sala,
                LocalDate.now().plusDays(1),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                4,
                null,
                "Reunião de alinhamento"
        );

        ConfimacaoAgendamentoResponse expected = ConfimacaoAgendamentoResponse.builder()
                .id(99L)
                .sala(sala)
                .inicio(LocalTime.of(9, 0))
                .fim(LocalTime.of(10, 0))
                .status(StatusAgendamento.CONFIRMADO)
                .solicitante(null)
                .build();

        when(agendamentoService.create(request, 42L)).thenReturn(expected);

        var response = agendamentoController.create(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(expected, response.getBody());
        verify(agendamentoService).create(request, 42L);
    }

    @Test
    @DisplayName("Deve retornar os agendamentos do usuário autenticado")
    void deveRetornarAgendamentosDoUsuarioAutenticado() {
        when(securityUtils.get()).thenReturn(new AuthenticatedUser(42L, "usuario@email.com"));
        BuscaAgendamentoRequest request = new BuscaAgendamentoRequest(false);
        List<AgendamentoResponse> expected = List.of(agendamentoResponse());
        when(agendamentoService.buscaAgendamentos(42L, false)).thenReturn(expected);

        var response = agendamentoController.buscaAgendamentos(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expected, response.getBody());
        verify(agendamentoService).buscaAgendamentos(42L, false);
    }

    @Test
    @DisplayName("Deve retornar todos os agendamentos pela consulta administrativa")
    void deveRetornarTodosAgendamentos() {
        when(securityUtils.get()).thenReturn(new AuthenticatedUser(7L, "admin@email.com"));
        BuscaAgendamentoRequest request = new BuscaAgendamentoRequest(true);
        List<AgendamentoResponse> expected = List.of(agendamentoResponse());
        when(agendamentoService.buscaAgendamentos(7L, true)).thenReturn(expected);

        var response = agendamentoController.buscaAgendamentos(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expected, response.getBody());
        verify(agendamentoService).buscaAgendamentos(7L, true);
    }

    @Test
    @DisplayName("Deve encaminhar os critérios da busca filtrada e usuário autenticado")
    void deveBuscarAgendamentosComFiltros() {
        when(securityUtils.get()).thenReturn(new AuthenticatedUser(42L, "usuario@email.com"));
        LocalDate dataInicio = LocalDate.now();
        LocalDate dataFinal = dataInicio.plusDays(7);
        BuscaAgendamentoFiltradaRequest request = new BuscaAgendamentoFiltradaRequest(
                dataInicio, dataFinal, StatusAgendamento.CONFIRMADO, false
        );
        List<AgendamentoResponse> expected = List.of(agendamentoResponse());
        when(agendamentoService.buscaFiltrada(
                42L, dataInicio, dataFinal, StatusAgendamento.CONFIRMADO, false
        )).thenReturn(expected);

        var response = agendamentoController.buscaFiltrada(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expected, response.getBody());
        verify(agendamentoService).buscaFiltrada(
                42L, dataInicio, dataFinal, StatusAgendamento.CONFIRMADO, false
        );
    }

    private AgendamentoResponse agendamentoResponse() {
        Sala sala = Sala.builder()
                .id(12L)
                .nome("Sala Focus")
                .capacidade(8)
                .disponivel(true)
                .build();

        return new AgendamentoResponse(
                sala,
                LocalDate.now().plusDays(1),
                LocalDateTime.now(),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                4,
                "Reunião de alinhamento",
                null,
                StatusAgendamento.CONFIRMADO
        );
    }
}
