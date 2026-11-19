package br.com.foursys.agendamento_salas.infrastructure.persistence.adapter;

import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.infrastructure.persistence.repository.UsuarioJpaRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UsuarioRepositoryAdapterTest {

    @Test
    void deveDelegarOperacoesDeUsuarioAoRepositorioJpa() {
        UsuarioJpaRepository jpaRepository = mock(UsuarioJpaRepository.class);
        UsuarioRepositoryAdapter adapter = new UsuarioRepositoryAdapter(jpaRepository);
        Usuario usuario = new Usuario();
        usuario.setId(9L);
        usuario.setEmail("ana@example.com");
        when(jpaRepository.save(usuario)).thenReturn(usuario);
        when(jpaRepository.findById(9L)).thenReturn(Optional.of(usuario));
        when(jpaRepository.findByEmail("ana@example.com")).thenReturn(Optional.of(usuario));

        assertSame(usuario, adapter.salvar(usuario));
        assertEquals(Optional.of(usuario), adapter.buscarPorId(9L));
        assertEquals(Optional.of(usuario), adapter.buscarUsuarioEmail("ana@example.com"));

        verify(jpaRepository).save(usuario);
        verify(jpaRepository).findById(9L);
        verify(jpaRepository).findByEmail("ana@example.com");
    }

    @Test
    void deveListarTodosUsuariosOrdenadosPorNome() {
        UsuarioJpaRepository jpaRepository = mock(UsuarioJpaRepository.class);
        UsuarioRepositoryAdapter adapter = new UsuarioRepositoryAdapter(jpaRepository);
        java.util.List<Usuario> usuarios = java.util.List.of(new Usuario(), new Usuario());
        when(jpaRepository.findAllByOrderByNomeAsc()).thenReturn(usuarios);

        assertEquals(usuarios, adapter.buscarTodos());
        verify(jpaRepository).findAllByOrderByNomeAsc();
    }
}
