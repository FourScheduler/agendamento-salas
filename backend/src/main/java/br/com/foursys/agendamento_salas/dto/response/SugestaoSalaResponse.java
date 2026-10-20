package br.com.foursys.agendamento_salas.dto.response;

public record SugestaoSalaResponse(
        Long salaId,
        String nome,
        Integer capacidade,
        String localizacao

) {
}
