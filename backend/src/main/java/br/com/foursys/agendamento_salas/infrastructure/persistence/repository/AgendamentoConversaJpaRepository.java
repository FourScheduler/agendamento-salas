package br.com.foursys.agendamento_salas.infrastructure.persistence.repository;

import br.com.foursys.agendamento_salas.domain.AgendamentoConversa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgendamentoConversaJpaRepository extends JpaRepository<AgendamentoConversa, Long> {
}
