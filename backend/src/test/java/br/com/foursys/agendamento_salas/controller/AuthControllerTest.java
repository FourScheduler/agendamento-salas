package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.dto.request.LoginRequest;
import br.com.foursys.agendamento_salas.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Test
    void deveAutenticarCredenciaisEDevolverToken() {
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        JwtService jwtService = mock(JwtService.class);
        AuthController controller = new AuthController(authenticationManager, jwtService);
        UserDetails user = User.withUsername("ana@example.com").password("hash").roles("USER").build();
        Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        var response = controller.login(new LoginRequest("ana@example.com", "senha"));

        assertEquals(200, response.getStatusCode().value());
        assertEquals("jwt-token", response.getBody());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(user);
    }

    @Test
    void devePropagarFalhaQuandoCredenciaisForemInvalidas() {
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        JwtService jwtService = mock(JwtService.class);
        AuthController controller = new AuthController(authenticationManager, jwtService);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Credenciais inválidas"));

        assertThrows(BadCredentialsException.class,
                () -> controller.login(new LoginRequest("ana@example.com", "incorreta")));
    }
}
