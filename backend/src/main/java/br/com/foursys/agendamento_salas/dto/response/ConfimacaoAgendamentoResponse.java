package br.com.foursys.agendamento_salas.dto.response;

import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import lombok.Builder;

import java.time.LocalTime;
import java.util.List;

@Builder
public record ConfimacaoAgendamentoResponse (
        Long id,
        SalaResponse sala,
        LocalTime inicio,
        LocalTime fim,
        StatusAgendamento status,
        UsuarioResponse solicitante,
        List<AgendamentoCriado> agendamentos
){
    public record AgendamentoCriado(Long id, SalaResponse sala) {
    }
}
