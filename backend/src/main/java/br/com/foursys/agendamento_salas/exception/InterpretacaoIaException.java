package br.com.foursys.agendamento_salas.exception;

public class InterpretacaoIaException extends RuntimeException {
    public InterpretacaoIaException(Throwable causa) {
        super("Não foi possível interpretar a solicitação agora. Tente novamente.", causa);
    }
}
