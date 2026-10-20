package br.com.foursys.agendamento_salas.dto.response;

import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import lombok.Builder;

@Builder
public record IniciarConversaResponse(
        Long conversaId,
        StatusAgendamento status
) {

}
