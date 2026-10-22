package br.com.foursys.agendamento_salas.infrastructure.persistence.repository;

import br.com.foursys.agendamento_salas.domain.Sala;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface SalaJpaRepository extends JpaRepository<Sala, Long> {
    boolean existsByNomeIgnoreCase(String nome);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Sala s WHERE s.id = :id")
    Optional<Sala> buscarComBloqueio(@Param("id") Long id);


    @Query("""
    SELECT s
    FROM Sala s
    WHERE s.disponivel = true
      AND (s.capacidade IS NULL OR s.capacidade >= :pessoas)
      AND NOT EXISTS (
          SELECT a
          FROM Agendamento a
          WHERE a.salaId = s
            AND a.dataAgendamento = :data
            AND a.horaInicio < :fim
            AND a.horaFim > :inicio
            AND a.status = br.com.foursys.agendamento_salas.enums.StatusAgendamento.CONFIRMADO
      )
    """)
    List<Sala> buscarSalasDisponiveis(
            @Param("data") LocalDate data,
            @Param("inicio") LocalTime inicio,
            @Param("fim") LocalTime fim,
            @Param("pessoas") Integer pessoas
    );


}
