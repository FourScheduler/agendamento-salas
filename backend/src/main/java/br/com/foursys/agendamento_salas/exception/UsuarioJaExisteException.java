package br.com.foursys.agendamento_salas.exception;

public class UsuarioJaExisteException extends RuntimeException {
    public UsuarioJaExisteException() {
        super("Já existe um usuário cadastrado com este e-mail.");
    }
}
