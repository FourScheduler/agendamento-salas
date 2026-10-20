package br.com.foursys.agendamento_salas.dto.response;

import java.time.LocalTime;

/**
 * Janela ocupada por uma reserva confirmada em uma data.
 * A planta do agendamento usa a lista do dia para mostrar quando cada sala fica livre.
 */
public record OcupacaoSalaResponse(
        Long salaId,
        LocalTime horaInicio,
        LocalTime horaFim
) {

}
