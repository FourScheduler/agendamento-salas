package br.com.foursys.agendamento_salas.port.out;

import br.com.foursys.agendamento_salas.domain.Log;

public interface LogRepositoryPort {
    Log salvar(Log log);
}
