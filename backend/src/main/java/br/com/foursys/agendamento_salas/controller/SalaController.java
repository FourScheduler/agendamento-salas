package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.dto.request.CriarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.mapper.SalaMapper;
import br.com.foursys.agendamento_salas.service.SalaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/salas")
public class SalaController {

    private final SalaService salaService;
    private final SalaMapper salaMapper;

    public SalaController(SalaService salaService, SalaMapper salaMapper) {
        this.salaService = salaService;
        this.salaMapper = salaMapper;
    }

    @PostMapping("admin/criar")
    public ResponseEntity<SalaResponse> criar(
            @Valid @RequestBody CriarSalaRequest request
    ) {
        SalaResponse response = salaService.criar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaResponse> buscarPorId(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(salaMapper.entityToResponse(salaService.buscarPorId(id)));
    }

    /**
     * Busca em GET com query params: navegadores não enviam corpo em GET,
     * então os filtros vão na URL.
     */
    @GetMapping("disponiveis")
    public ResponseEntity<List<SalaResponse>> buscarDisponiveis(
            @RequestParam LocalDate data,
            @RequestParam LocalTime horaInicio,
            @RequestParam(required = false) LocalTime horaFim,
            @RequestParam int qntdPessoas,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                salaService.buscarSalasDisponiveis(
                        data,
                        horaInicio,
                        horaFim, qntdPessoas,
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
