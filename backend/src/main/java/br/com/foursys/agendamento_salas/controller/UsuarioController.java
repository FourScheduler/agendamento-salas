package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.CriarUsuarioRequest;
import br.com.foursys.agendamento_salas.dto.response.UsuarioResponse;
import br.com.foursys.agendamento_salas.mapper.UsuarioMapper;
import br.com.foursys.agendamento_salas.security.AuthenticatedUser;
import br.com.foursys.agendamento_salas.security.SecurityUtils;
import br.com.foursys.agendamento_salas.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final UsuarioMapper usuarioMapper;
    private final SecurityUtils securityUtils;

    public UsuarioController(
            UsuarioService usuarioService,
            UsuarioMapper usuarioMapper,
            SecurityUtils securityUtils
    ) {
        this.usuarioService = usuarioService;
        this.usuarioMapper = usuarioMapper;
        this.securityUtils = securityUtils;
    }

    /** Perfil do próprio usuário autenticado. Usado pelo front após o login. */
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> buscarMe() {
        AuthenticatedUser autenticado = securityUtils.get();

        return ResponseEntity.ok(
                usuarioMapper.toResponse(usuarioService.buscarPorId(autenticado.id()))
        );
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> criar(
            @Valid @RequestBody CriarUsuarioRequest request
    ) {
        Usuario usuario = usuarioService.criar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(usuarioMapper.toResponse(usuario));
    }

    /**
     * Lista os usuários cadastrados para o agendamento administrativo
     * escolher o solicitante; restrito a ADMIN pelo SecurityConfig.
     */
    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listar() {
        List<UsuarioResponse> usuarios = usuarioService.listarTodos().stream()
                .map(usuarioMapper::toResponse)
                .toList();

        return ResponseEntity.ok(usuarios);
    }
}