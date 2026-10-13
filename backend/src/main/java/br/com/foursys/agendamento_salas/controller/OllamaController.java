package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.AgendamentoConversa;
import br.com.foursys.agendamento_salas.dto.response.InterpretarAgendamentoResponse;
import br.com.foursys.agendamento_salas.service.OllamaService;
import br.com.foursys.agendamento_salas.service.OrquestradorAgendamentoService;
import jakarta.websocket.server.PathParam;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ollama")
public class OllamaController {

    private final OllamaService ollamaService;
    private final OrquestradorAgendamentoService orquestradorAgendamentoService;

    public OllamaController(OllamaService ollamaService, OrquestradorAgendamentoService orquestradorAgendamentoService) {
        this.ollamaService = ollamaService;
        this.orquestradorAgendamentoService = orquestradorAgendamentoService;
    }

    @GetMapping("{conversaId}/interpretar")
    public InterpretarAgendamentoResponse interpretar(
            @PathVariable Long conversaId,
            @RequestParam String mensagem
    ) {
        AgendamentoConversa conversa = orquestradorAgendamentoService.buscarConversa(conversaId);
        return ollamaService.interpretarAgendamento(mensagem,conversa.getDataAgendamento(),conversa.getHoraInicio(),conversa.getHoraFim(),conversa.getQntdPessoas(), conversa.getLocalizacao());
    }
}
