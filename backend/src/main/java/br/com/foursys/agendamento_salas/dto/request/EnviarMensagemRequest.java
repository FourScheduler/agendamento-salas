package br.com.foursys.agendamento_salas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EnviarMensagemRequest(
        @NotNull(message = "Informe a conversa.")
        Long conversaId,
        @NotBlank(message = "Informe a mensagem.")
        String mensagem
) {
}
