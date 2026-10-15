package br.com.foursys.agendamento_salas.dto.request;

import jakarta.validation.constraints.NotNull;

public record SelecionarSalaRequest(
        @NotNull(message = "Informe a sala escolhida.")
        Long salaId
) {
}
