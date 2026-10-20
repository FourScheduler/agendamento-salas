package br.com.foursys.agendamento_salas.infrastructure.persistence.adapter;

import br.com.foursys.agendamento_salas.domain.AgendamentoConversa;
import br.com.foursys.agendamento_salas.infrastructure.persistence.repository.AgendamentoConversaJpaRepository;
import br.com.foursys.agendamento_salas.port.out.AgendamentoConversaRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AgendamentoConversaAdapter implements AgendamentoConversaRepositoryPort {

    private final AgendamentoConversaJpaRepository agendamentoConversaJpaRepository;

    public AgendamentoConversaAdapter(AgendamentoConversaJpaRepository agendamentoConversaJpaRepository) {
        this.agendamentoConversaJpaRepository = agendamentoConversaJpaRepository;
    }

    @Override
    public Optional<AgendamentoConversa> buscarPorId(Long id) {
        return agendamentoConversaJpaRepository.findById(id);
    }

    @Override
    public AgendamentoConversa salvar(AgendamentoConversa conversa) {
        return agendamentoConversaJpaRepository.save(conversa);
    }
}
