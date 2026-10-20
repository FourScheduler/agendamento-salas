package br.com.foursys.agendamento_salas.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record CriarAgendamentoRequest(
        @NotEmpty(message = "Informe ao menos uma sala para o agendamento.")
        List<@Valid SalaRef> salaId,
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
    public record SalaRef(@NotNull(message = "Informe o identificador da sala.") Long id) {
    }

    public record UsuarioRef(Long id) {
    }
}
