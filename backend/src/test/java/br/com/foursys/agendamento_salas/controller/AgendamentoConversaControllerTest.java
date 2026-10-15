
package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.EnviarMensagemRequest;
import br.com.foursys.agendamento_salas.dto.request.SelecionarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.IniciarConversaResponse;
import br.com.foursys.agendamento_salas.dto.response.OrquestradorAgendamentoResponse;
import br.com.foursys.agendamento_salas.security.AuthenticatedUser;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.OrquestradorAgendamentoService;
import br.com.foursys.agendamento_salas.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgendamentoConversaControllerTest {

    private OrquestradorAgendamentoService orquestradorAgendamentoService;
    private UsuarioService usuarioService;
    private SecurityUtils securityUtils;
    private AgendamentoConversaController controller;

    @BeforeEach
    void setUp() {
        orquestradorAgendamentoService = mock(OrquestradorAgendamentoService.class);
        usuarioService = mock(UsuarioService.class);
        securityUtils = mock(SecurityUtils.class);
        controller = new AgendamentoConversaController(
                orquestradorAgendamentoService,
                usuarioService,
                securityUtils
        );
    }

    @Test
    void deveIniciarConversaComSucesso() {
        Authentication authentication = mock(Authentication.class);
        Usuario usuario = mock(Usuario.class);
        IniciarConversaResponse response = mock(IniciarConversaResponse.class);

        when(authentication.getName()).thenReturn("usuario@teste.com");
        when(usuarioService.buscarPorEmail("usuario@teste.com"))
                .thenReturn(usuario);
        when(orquestradorAgendamentoService.iniciarConversa(usuario))
                .thenReturn(response);

        ResponseEntity<IniciarConversaResponse> resultado =
                controller.iniciarConversa(authentication);

        assertEquals(HttpStatus.CREATED, resultado.getStatusCode());
        assertSame(response, resultado.getBody());

        verify(usuarioService).buscarPorEmail("usuario@teste.com");
        verify(orquestradorAgendamentoService).iniciarConversa(usuario);
    }

    @Test
    void deveProcessarMensagemComUsuarioAutenticado() {
        EnviarMensagemRequest request = mock(EnviarMensagemRequest.class);
        OrquestradorAgendamentoResponse response =
                mock(OrquestradorAgendamentoResponse.class);

        when(securityUtils.get()).thenReturn(new AuthenticatedUser(42L, "usuario@teste.com"));
        when(request.conversaId()).thenReturn(1L);
        when(request.mensagem()).thenReturn(
                "Quero reservar uma sala amanhã às 14h"
        );
        when(orquestradorAgendamentoService.processarMensagem(
                1L,
                "Quero reservar uma sala amanhã às 14h",
                42L
        )).thenReturn(response);

        ResponseEntity<OrquestradorAgendamentoResponse> resultado =
                controller.processarMensagem(request);

        assertEquals(HttpStatus.OK, resultado.getStatusCode());
        assertSame(response, resultado.getBody());

        verify(orquestradorAgendamentoService).processarMensagem(
                1L,
                "Quero reservar uma sala amanhã às 14h",
                42L
        );
    }

    @Test
    void deveSelecionarSalaComUsuarioAutenticado() {
        Long conversaId = 1L;
        SelecionarSalaRequest request = mock(SelecionarSalaRequest.class);
        OrquestradorAgendamentoResponse response =
                mock(OrquestradorAgendamentoResponse.class);

        when(securityUtils.get()).thenReturn(new AuthenticatedUser(42L, "usuario@teste.com"));
        when(orquestradorAgendamentoService.selecionarSala(
                conversaId,
                request,
                42L
        )).thenReturn(response);

        ResponseEntity<OrquestradorAgendamentoResponse> resultado =
                controller.selecionarSala(conversaId, request);

        assertEquals(HttpStatus.OK, resultado.getStatusCode());
        assertSame(response, resultado.getBody());

        verify(orquestradorAgendamentoService)
                .selecionarSala(conversaId, request, 42L);
    }

    @Test
    void deveConfirmarAgendamentoComUsuarioAutenticado() {
        Long conversaId = 1L;
        OrquestradorAgendamentoResponse response =
                mock(OrquestradorAgendamentoResponse.class);

        when(securityUtils.get()).thenReturn(new AuthenticatedUser(42L, "usuario@teste.com"));
        when(orquestradorAgendamentoService.confirmarAgendamento(conversaId, 42L))
                .thenReturn(response);

        ResponseEntity<OrquestradorAgendamentoResponse> resultado =
                controller.confirmarAgendamento(conversaId);

        assertEquals(HttpStatus.CREATED, resultado.getStatusCode());
        assertSame(response, resultado.getBody());

        verify(orquestradorAgendamentoService)
                .confirmarAgendamento(conversaId, 42L);
    }
}
