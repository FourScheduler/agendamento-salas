package br.com.foursys.agendamento_salas.dto.request;

import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CriarUsuarioRequest(
        @NotBlank(message = "Informe o e-mail do usuário.")
        @Email(message = "Informe um e-mail válido.")
        String email,
        @NotBlank(message = "Informe o nome do usuário.")
        String nome,
        @NotBlank(message = "Informe a senha do usuário.")
        String password,
        @NotNull(message = "Informe o perfil do usuário.")
        PerfilUsuario perfilUsuario
) {
}
