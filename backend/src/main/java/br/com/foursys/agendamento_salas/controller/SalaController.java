package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.dto.request.CriarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.exception.ValidacaoBuscaException;
import br.com.foursys.agendamento_salas.service.SalaService;
import io.jsonwebtoken.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
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
            @RequestParam String data,
            @RequestParam String inicio,
            @RequestParam(required = false) String fim,
            @RequestParam(required = false) Integer duracao,
            @RequestParam Integer pessoas,
            Authentication authentication
    ) {
        LocalDate dataReserva = parseData(data);
        LocalTime horaInicio = parseHora(inicio);
        LocalTime horaFim = calcularFim(horaInicio, fim, duracao);

        return ResponseEntity.ok(
                salaService.buscarSalasDisponiveis(
                        dataReserva,
                        horaInicio,
                        horaFim, pessoas,
                        emailDoUsuario(authentication)
                  )
        );
    }

    private LocalDate parseData(String valor) {
        try {
            return LocalDate.parse(valor);
        } catch (DateTimeParseException excecao) {
            throw new ValidacaoBuscaException("A data deve estar no formato yyyy-MM-dd.");
        }
    }

    private LocalTime parseHora(String valor) {
        try {
            return LocalTime.parse(valor);
        } catch (DateTimeParseException excecao) {
            throw new ValidacaoBuscaException("O horário deve estar no formato HH:mm.");
        }
    }

    private LocalTime calcularFim(LocalTime horaInicio, String fim, Integer duracao) {
        if (fim != null && !fim.isBlank()) {
            return parseHora(fim);
        }

        if (duracao != null) {
            if (duracao < 1) {
                throw new ValidacaoBuscaException("A duração deve ser de ao menos 1 minuto.");
            }
            return horaInicio.plusMinutes(duracao);
        }

        return null;
    }

    private String emailDoUsuario(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        return authentication.getName();
    }
}
