package br.com.foursys.agendamento_salas.infrastructure.persistence.repository;

import br.com.foursys.agendamento_salas.domain.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface SalaJpaRepository extends JpaRepository<Sala, Long> {
    boolean existsByNomeIgnoreCase(String nome);


    @Query("""
    SELECT s
    FROM Sala s
    WHERE s.disponivel = true
      AND s.capacidade >= :pessoas
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
