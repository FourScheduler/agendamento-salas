package br.com.foursys.agendamento_salas.dto.response;

import br.com.foursys.agendamento_salas.enums.PerfilUsuario;

public record UsuarioResponse(
        Long id,
        String email,
        String nome,
        PerfilUsuario perfilUsuario
) {
}
