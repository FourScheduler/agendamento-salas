package br.com.foursys.agendamento_salas.infrastructure.persistence.repository;

import br.com.foursys.agendamento_salas.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioJpaRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    List<Usuario> findAllByOrderByNomeAsc();
}
