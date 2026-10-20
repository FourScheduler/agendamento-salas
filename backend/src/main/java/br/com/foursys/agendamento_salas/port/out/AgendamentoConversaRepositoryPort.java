package br.com.foursys.agendamento_salas.port.out;

import br.com.foursys.agendamento_salas.domain.AgendamentoConversa;
import br.com.foursys.agendamento_salas.domain.Sala;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public interface AgendamentoConversaRepositoryPort {
    Optional<AgendamentoConversa> buscarPorId(Long id);
    AgendamentoConversa salvar(AgendamentoConversa conversa);
}
