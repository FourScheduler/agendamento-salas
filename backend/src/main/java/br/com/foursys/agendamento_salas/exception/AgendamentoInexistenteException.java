package br.com.foursys.agendamento_salas.exception;

public class AgendamentoInexistenteException extends RuntimeException {
    public AgendamentoInexistenteException() {
        super("Agendamento não encontrado.");
    }
}
