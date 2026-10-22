package br.com.foursys.agendamento_salas.infrastructure.persistence.repository;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("AgendamentoJpaRepository - Conflito de horário e busca de disponibilidade")
class AgendamentoJpaRepositoryTests {

    private static final LocalDate DATA = LocalDate.now().plusDays(1);

    @Autowired
    private AgendamentoJpaRepository agendamentoJpaRepository;

    @Autowired
    private SalaJpaRepository salaJpaRepository;

    @Autowired
    private UsuarioJpaRepository usuarioJpaRepository;

    private Usuario usuario;
    private Sala sala;

    @BeforeEach
    void setUp() {
        usuario = usuarioJpaRepository.save(usuario());
        sala = salaJpaRepository.save(sala());
    }

    @Test
    @DisplayName("Deve encontrar conflito quando existe agendamento confirmado sobreposto")
    void deveEncontrarConflitoComAgendamentoSobreposto() {
        agendamentoJpaRepository.save(agendamento(StatusAgendamento.CONFIRMADO, LocalTime.of(9, 0), LocalTime.of(10, 0)));

        boolean conflito = agendamentoJpaRepository.existeConflito(
                sala.getId(), DATA, LocalTime.of(9, 30), LocalTime.of(10, 30)
        );

        assertThat(conflito).isTrue();
    }

    @Test
    @DisplayName("Deve considerar horários que apenas se encostam como sem conflito")
    void naoDeveConsiderarEncostamentoComoConflito() {
        agendamentoJpaRepository.save(agendamento(StatusAgendamento.CONFIRMADO, LocalTime.of(9, 0), LocalTime.of(10, 0)));

        assertThat(agendamentoJpaRepository.existeConflito(
                sala.getId(), DATA, LocalTime.of(8, 0), LocalTime.of(9, 0)
        )).isFalse();
        assertThat(agendamentoJpaRepository.existeConflito(
                sala.getId(), DATA, LocalTime.of(10, 0), LocalTime.of(11, 0)
        )).isFalse();
    }

    @Test
    @DisplayName("Deve ignorar agendamento cancelado na checagem de conflito")
    void deveIgnorarAgendamentoCancelado() {
        agendamentoJpaRepository.save(agendamento(StatusAgendamento.CANCELADO, LocalTime.of(9, 0), LocalTime.of(10, 0)));

        boolean conflito = agendamentoJpaRepository.existeConflito(
                sala.getId(), DATA, LocalTime.of(9, 0), LocalTime.of(10, 0)
        );

        assertThat(conflito).isFalse();
    }

    @Test
    @DisplayName("Deve excluir sala da busca quando existe agendamento confirmado sobreposto")
    void deveExcluirSalaDaBuscaQuandoConfirmado() {
        agendamentoJpaRepository.save(agendamento(StatusAgendamento.CONFIRMADO, LocalTime.of(9, 0), LocalTime.of(10, 0)));

        List<Sala> disponiveis = salaJpaRepository.buscarSalasDisponiveis(
                DATA, LocalTime.of(9, 30), LocalTime.of(10, 30), 2
        );

        assertThat(disponiveis).extracting(Sala::getId).doesNotContain(sala.getId());
    }

    @Test
    @DisplayName("Deve manter sala na busca quando o agendamento existente está cancelado")
    void deveManterSalaNaBuscaQuandoCancelado() {
        agendamentoJpaRepository.save(agendamento(StatusAgendamento.CANCELADO, LocalTime.of(9, 0), LocalTime.of(10, 0)));

        List<Sala> disponiveis = salaJpaRepository.buscarSalasDisponiveis(
                DATA, LocalTime.of(9, 30), LocalTime.of(10, 30), 2
        );

        assertThat(disponiveis).extracting(Sala::getId).contains(sala.getId());
    }

    @Test
    @DisplayName("Deve incluir a Arena (sem capacidade) para qualquer quantidade de pessoas")
    void deveIncluirSalaSemCapacidadeParaQualquerQuantidade() {
        List<Sala> disponiveis = salaJpaRepository.buscarSalasDisponiveis(
                DATA, LocalTime.of(9, 0), LocalTime.of(10, 0), 80
        );

        // A Arena vem do seed V2 sem capacidade: eventos não limitam as pessoas.
        assertThat(disponiveis).extracting(Sala::getId).contains(9L);
    }

    private Agendamento agendamento(StatusAgendamento status, LocalTime inicio, LocalTime fim) {
        return Agendamento.builder()
                .usuarioId(usuario)
                .salaId(sala)
                .dataAgendamento(DATA)
                .dataCriacao(LocalDateTime.now())
                .horaInicio(inicio)
                .horaFim(fim)
                .qntdPessoas(2)
                .titulo("Reunião de teste")
                .status(status)
                .ultimaAtualizacao(LocalDateTime.now())
                .dataCancelamento(status == StatusAgendamento.CANCELADO ? LocalDateTime.now() : null)
                .build();
    }

    private Usuario usuario() {
        Usuario novo = new Usuario();
        novo.setEmail("teste.conflito." + UUID.randomUUID() + "@foursys.com.br");
        novo.setNome("Teste Conflito");
        novo.setPassword("$2a$10$abcdefghijklmnopqrstuv");
        novo.setPerfilUsuario(PerfilUsuario.USER);
        return novo;
    }

    private Sala sala() {
        return Sala.builder()
                .nome("Sala Teste Conflito")
                .disponivel(true)
                .capacidade(8)
                .localizacao("Tamboré")
                .build();
    }
}
