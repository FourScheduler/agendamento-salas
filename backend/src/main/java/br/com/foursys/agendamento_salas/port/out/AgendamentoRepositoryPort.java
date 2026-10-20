package br.com.foursys.agendamento_salas.port.out;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Component
public interface AgendamentoRepositoryPort {
    List<Agendamento> salvar(List<Agendamento> agendamento);

    List<Agendamento> buscarFiltrados(
            Long usuarioId,
            LocalDate dataInicio,
            LocalDate dataFim,
            StatusAgendamento status
    );

    boolean existeConflito(Long salaId, LocalDate dataAgendamento,
                           LocalTime horaInicio, LocalTime horaFim);

    /** Reservas confirmadas de uma data, para a planta calcular quando cada sala fica livre. */
    List<Agendamento> buscarPorData(LocalDate dataAgendamento);

    void cancelar(Agendamento agendamento);

    Optional<Agendamento> buscarPorId(Long id);
}