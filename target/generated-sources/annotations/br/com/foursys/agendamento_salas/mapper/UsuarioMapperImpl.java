package br.com.foursys.agendamento_salas.mapper;

import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.response.UsuarioResponse;
import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-16T08:38:08-0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.11 (Azul Systems, Inc.)"
)
@Component
public class UsuarioMapperImpl implements UsuarioMapper {

    @Override
    public UsuarioResponse toResponse(Usuario usuario) {
        if ( usuario == null ) {
            return null;
        }

        Long id = null;
        String email = null;
        String nome = null;
        PerfilUsuario perfilUsuario = null;

        id = usuario.getId();
        email = usuario.getEmail();
        nome = usuario.getNome();
        perfilUsuario = usuario.getPerfilUsuario();

        UsuarioResponse usuarioResponse = new UsuarioResponse( id, email, nome, perfilUsuario );

        return usuarioResponse;
    }
}
