package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.EnviarMensagemRequest;
import br.com.foursys.agendamento_salas.dto.request.SelecionarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.IniciarConversaResponse;
import br.com.foursys.agendamento_salas.dto.response.OrquestradorAgendamentoResponse;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.OrquestradorAgendamentoService;
import br.com.foursys.agendamento_salas.service.UsuarioService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agendamento/conversas")
public class AgendamentoConversaController {

    private static final Logger log = LoggerFactory.getLogger(AgendamentoConversaController.class);

    private final OrquestradorAgendamentoService orquestradorAgendamentoService;
    private final UsuarioService usuarioService;
    private final SecurityUtils securityUtils;

    public AgendamentoConversaController(
            OrquestradorAgendamentoService orquestradorAgendamentoService,
            UsuarioService usuarioService,
            SecurityUtils securityUtils
    ) {
        this.orquestradorAgendamentoService = orquestradorAgendamentoService;
        this.usuarioService = usuarioService;
        this.securityUtils = securityUtils;
    }

    @PostMapping
    public ResponseEntity<IniciarConversaResponse> iniciarConversa(Authentication authentication) {

        Usuario usuario = usuarioService.buscarPorEmail(authentication.getName());

        IniciarConversaResponse response = orquestradorAgendamentoService.iniciarConversa(usuario);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/mensagens")
    public ResponseEntity<OrquestradorAgendamentoResponse> processarMensagem(
            @Valid @RequestBody EnviarMensagemRequest request) {

        Long usuarioId = securityUtils.get().id();

        OrquestradorAgendamentoResponse response =  orquestradorAgendamentoService.processarMensagem(
                request.conversaId(),
                request.mensagem(),
                usuarioId
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }

    @PatchMapping("/{conversaId}/selecionar")
    public ResponseEntity<OrquestradorAgendamentoResponse> selecionarSala(
            @PathVariable Long conversaId,
            @Valid @RequestBody SelecionarSalaRequest request
            ){
        Long usuarioId = securityUtils.get().id();

        OrquestradorAgendamentoResponse response = orquestradorAgendamentoService.selecionarSala(
                conversaId,
                request,
                usuarioId
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }

    @PostMapping("/{conversaId}/confirmar")
    public ResponseEntity<OrquestradorAgendamentoResponse> confirmarAgendamento(
            @PathVariable Long conversaId
    ){
        Long usuarioId = securityUtils.get().id();
        log.info("Recebida confirmacao pelo assistente. conversaId={}, usuarioId={}", conversaId, usuarioId);

        OrquestradorAgendamentoResponse response = orquestradorAgendamentoService.confirmarAgendamento(
                conversaId,
                usuarioId
        );
        log.info(
                "Confirmacao pelo assistente concluida. conversaId={}, usuarioId={}, estado={}",
                conversaId,
                usuarioId,
                response.estado()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
