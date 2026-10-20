package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.dto.request.CriarAgendamentoRequest;
import br.com.foursys.agendamento_salas.dto.response.AgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.ConfimacaoAgendamentoResponse;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.AgendamentoService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/agendamento")
public class AgendamentoController {

    private static final Logger log = LoggerFactory.getLogger(AgendamentoController.class);

    private final AgendamentoService agendamentoService;
    private final SecurityUtils securityUtils;

    public AgendamentoController(AgendamentoService agendamentoService, SecurityUtils securityUtils) {
        this.agendamentoService = agendamentoService;
        this.securityUtils = securityUtils;
    }

    @PostMapping
    public ResponseEntity<ConfimacaoAgendamentoResponse> criar(
            @Valid @RequestBody CriarAgendamentoRequest agendamentoRequest
    ) {

        Long usuarioAutenticado = securityUtils.get().id();
        List<Long> salaIds = agendamentoRequest.salaId()
                .stream()
                .map(CriarAgendamentoRequest.SalaRef::id)
                .toList();


        log.info(
                "Recebida criacao de agendamento. usuarioId={}, salasId={}, data={}, inicio={}, fim={}, pessoas={}",
                usuarioAutenticado,
                salaIds,
                agendamentoRequest.data(),
                agendamentoRequest.horaInicio(),
                agendamentoRequest.horaFim(),
                agendamentoRequest.qntdPessoas()
        );

        ConfimacaoAgendamentoResponse response = agendamentoService.criar(agendamentoRequest, usuarioAutenticado);
        log.info(
                "Agendamento criado com sucesso. agendamentos={}, usuarioId={}, salasId={}, status={}",
                response.agendamentos().stream()
                        .map(ConfimacaoAgendamentoResponse.AgendamentoCriado::id)
                        .toList(),
                usuarioAutenticado,
                salaIds,
                response.status()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /** Busca em GET com query params: navegadores não enviam corpo em GET. */
    @GetMapping("/busca")
    public ResponseEntity<List<AgendamentoResponse>> buscaAgendamentos(
            @RequestParam(defaultValue = "false") boolean todosUsuarios
            ) {
        Long usuarioAutenticado = securityUtils.get().id();

        List<AgendamentoResponse> listaAgendamentos = agendamentoService
                .buscaAgendamentos(usuarioAutenticado, todosUsuarios);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(listaAgendamentos);
    }

    @GetMapping("/busca/filtro")
    public ResponseEntity<List<AgendamentoResponse>> buscaFiltrada(
            @RequestParam(required = false) LocalDate dataInicio,
            @RequestParam(required = false) LocalDate dataFinal,
            @RequestParam(required = false) StatusAgendamento statusAgendamento,
            @RequestParam(defaultValue = "false") boolean todosUsuarios
    ) {
        Long usuarioAutenticado = securityUtils.get().id();

        List<AgendamentoResponse> listaAgendamentosFiltrado = agendamentoService.buscaFiltrada(
                usuarioAutenticado, dataInicio,
                dataFinal, statusAgendamento,
                todosUsuarios);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(listaAgendamentosFiltrado);
    }

    @DeleteMapping("/cancelar/{id}")
    public ResponseEntity<Void> cancelarAgendamento(
            @PathVariable Long id
    ) {
        Long usuarioAutenticado = securityUtils.get().id();

        agendamentoService.cancelarAgendamento(id, usuarioAutenticado);

        return ResponseEntity
                .status(HttpStatus.OK)
                .build();
    }
}
