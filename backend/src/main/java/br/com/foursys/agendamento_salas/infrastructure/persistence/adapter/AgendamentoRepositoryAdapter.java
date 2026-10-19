package br.com.foursys.agendamento_salas.infrastructure.persistence.adapter;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import br.com.foursys.agendamento_salas.infrastructure.persistence.repository.AgendamentoJpaRepository;
import br.com.foursys.agendamento_salas.infrastructure.persistence.specification.AgendamentoSpecification;
import br.com.foursys.agendamento_salas.port.out.AgendamentoRepositoryPort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Component
public class AgendamentoRepositoryAdapter implements AgendamentoRepositoryPort {
    private final AgendamentoJpaRepository agendamentoJpaRepository;

    public AgendamentoRepositoryAdapter(AgendamentoJpaRepository agendamentoJpaRepository) {
        this.agendamentoJpaRepository = agendamentoJpaRepository;
    }

    @Override
    public List<Agendamento> salvar(List<Agendamento> agendamentos) {
        return agendamentoJpaRepository.saveAll(agendamentos);
    }

    @Override
    public List<Agendamento> buscarFiltrados(
            Long usuarioId,
            LocalDate dataInicio,
            LocalDate dataFim,
            StatusAgendamento status) {

        Specification<Agendamento> specification =
                AgendamentoSpecification.filtros(
                        usuarioId,
                        dataInicio,
                        dataFim,
                        status
                );

        return agendamentoJpaRepository.findAll(specification);
    }

    @Override
    public boolean existeConflito(Long salaId, LocalDate dataAgendamento, LocalTime horaInicio, LocalTime horaFim) {
        return agendamentoJpaRepository.existeConflito(salaId, dataAgendamento, horaInicio, horaFim);
    }

    @Override
    public void cancelar(Agendamento agendamento) {
        agendamentoJpaRepository.save(agendamento);
    }

    @Override
    public Optional<Agendamento> buscarPorId(Long id) {
        return agendamentoJpaRepository.findById(id);
    }
}
