package br.com.foursys.agendamento_salas.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.StreamUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

@ActiveProfiles("test")
@SpringBootTest
class CorsConfigTests {

	@Autowired
	private CorsConfigurationSource corsConfigurationSource;

	@Test
	void devePermitirOrigemDoFrontend() {
		CorsConfiguration configuration = buscarConfiguracao();
		assertThat(configuration.checkOrigin("http://localhost:4200"))
				.isEqualTo("http://localhost:4200");
	}

	@Test
	void deveRejeitarOrigemNaoPermitida() {
		CorsConfiguration configuration = buscarConfiguracao();
		assertThat(configuration.checkOrigin("http://evil.example")).isNull();
	}

	@Test
	void devePermitirMetodosEHeadersDaApi() {
		CorsConfiguration configuration = buscarConfiguracao();
		assertThat(configuration.getAllowedMethods())
				.contains("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
		assertThat(configuration.getAllowedHeaders())
				.contains("Authorization", "Content-Type", "Accept");
	}

	@Test
	void producaoExigeOrigemDefinidaPorVariavelDeAmbienteSemCoringa() throws Exception {
		String producao = StreamUtils.copyToString(
				new ClassPathResource("application-prod.yaml").getInputStream(),
				StandardCharsets.UTF_8
		);
		String linhaDeOrigens = producao.lines()
				.filter(linha -> linha.contains("allowed-origins"))
				.findFirst()
				.orElse("");
		assertThat(linhaDeOrigens)
				.contains("${CORS_ALLOWED_ORIGINS}")
				.doesNotContain("*");
	}

	private CorsConfiguration buscarConfiguracao() {
		MockHttpServletRequest requisicao =
				new MockHttpServletRequest("OPTIONS", "/api/salas/disponiveis");
		return corsConfigurationSource.getCorsConfiguration(requisicao);
	}
}
