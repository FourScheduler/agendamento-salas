package br.com.foursys.agendamento_salas.dto.response;

import lombok.Builder;

@Builder
public record SalaResponse(
        Long id,
        String nome,
        Boolean disponivel,
        Integer capacidade,
        String localizacao,
        Boolean restrito
) {

    /** Compatibilidade com chamadas que ainda não informam a restrição da sala. */
    public SalaResponse(Long id, String nome, Boolean disponivel, Integer capacidade, String localizacao) {
        this(id, nome, disponivel, capacidade, localizacao, false);
    }
}
