package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.dto.response.InterpretarAgendamentoResponse;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.OllamaService;
import br.com.foursys.agendamento_salas.service.OrquestradorAgendamentoService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ollama")
public class OllamaController {

    private final OllamaService ollamaService;
    private final OrquestradorAgendamentoService orquestradorAgendamentoService;
    private final SecurityUtils securityUtils;

    public OllamaController(
            OllamaService ollamaService,
            OrquestradorAgendamentoService orquestradorAgendamentoService,
            SecurityUtils securityUtils
    ) {
        this.ollamaService = ollamaService;
        this.orquestradorAgendamentoService = orquestradorAgendamentoService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("{conversaId}/interpretar")
    public InterpretarAgendamentoResponse interpretar(
            @PathVariable Long conversaId,
            @RequestParam String mensagem
    ) {
        Long usuarioId = securityUtils.get().id();

        var conversa = orquestradorAgendamentoService.buscarConversaDoUsuario(conversaId, usuarioId);

        return ollamaService.interpretarAgendamento(
                mensagem,
                conversa.getDataAgendamento(),
                conversa.getHoraInicio(),
                conversa.getHoraFim(),
                conversa.getQntdPessoas(),
                conversa.getLocalizacao()
        );
    }
}
