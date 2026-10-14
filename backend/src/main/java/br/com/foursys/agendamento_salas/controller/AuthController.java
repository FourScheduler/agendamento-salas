package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.dto.request.LoginRequest;
import br.com.foursys.agendamento_salas.security.CustomUserDetailsService;
import br.com.foursys.agendamento_salas.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    /** Usuário de teste do seed Flyway, usado apenas pelo login de demonstração. */
    public static final String EMAIL_DEMO = "usuario@teste.com";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final boolean demoEnabled;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            @Value("${app.auth.demo-enabled:false}") boolean demoEnabled
    ) {

        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.demoEnabled = demoEnabled;
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(
            @RequestBody LoginRequest request) {

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.email(),
                                request.password()
                        )
                );

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(token);
    }

    /**
     * Emite token do usuário de teste sem senha. Existe somente enquanto o login
     * da aplicação for mockado; será removido quando o SSO do portal entrar.
     */
    @PostMapping("/demo")
    public ResponseEntity<String> demo() {
        if (!demoEnabled) {
            return ResponseEntity.notFound().build();
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(EMAIL_DEMO);
        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(token);
    }
}
