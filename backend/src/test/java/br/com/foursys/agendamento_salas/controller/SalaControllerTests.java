package br.com.foursys.agendamento_salas.controller;

import br.com.foursys.agendamento_salas.config.CorsConfig;
import br.com.foursys.agendamento_salas.config.SecurityConfig;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.dto.request.CriarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.exception.SalaInexistenteException;
import br.com.foursys.agendamento_salas.exception.ValidacaoBuscaException;
import br.com.foursys.agendamento_salas.security.JwtService;
import br.com.foursys.agendamento_salas.service.SalaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SalaController.class)
@Import({SecurityConfig.class, CorsConfig.class})
class SalaControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private SalaService salaService;

	@MockitoBean
	private JwtService jwtService;

	@MockitoBean
	private UserDetailsService userDetailsService;

	@Test
	void deveCriarSalaEDevolverStatus201() throws Exception {
		SalaResponse sala = new SalaResponse(12L, "Sala Focus", true, 8, "Tamboré");
		when(salaService.criar(any(CriarSalaRequest.class))).thenReturn(sala);

		mockMvc.perform(
						post("/api/salas/admin/criar")
								.contentType("application/json")
								.content("""
                                {
                                    "nome": "Sala Focus",
                                    "capacidade": 8,
                                    "localizacao": "Tamboré"
                                }
                                """)
				)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(12))
				.andExpect(jsonPath("$.nome").value("Sala Focus"));
	}

	@Test
	void deveBuscarSalaExistentePorId() throws Exception {
		Sala sala = Sala.builder()
				.id(12L)
				.nome("Sala Focus")
				.disponivel(true)
				.capacidade(8)
				.localizacao("Tamboré")
				.build();

		when(salaService.buscarPorId(12L))
				.thenReturn(sala);

		mockMvc.perform(get("/api/salas/12"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(12))
				.andExpect(jsonPath("$.capacidade").value(8));
	}
	@Test
	void deveRetornarTodasAsSalasParaUmaPessoa() throws Exception {

		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				any(LocalTime.class),
				eq(1),
				eq("teste@email.com")
		)).thenReturn(List.of());

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.with(user("teste@email.com"))
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "%s",
                                    "horaInicio": "14:00",
                                    "horaFim": "15:00",
                                    "qntdPessoas": 1,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Teste"
                                }
                                """.formatted(LocalDate.now().plusDays(1)))
				)
				.andExpect(status().isOk());
	}

	@Test
	void deveBuscarDisponibilidadeSemAutenticacaoComEmailNulo() throws Exception {
		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				any(LocalTime.class),
				eq(1),
				isNull()
		)).thenReturn(List.of());

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "%s",
                                    "horaInicio": "14:00",
                                    "horaFim": "15:00",
                                    "qntdPessoas": 1,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Teste"
                                }
                                """.formatted(LocalDate.now().plusDays(1)))
				)
				.andExpect(status().isOk());
	}


	@Test
	void deveRetornarSomenteSalasComCapacidadeSuficiente() throws Exception {

		SalaResponse sala = mock(SalaResponse.class);

		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				any(LocalTime.class),
				eq(4),
				eq("teste@email.com")
		)).thenReturn(List.of(sala));

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.with(user("teste@email.com"))
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "%s",
                                    "horaInicio": "14:00",
                                    "horaFim": "15:00",
                                    "qntdPessoas": 4,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Reunião"
                                }
                                """.formatted(LocalDate.now().plusDays(1)))
				)
				.andExpect(status().isOk());
	}


	@Test
	void deveRetornarListaVaziaQuandoNenhumaSalaAtende() throws Exception {

		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				any(LocalTime.class),
				eq(10),
				eq("teste@email.com")
		)).thenReturn(List.of());

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.with(user("teste@email.com"))
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "%s",
                                    "horaInicio": "14:00",
                                    "horaFim": "15:00",
                                    "qntdPessoas": 10,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Reunião"
                                }
                                """.formatted(LocalDate.now().plusDays(1)))
				)
				.andExpect(status().isOk());
	}


	@Test
	void deveRejeitarDataNoPassado() throws Exception {

		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				any(LocalTime.class),
				any(Integer.class),
				eq("teste@email.com")
		)).thenThrow(
				new ValidacaoBuscaException("A data não pode estar no passado.")
		);

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.with(user("teste@email.com"))
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "2020-01-01",
                                    "horaInicio": "14:00",
                                    "horaFim": "15:00",
                                    "qntdPessoas": 4,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Teste"
                                }
                                """)
				)
				.andExpect(status().isBadRequest());
	}


	@Test
	void deveRejeitarHorarioFinalAnteriorAoInicial() throws Exception {

		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				any(LocalTime.class),
				any(Integer.class),
				eq("teste@email.com")
		)).thenThrow(
				new ValidacaoBuscaException(
						"O horário final deve ser posterior ao horário inicial."
				)
		);

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.with(user("teste@email.com"))
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "%s",
                                    "horaInicio": "15:00",
                                    "horaFim": "14:00",
                                    "qntdPessoas": 4,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Teste"
                                }
                                """.formatted(LocalDate.now().plusDays(1)))
				)
				.andExpect(status().isBadRequest());
	}


	@Test
	void deveRejeitarPessoasMenorQueUm() throws Exception {

		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				any(LocalTime.class),
				eq(0),
				eq("teste@email.com")
		)).thenThrow(
				new ValidacaoBuscaException(
						"A quantidade de pessoas deve ser ao menos 1."
				)
		);

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.with(user("teste@email.com"))
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "%s",
                                    "horaInicio": "14:00",
                                    "horaFim": "15:00",
                                    "qntdPessoas": 0,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Teste"
                                }
                                """.formatted(LocalDate.now().plusDays(1)))
				)
				.andExpect(status().isBadRequest());
	}


	@Test
	void deveRejeitarBuscaSemFimEDuracao() throws Exception {

		when(salaService.buscarSalasDisponiveis(
				any(LocalDate.class),
				any(LocalTime.class),
				isNull(),
				any(Integer.class),
				eq("teste@email.com")
		)).thenThrow(
				new ValidacaoBuscaException(
						"Informe o horário final ou a duração da reserva."
				)
		);

		mockMvc.perform(
						get("/api/salas/disponiveis")
								.with(user("teste@email.com"))
								.contentType("application/json")
								.content("""
                                {
                                    "salaId": null,
                                    "data": "%s",
                                    "horaInicio": "14:00",
                                    "horaFim": null,
                                    "qntdPessoas": 4,
                                    "usuarioIdSolicitante": null,
                                    "titulo": "Teste"
                                }
                                """.formatted(LocalDate.now().plusDays(1)))
				)
				.andExpect(status().isBadRequest());
	}


	@Test
	void deveRetornar404ParaRotaDesconhecida() throws Exception {

		mockMvc.perform(
						get("/api/salas/rota-que-nao-existe")
				)
				.andExpect(status().isNotFound());
	}


	@Test
	void deveRetornar404QuandoSalaNaoExistir() throws Exception {

		when(salaService.buscarPorId(999L))
				.thenThrow(new SalaInexistenteException());

		mockMvc.perform(
						get("/api/salas/999")
				)
				.andExpect(status().isNotFound());
	}
}