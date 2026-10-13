package br.com.foursys.agendamento_salas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class AgendamentoSalasApplication {

	public static void main(String[] args) {
		SpringApplication.run(AgendamentoSalasApplication.class, args);
	}
}