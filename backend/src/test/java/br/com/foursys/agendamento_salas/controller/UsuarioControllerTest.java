package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.CriarUsuarioRequest;
import br.com.foursys.agendamento_salas.dto.response.UsuarioResponse;
import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import br.com.foursys.agendamento_salas.mapper.UsuarioMapper;
import br.com.foursys.agendamento_salas.security.AuthenticatedUser;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UsuarioControllerTest {

    @Test
    void deveCriarUsuarioERetornarCreatedComUsuarioCriado() {
        UsuarioService service = mock(UsuarioService.class);
        UsuarioMapper mapper = mock(UsuarioMapper.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        UsuarioController controller = new UsuarioController(service, mapper, securityUtils);
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                "ana@example.com", "Ana", "senha-hash", PerfilUsuario.USER
        );
        Usuario usuario = new Usuario();
        usuario.setId(3L);
        usuario.setEmail("ana@example.com");
        UsuarioResponse usuarioResponse = new UsuarioResponse(
                3L, "ana@example.com", "Ana", PerfilUsuario.USER
        );
        when(service.criar(request)).thenReturn(usuario);
        when(mapper.toResponse(usuario)).thenReturn(usuarioResponse);

        var response = controller.criar(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertSame(usuarioResponse, response.getBody());
    }

    @Test
    void deveRetornarPerfilDoUsuarioAutenticadoEmMe() {
        UsuarioService service = mock(UsuarioService.class);
        UsuarioMapper mapper = mock(UsuarioMapper.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        UsuarioController controller = new UsuarioController(service, mapper, securityUtils);
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("ana@example.com");
        usuario.setNome("Ana");
        usuario.setPerfilUsuario(PerfilUsuario.USER);
        UsuarioResponse usuarioResponse = new UsuarioResponse(
                1L, "ana@example.com", "Ana", PerfilUsuario.USER
        );
        when(securityUtils.get()).thenReturn(new AuthenticatedUser(1L, "ana@example.com"));
        when(service.buscarPorId(1L)).thenReturn(usuario);
        when(mapper.toResponse(usuario)).thenReturn(usuarioResponse);

        var response = controller.buscarMe();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(usuarioResponse, response.getBody());
    }
}
