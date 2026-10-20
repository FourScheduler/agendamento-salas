package br.com.foursys.agendamento_salas.exception;

public class ConversaNaoEncontradaException extends RuntimeException {
    public ConversaNaoEncontradaException() {
        super("Conversa não encontrada");
    }
}
