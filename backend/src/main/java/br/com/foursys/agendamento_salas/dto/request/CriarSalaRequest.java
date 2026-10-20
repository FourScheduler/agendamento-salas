package br.com.foursys.agendamento_salas.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CriarSalaRequest(
        @NotBlank(message = "Informe o nome da sala.")
        String nome,
        @NotNull(message = "Informe a capacidade da sala.")
        @Min(value = 1, message = "A capacidade deve ser ao menos 1.")
        Integer capacidade,
        @NotBlank(message = "Informe a localização da sala.")
        String localizacao
) {

}
