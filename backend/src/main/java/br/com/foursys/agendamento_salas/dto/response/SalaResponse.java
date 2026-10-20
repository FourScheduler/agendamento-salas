package br.com.foursys.agendamento_salas.dto.response;

import lombok.Builder;

@Builder
public record SalaResponse(
        Long id,
        String nome,
        Boolean disponivel,
        Integer capacidade,
        String localizacao
) {

}
