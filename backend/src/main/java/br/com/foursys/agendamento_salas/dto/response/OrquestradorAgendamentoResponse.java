package br.com.foursys.agendamento_salas.dto.response;

import br.com.foursys.agendamento_salas.enums.StatusAgendamento;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Resposta de cada etapa da conversa. Os campos de data/horário/pessoas
 * devolvem o estado atual interpretado da conversa para que o front
 * consiga sincronizar o painel de resumo com o chat.
 */
public record OrquestradorAgendamentoResponse(
        Long conversaId,
        StatusAgendamento estado,
        String mensagem,
        List<SugestaoSalaResponse> sugestoes,
        LocalDate data,
        LocalTime horaInicio,
        LocalTime horaFim,
        Integer qntdPessoas
) {
}
