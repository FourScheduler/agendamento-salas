package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.dto.request.CriarUsuarioRequest;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.exception.UsuarioInexistenteException;
import br.com.foursys.agendamento_salas.exception.UsuarioJaExisteException;
import br.com.foursys.agendamento_salas.port.out.UsuarioRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {
    private final UsuarioRepositoryPort usuarioRepositoryPort;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepositoryPort usuarioRepositoryPort, PasswordEncoder passwordEncoder) {
        this.usuarioRepositoryPort = usuarioRepositoryPort;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario criar (CriarUsuarioRequest request){

        if (usuarioRepositoryPort.buscarUsuarioEmail(request.email()).isPresent()){
            throw new UsuarioJaExisteException();
        }

        Usuario usuario = new Usuario();

        usuario.setEmail(request.email());
        usuario.setNome(request.nome());

        usuario.setPassword(
                passwordEncoder.encode(request.password())
        );

        usuario.setPerfilUsuario(request.perfilUsuario());

        return usuarioRepositoryPort.salvar(usuario);

    }

    public Usuario buscarPorEmail(String email){
        return usuarioRepositoryPort.buscarUsuarioEmail(email).orElseThrow(UsuarioInexistenteException::new);
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepositoryPort.buscarPorId(id).orElseThrow(UsuarioInexistenteException::new);
    }

}
