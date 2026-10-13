package br.com.foursys.agendamento_salas.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record InterpretarAgendamentoResponse(
        CampoInterpretado<LocalDate> data,
        CampoInterpretado<LocalTime> inicio,
        CampoInterpretado<LocalTime> fim,
        CampoInterpretado<Integer> quantidadePessoas,
        CampoInterpretado<String> localizacao
) {
}
