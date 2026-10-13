package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.dto.request.CriarAgendamentoRequest;
import br.com.foursys.agendamento_salas.dto.request.CriarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.service.SalaService;
import io.jsonwebtoken.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salas")
public class SalaController {

    private final SalaService salaService;

    public SalaController(SalaService salaService) {
        this.salaService = salaService;
    }

    @PostMapping("admin/criar")
    public ResponseEntity<SalaResponse> criar(
            @RequestBody CriarSalaRequest request,
            @AuthenticationPrincipal Jwt usuarioId
    ) {
        SalaResponse response = salaService.criar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sala> buscarPorId(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(salaService.buscarPorId(id));
    }

    @GetMapping("disponiveis")
    public ResponseEntity<List<SalaResponse>> buscarDisponiveis(
            @RequestBody CriarAgendamentoRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                salaService.buscarSalasDisponiveis(
                        request.data(),
                        request.horaInicio(),
                        request.horaFim(), request.qntdPessoas(),
                        emailDoUsuario(authentication)
                  )
        );
    }

    private String emailDoUsuario(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        return authentication.getName();
    }
}
