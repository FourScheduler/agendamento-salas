package br.com.foursys.agendamento_salas.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record CriarAgendamentoRequest(
        @NotNull(message = "Informe a sala do agendamento.")
        SalaRef salaId,
        @NotNull(message = "Informe a data do agendamento.")
        LocalDate data,
        @NotNull(message = "Informe o horário inicial do agendamento.")
        LocalTime horaInicio,
        @NotNull(message = "Informe o horário final do agendamento.")
        LocalTime horaFim,
        @NotNull(message = "Informe a quantidade de pessoas.")
        @Min(value = 1, message = "A quantidade de pessoas deve ser ao menos 1.")
        Integer qntdPessoas,
        UsuarioRef usuarioIdSolicitante,
        String titulo
) {
    public record SalaRef(Long id) {
    }

    public record UsuarioRef(Long id) {
    }
}
