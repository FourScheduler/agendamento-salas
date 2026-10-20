package br.com.foursys.agendamento_salas.exception;

import br.com.foursys.agendamento_salas.dto.response.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ValidacaoBuscaException.class)
	public ResponseEntity<ErrorResponse> validarBusca(ValidacaoBuscaException exception) {
		return ResponseEntity.badRequest().body(new ErrorResponse(400, exception.getMessage(),LocalDateTime.now()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> erroInesperado(Exception ex) {
		if (ex instanceof org.springframework.web.ErrorResponse resposta) {
			int status = resposta.getStatusCode().value();
			String detalhe = resposta.getBody().getDetail();
			String mensagem = (detalhe != null && !detalhe.isBlank()) ? detalhe : "Erro na requisição.";
			return ResponseEntity.status(status).body(new ErrorResponse(status, mensagem, LocalDateTime.now()));
		}
		log.error("Erro inesperado ao processar a requisição", ex);
		return ResponseEntity.internalServerError().body(new ErrorResponse(500, "Erro interno inesperado.", LocalDateTime.now()));
	}

	@ExceptionHandler(UsuarioInexistenteException.class)
	public ResponseEntity<ErrorResponse> handleUsuarioInexistente(
			UsuarioInexistenteException exception
	){
		ErrorResponse error = new ErrorResponse(
				HttpStatus.BAD_REQUEST.value(),
				exception.getMessage(),
				LocalDateTime.now()
		);

		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(error);
	}

	@ExceptionHandler(SalaInexistenteException.class)
	public ResponseEntity<ErrorResponse> handleSalaInexistente(
			SalaInexistenteException exception
	) {
		return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body(new ErrorResponse(
						HttpStatus.NOT_FOUND.value(),
						exception.getMessage(),
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(ConversaNaoEncontradaException.class)
	public ResponseEntity<ErrorResponse> handleSonversaNaoEncontrada(
			ConversaNaoEncontradaException exception
	) {
		return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body(new ErrorResponse(
						HttpStatus.NOT_FOUND.value(),
						exception.getMessage(),
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(SalaJaExisteException.class)
	public ResponseEntity<ErrorResponse> handleSalaJaExiste(
			SalaJaExisteException exception
	) {
		return ResponseEntity
				.status(HttpStatus.CONFLICT)
				.body(new ErrorResponse(
						HttpStatus.CONFLICT.value(),
						exception.getMessage(),
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ErrorResponse> handleParametroInexistente() {
		return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body(new ErrorResponse(
						HttpStatus.NOT_FOUND.value(),
						"Recurso não encontrado.",
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(UsuarioSemPermissaoException.class)
	public ResponseEntity<ErrorResponse> handleUsuarioSemPermissao(
			UsuarioSemPermissaoException exception
	){
		ErrorResponse error = new ErrorResponse(
				HttpStatus.FORBIDDEN.value(),
				exception.getMessage(),
				LocalDateTime.now()
		);

		return ResponseEntity
				.status(HttpStatus.FORBIDDEN)
				.body(error);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidacaoDeArgumentos(
			MethodArgumentNotValidException exception
	) {
		String mensagem = exception.getBindingResult().getFieldErrors().stream()
				.map(FieldError::getDefaultMessage)
				.findFirst()
				.orElse("Dados da requisição inválidos.");

		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(new ErrorResponse(
						HttpStatus.BAD_REQUEST.value(),
						mensagem,
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleNaoAutenticado(
			AuthenticationCredentialsNotFoundException exception
	) {
		return ResponseEntity
				.status(HttpStatus.UNAUTHORIZED)
				.body(new ErrorResponse(
						HttpStatus.UNAUTHORIZED.value(),
						"Token ausente ou inválido. Faça login novamente.",
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(UsuarioJaExisteException.class)
	public ResponseEntity<ErrorResponse> handleUsuarioJaExiste(
			UsuarioJaExisteException exception
	) {
		return ResponseEntity
				.status(HttpStatus.CONFLICT)
				.body(new ErrorResponse(
						HttpStatus.CONFLICT.value(),
						exception.getMessage(),
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(InterpretacaoIaException.class)
	public ResponseEntity<ErrorResponse> handleInterpretacaoIa(
			InterpretacaoIaException exception
	) {
		log.error("Falha ao interpretar solicitação com o serviço de IA", exception);
		return ResponseEntity
				.status(HttpStatus.SERVICE_UNAVAILABLE)
				.body(new ErrorResponse(
						HttpStatus.SERVICE_UNAVAILABLE.value(),
						exception.getMessage(),
						LocalDateTime.now()
				));
	}

	@ExceptionHandler(SalaIndisponivelException.class)
	public ResponseEntity<ErrorResponse> handleSalaIndisponivel(
			SalaIndisponivelException exception
	){
		ErrorResponse error = new ErrorResponse(
				HttpStatus.BAD_REQUEST.value(),
				exception.getMessage(),
				LocalDateTime.now()
		);

		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(error);
	}

	@ExceptionHandler(HorarioAgendamentoInvalidoException.class)
	public ResponseEntity<ErrorResponse> handleSalaIndisponivel(
			HorarioAgendamentoInvalidoException exception
	){
		ErrorResponse error = new ErrorResponse(
				HttpStatus.BAD_REQUEST.value(),
				exception.getMessage(),
				LocalDateTime.now()
		);

		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(error);
	}

	@ExceptionHandler(CapacidadeNaoSuportadaException.class)
	public ResponseEntity<ErrorResponse> handleCapacidadeNaoSuportadaException(
			CapacidadeNaoSuportadaException exception
	){
		ErrorResponse error = new ErrorResponse(
				HttpStatus.BAD_REQUEST.value(),
				exception.getMessage(),
				LocalDateTime.now()
		);

		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(error);
	}
}