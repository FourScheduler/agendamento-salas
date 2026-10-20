package br.com.foursys.agendamento_salas.infrastructure.persistence.repository;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AgendamentoJpaRepository extends JpaRepository<Agendamento, Long>, JpaSpecificationExecutor<Agendamento> {
    List<Agendamento> findByUsuarioId_Id(Long id);

    List<Agendamento> findByDataAgendamentoAndStatus(LocalDate dataAgendamento, StatusAgendamento status);

    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM Agendamento a
            WHERE a.salaId.id = :salaId
              AND a.dataAgendamento = :dataAgendamento
              AND a.dataCancelamento IS NULL
              AND a.horaInicio < :horaFim
              AND a.horaFim > :horaInicio
            """)
    boolean existeConflito(
            @Param("salaId") Long salaId,
            @Param("dataAgendamento") LocalDate dataAgendamento,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFim") LocalTime horaFim
    );
}
