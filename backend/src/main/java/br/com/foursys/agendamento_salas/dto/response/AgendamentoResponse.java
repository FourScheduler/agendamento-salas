package br.com.foursys.agendamento_salas.dto.response;

import br.com.foursys.agendamento_salas.enums.StatusAgendamento;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AgendamentoResponse(
        SalaResponse salaId,
        LocalDate dataAgendamento,
        LocalDateTime dataCriacao,
        LocalTime horaInicio,
        LocalTime horaFim,
        Integer qntdPessoas,
        String titulo,
        UsuarioResponse usuarioIdSolicitante,
        StatusAgendamento status
) {
}
