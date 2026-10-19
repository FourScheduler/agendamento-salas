package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.domain.Log;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.CriarAgendamentoRequest;
import br.com.foursys.agendamento_salas.dto.response.AgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.ConfimacaoAgendamentoResponse;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.dto.response.UsuarioResponse;
import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import br.com.foursys.agendamento_salas.enums.StatusAgendamento;
import br.com.foursys.agendamento_salas.enums.StatusLog;
import br.com.foursys.agendamento_salas.exception.CapacidadeNaoSuportadaException;
import br.com.foursys.agendamento_salas.exception.HorarioAgendamentoInvalidoException;
import br.com.foursys.agendamento_salas.exception.SalaIndisponivelException;
import br.com.foursys.agendamento_salas.exception.SalaInexistenteException;
import br.com.foursys.agendamento_salas.exception.UsuarioInexistenteException;
import br.com.foursys.agendamento_salas.exception.UsuarioSemPermissaoException;
import br.com.foursys.agendamento_salas.exception.ValidacaoBuscaException;
import br.com.foursys.agendamento_salas.mapper.AgendamentoMapper;
import br.com.foursys.agendamento_salas.port.out.AgendamentoRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.LogRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.SalaRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.UsuarioRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AgendamentoService - Fluxo de agendamentos")
class AgendamentoServiceTest {

    @Mock
    private AgendamentoRepositoryPort agendamentoRepositoryPort;
    @Mock
    private LogRepositoryPort logRepositoryPort;
    @Mock
    private SalaRepositoryPort salaRepositoryPort;
    @Mock
    private UsuarioRepositoryPort usuarioRepositoryPort;
    @Mock
    private AgendamentoMapper agendamentoMapper;

    private AgendamentoService service;

    @BeforeEach
    void setUp() {
        service = new AgendamentoService(
                agendamentoRepositoryPort,
                logRepositoryPort,
                salaRepositoryPort,
                usuarioRepositoryPort,
                agendamentoMapper
        );
    }

    @Nested
    @DisplayName("Criação de agendamentos")
    class CreateBooking {

        @Test
        @DisplayName("Deve salvar o agendamento, registrar log e retornar confirmação para usuário comum")
        void deveCriarAgendamentoEDevolverConfirmacao() {
            Usuario usuario = usuario(7L, PerfilUsuario.USER);
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, null, LocalTime.of(9, 0), LocalTime.of(11, 0), 8
            );
            prepararCriacao(usuario, sala);
            prepararSalvamento();

            ConfimacaoAgendamentoResponse confirmacao = service.criar(request, usuario.getId());

            ArgumentCaptor<List<Agendamento>> agendamentoCaptor = ArgumentCaptor.forClass(List.class);
            ArgumentCaptor<Log> logCaptor = ArgumentCaptor.forClass(Log.class);
            verify(agendamentoRepositoryPort).salvar(agendamentoCaptor.capture());
            verify(logRepositoryPort).salvar(logCaptor.capture());

            Agendamento salvo = agendamentoCaptor.getValue().get(0);
            Log log = logCaptor.getValue();
            assertThat(confirmacao.id()).isEqualTo(99L);
            assertThat(confirmacao.sala()).isEqualTo(salaResponse(sala));
            assertThat(confirmacao.agendamentos()).hasSize(1);
            assertThat(confirmacao.inicio()).isEqualTo(request.horaInicio());
            assertThat(confirmacao.fim()).isEqualTo(request.horaFim());
            assertThat(confirmacao.status()).isEqualTo(StatusAgendamento.CONFIRMADO);
            assertThat(confirmacao.solicitante()).isNull();
            assertThat(salvo.getUsuarioId()).isEqualTo(usuario);
            assertThat(salvo.getSalaId()).isEqualTo(sala);
            assertThat(salvo.getDataAgendamento()).isEqualTo(request.data());
            assertThat(salvo.getTitulo()).isEqualTo(request.titulo());
            assertThat(salvo.getQntdPessoas()).isEqualTo(8);
            assertThat(salvo.getDataCriacao()).isNotNull();
            assertThat(log.getUsuario()).isEqualTo(usuario);
            assertThat(log.getAgendamento()).isSameAs(salvo);
            assertThat(log.getStatus()).isEqualTo(StatusLog.CRIACAO);
        }

        @Test
        @DisplayName("Deve permitir que administrador faça agendamento longo para outro usuário")
        void deveCriarAgendamentoLongoParaSolicitanteQuandoAdmin() {
            Usuario admin = usuario(7L, PerfilUsuario.ADMIN);
            Usuario solicitante = usuario(8L, PerfilUsuario.USER);
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, solicitante, LocalTime.of(9, 0), LocalTime.of(12, 0), 4
            );
            prepararCriacao(admin, sala);
            prepararSalvamento();
            when(usuarioRepositoryPort.buscarPorId(solicitante.getId())).thenReturn(Optional.of(solicitante));

            ConfimacaoAgendamentoResponse confirmacao = service.criar(request, admin.getId());

            ArgumentCaptor<List<Agendamento>> agendamentoCaptor = ArgumentCaptor.forClass(List.class);
            verify(agendamentoRepositoryPort).salvar(agendamentoCaptor.capture());
            verify(logRepositoryPort).salvar(any(Log.class));
            assertThat(agendamentoCaptor.getValue().get(0).getUsuarioIdSolicitante()).isEqualTo(solicitante);
            assertThat(confirmacao.solicitante()).isEqualTo(usuarioResponse(solicitante));
        }

        @Test
        @DisplayName("Deve permitir que administrador crie uma reserva por sala integrada")
        void deveCriarAgendamentosParaListaDeSalasQuandoAdmin() {
            Usuario usuario = usuario(7L, PerfilUsuario.ADMIN);
            Sala primeiraSala = sala(12L, true, 4);
            Sala segundaSala = sala(13L, true, 4);
            CriarAgendamentoRequest request = new CriarAgendamentoRequest(
                    List.of(
                            new CriarAgendamentoRequest.SalaRef(segundaSala.getId()),
                            new CriarAgendamentoRequest.SalaRef(primeiraSala.getId())
                    ),
                    LocalDate.now().plusDays(1),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    8,
                    null,
                    "Alinhamento"
            );
            when(usuarioRepositoryPort.buscarPorId(usuario.getId())).thenReturn(Optional.of(usuario));
            when(salaRepositoryPort.buscarPorIdComBloqueio(primeiraSala.getId()))
                    .thenReturn(Optional.of(primeiraSala));
            when(salaRepositoryPort.buscarPorIdComBloqueio(segundaSala.getId()))
                    .thenReturn(Optional.of(segundaSala));
            when(agendamentoRepositoryPort.existeConflito(
                    any(), any(), any(), any()
            )).thenReturn(false);
            when(agendamentoRepositoryPort.salvar(anyList())).thenAnswer(invocation -> {
                List<Agendamento> salvos = invocation.getArgument(0);
                for (int i = 0; i < salvos.size(); i++) {
                    salvos.get(i).setId(99L + i);
                }
                return salvos;
            });

            ConfimacaoAgendamentoResponse confirmacao = service.criar(request, usuario.getId());

            assertThat(confirmacao.agendamentos()).hasSize(2);
            assertThat(confirmacao.agendamentos())
                    .extracting(ConfimacaoAgendamentoResponse.AgendamentoCriado::id)
                    .containsExactly(99L, 100L);
            ArgumentCaptor<List<Agendamento>> agendamentoCaptor = ArgumentCaptor.forClass(List.class);
            ArgumentCaptor<Log> logCaptor = ArgumentCaptor.forClass(Log.class);
            verify(agendamentoRepositoryPort).salvar(agendamentoCaptor.capture());
            verify(logRepositoryPort, org.mockito.Mockito.times(2)).salvar(logCaptor.capture());
            assertThat(agendamentoCaptor.getValue())
                    .extracting(Agendamento::getSalaId)
                    .containsExactly(primeiraSala, segundaSala);
            assertThat(logCaptor.getAllValues())
                    .extracting(Log::getAgendamento)
                    .containsExactlyElementsOf(agendamentoCaptor.getValue());
        }

        @Test
        @DisplayName("Deve impedir usuário comum de criar reserva integrada")
        void deveImpedirUsuarioComumDeAgendarEmMultiplasSalas() {
            Usuario usuario = usuario(7L, PerfilUsuario.USER);
            CriarAgendamentoRequest request = new CriarAgendamentoRequest(
                    List.of(
                            new CriarAgendamentoRequest.SalaRef(12L),
                            new CriarAgendamentoRequest.SalaRef(13L)
                    ),
                    LocalDate.now().plusDays(1),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    8,
                    null,
                    "Alinhamento"
            );
            when(usuarioRepositoryPort.buscarPorId(usuario.getId())).thenReturn(Optional.of(usuario));

            assertThrows(
                    UsuarioSemPermissaoException.class,
                    () -> service.criar(request, usuario.getId())
            );

            verifyNoInteractions(salaRepositoryPort, agendamentoRepositoryPort, logRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar integração cuja capacidade total seja insuficiente")
        void deveRejeitarCapacidadeInsuficienteNaListaDeSalas() {
            Usuario admin = usuario(7L, PerfilUsuario.ADMIN);
            Sala primeiraSala = sala(12L, true, 3);
            Sala segundaSala = sala(13L, true, 3);
            CriarAgendamentoRequest request = new CriarAgendamentoRequest(
                    List.of(
                            new CriarAgendamentoRequest.SalaRef(primeiraSala.getId()),
                            new CriarAgendamentoRequest.SalaRef(segundaSala.getId())
                    ),
                    LocalDate.now().plusDays(1),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    7,
                    null,
                    "Alinhamento"
            );
            when(usuarioRepositoryPort.buscarPorId(admin.getId())).thenReturn(Optional.of(admin));
            when(salaRepositoryPort.buscarPorIdComBloqueio(primeiraSala.getId()))
                    .thenReturn(Optional.of(primeiraSala));
            when(salaRepositoryPort.buscarPorIdComBloqueio(segundaSala.getId()))
                    .thenReturn(Optional.of(segundaSala));

            assertThrows(
                    CapacidadeNaoSuportadaException.class,
                    () -> service.criar(request, admin.getId())
            );

            verify(agendamentoRepositoryPort, never()).salvar(any());
            verifyNoInteractions(logRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar sala repetida antes de adquirir bloqueios")
        void deveRejeitarSalaRepetidaNaLista() {
            Usuario admin = usuario(7L, PerfilUsuario.ADMIN);
            CriarAgendamentoRequest request = new CriarAgendamentoRequest(
                    List.of(
                            new CriarAgendamentoRequest.SalaRef(12L),
                            new CriarAgendamentoRequest.SalaRef(12L)
                    ),
                    LocalDate.now().plusDays(1),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    4,
                    null,
                    "Alinhamento"
            );
            ValidacaoBuscaException erro = assertThrows(
                    ValidacaoBuscaException.class,
                    () -> service.criar(request, admin.getId())
            );

            assertThat(erro).hasMessage("Não informe a mesma sala mais de uma vez.");
            verifyNoInteractions(
                    usuarioRepositoryPort,
                    salaRepositoryPort,
                    agendamentoRepositoryPort,
                    logRepositoryPort
            );
        }

        @Test
        @DisplayName("Deve não persistir nenhuma reserva se uma sala integrada tiver conflito")
        void deveEvitarPersistenciaParcialQuandoSalaIntegradaTemConflito() {
            Usuario admin = usuario(7L, PerfilUsuario.ADMIN);
            Sala primeiraSala = sala(12L, true, 4);
            Sala segundaSala = sala(13L, true, 4);
            CriarAgendamentoRequest request = new CriarAgendamentoRequest(
                    List.of(
                            new CriarAgendamentoRequest.SalaRef(primeiraSala.getId()),
                            new CriarAgendamentoRequest.SalaRef(segundaSala.getId())
                    ),
                    LocalDate.now().plusDays(1),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    8,
                    null,
                    "Alinhamento"
            );
            when(usuarioRepositoryPort.buscarPorId(admin.getId())).thenReturn(Optional.of(admin));
            when(salaRepositoryPort.buscarPorIdComBloqueio(primeiraSala.getId()))
                    .thenReturn(Optional.of(primeiraSala));
            when(salaRepositoryPort.buscarPorIdComBloqueio(segundaSala.getId()))
                    .thenReturn(Optional.of(segundaSala));
            when(agendamentoRepositoryPort.existeConflito(
                    primeiraSala.getId(), request.data(), request.horaInicio(), request.horaFim()
            )).thenReturn(false);
            when(agendamentoRepositoryPort.existeConflito(
                    segundaSala.getId(), request.data(), request.horaInicio(), request.horaFim()
            )).thenReturn(true);

            assertThrows(
                    SalaIndisponivelException.class,
                    () -> service.criar(request, admin.getId())
            );

            verify(agendamentoRepositoryPort, never()).salvar(any());
            verifyNoInteractions(logRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar agendamento quando o usuário autenticado não existe")
        void deveRejeitarAgendamentoQuandoUsuarioNaoExiste() {
            when(usuarioRepositoryPort.buscarPorId(7L)).thenReturn(Optional.empty());

            assertThrows(
                    UsuarioInexistenteException.class,
                    () -> service.criar(request(sala(12L), null, LocalTime.of(9, 0), LocalTime.of(10, 0)), 7L)
            );

            verifyNoInteractions(salaRepositoryPort, agendamentoRepositoryPort, logRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar agendamento quando a sala não existe")
        void deveRejeitarAgendamentoQuandoSalaNaoExiste() {
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));
            when(salaRepositoryPort.buscarPorIdComBloqueio(12L)).thenReturn(Optional.empty());

            assertThrows(
                    SalaInexistenteException.class,
                    () -> service.criar(request(sala(12L), null, LocalTime.of(9, 0), LocalTime.of(10, 0)), 7L)
            );

            verifyNoInteractions(agendamentoRepositoryPort, logRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar agendamento com data no passado")
        void deveRejeitarAgendamentoComDataNoPassado() {
            CriarAgendamentoRequest request = new CriarAgendamentoRequest(
                    List.of(new CriarAgendamentoRequest.SalaRef(12L)),
                    LocalDate.now().minusDays(1),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    4,
                    null,
                    "Alinhamento"
            );
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));

            ValidacaoBuscaException exception = assertThrows(
                    ValidacaoBuscaException.class,
                    () -> service.criar(request, 7L)
            );

            assertThat(exception).hasMessage("A data não pode estar no passado.");
            verifyNoInteractions(salaRepositoryPort, agendamentoRepositoryPort, logRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar duração superior a duas horas para usuário comum")
        void deveRejeitarDuracaoSuperiorADuasHorasParaUsuarioComum() {
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, null, LocalTime.of(9, 0), LocalTime.of(11, 1), 4
            );
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));
            when(salaRepositoryPort.buscarPorIdComBloqueio(sala.getId())).thenReturn(Optional.of(sala));

            ValidacaoBuscaException exception = assertThrows(
                    ValidacaoBuscaException.class,
                    () -> service.criar(request, 7L)
            );

            assertThat(exception).hasMessage("A duração não pode ser maior que 2 horas.");
            verifyNoInteractions(logRepositoryPort, agendamentoRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar quantidade de pessoas acima da capacidade da sala")
        void deveRejeitarQuantidadeDePessoasAcimaDaCapacidade() {
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, null, LocalTime.of(9, 0), LocalTime.of(10, 0), 9
            );
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));
            when(salaRepositoryPort.buscarPorIdComBloqueio(sala.getId())).thenReturn(Optional.of(sala));

            assertThrows(CapacidadeNaoSuportadaException.class, () -> service.criar(request, 7L));

            verifyNoInteractions(logRepositoryPort, agendamentoRepositoryPort);
        }

        @Test
        @DisplayName("Deve rejeitar agendamento quando já existir conflito de horário")
        void deveRejeitarConflitoDeHorario() {
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, null, LocalTime.of(9, 0), LocalTime.of(10, 0), 4
            );
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));
            when(salaRepositoryPort.buscarPorIdComBloqueio(sala.getId())).thenReturn(Optional.of(sala));
            when(agendamentoRepositoryPort.existeConflito(
                    sala.getId(), request.data(), request.horaInicio(), request.horaFim()
            )).thenReturn(true);

            assertThrows(SalaIndisponivelException.class, () -> service.criar(request, 7L));

            verify(agendamentoRepositoryPort, never()).salvar(any());
            verify(logRepositoryPort, never()).salvar(any());
        }

        @Test
        @DisplayName("Deve rejeitar agendamento quando a sala estiver marcada como indisponível")
        void deveRejeitarSalaIndisponivel() {
            Sala sala = sala(12L, false, 8);
            CriarAgendamentoRequest request = request(
                    sala, null, LocalTime.of(9, 0), LocalTime.of(10, 0), 4
            );
            prepararCriacao(usuario(7L, PerfilUsuario.USER), sala);

            assertThrows(SalaIndisponivelException.class, () -> service.criar(request, 7L));

            verify(agendamentoRepositoryPort, never()).salvar(any());
            verify(logRepositoryPort, never()).salvar(any());
        }

        @Test
        @DisplayName("Deve rejeitar horário final anterior ao inicial")
        void deveRejeitarHorarioFinalAnteriorAoInicial() {
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, null, LocalTime.of(10, 0), LocalTime.of(9, 0), 4
            );
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));

            assertThrows(HorarioAgendamentoInvalidoException.class, () -> service.criar(request, 7L));

            verify(agendamentoRepositoryPort, never()).salvar(any());
            verify(logRepositoryPort, never()).salvar(any());
        }

        @Test
        @DisplayName("Deve impedir usuário comum de agendar para outra pessoa")
        void deveImpedirUsuarioComumDeAgendarParaOutroUsuario() {
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, usuario(8L, PerfilUsuario.USER), LocalTime.of(9, 0), LocalTime.of(10, 0), 4
            );
            prepararCriacao(usuario(7L, PerfilUsuario.USER), sala);

            assertThrows(UsuarioSemPermissaoException.class, () -> service.criar(request, 7L));

            verify(usuarioRepositoryPort, never()).buscarPorId(8L);
            verify(agendamentoRepositoryPort, never()).salvar(any());
            verify(logRepositoryPort, never()).salvar(any());
        }

        @Test
        @DisplayName("Deve rejeitar solicitante inexistente mesmo quando o solicitante é definido por administrador")
        void deveRejeitarSolicitanteInexistenteParaAdministrador() {
            Sala sala = sala(12L);
            CriarAgendamentoRequest request = request(
                    sala, usuario(8L, PerfilUsuario.USER), LocalTime.of(9, 0), LocalTime.of(10, 0), 4
            );
            prepararCriacao(usuario(7L, PerfilUsuario.ADMIN), sala);
            when(usuarioRepositoryPort.buscarPorId(8L)).thenReturn(Optional.empty());

            assertThrows(UsuarioInexistenteException.class, () -> service.criar(request, 7L));

            verify(agendamentoRepositoryPort, never()).salvar(any());
            verify(logRepositoryPort, never()).salvar(any());
        }
    }

    @Nested
    @DisplayName("Consulta de agendamentos")
    class BookingQueries {

        @Test
        @DisplayName("Deve retornar os agendamentos do usuário autenticado")
        void deveRetornarAgendamentosDoUsuarioAutenticado() {
            Usuario usuario = usuario(7L, PerfilUsuario.USER);
            Agendamento agendamento = agendamento(12L);
            AgendamentoResponse responseEsperada = agendamentoResponse();
            when(usuarioRepositoryPort.buscarPorId(usuario.getId())).thenReturn(Optional.of(usuario));
            when(agendamentoRepositoryPort.buscarFiltrados(usuario.getId(), null, null, null))
                    .thenReturn(List.of(agendamento));
            when(agendamentoMapper.entityToResponse(agendamento)).thenReturn(responseEsperada);

            List<AgendamentoResponse> resultado = service.buscaAgendamentos(usuario.getId(), false);

            assertThat(resultado).containsExactly(responseEsperada);
            verify(agendamentoRepositoryPort).buscarFiltrados(usuario.getId(), null, null, null);
            verify(agendamentoMapper).entityToResponse(agendamento);
        }

        @Test
        @DisplayName("Deve rejeitar consulta pessoal quando o usuário não existe")
        void deveRejeitarConsultaPessoalQuandoUsuarioNaoExiste() {
            when(usuarioRepositoryPort.buscarPorId(7L)).thenReturn(Optional.empty());

            assertThrows(UsuarioInexistenteException.class, () -> service.buscaAgendamentos(7L, false));

            verifyNoInteractions(agendamentoRepositoryPort, agendamentoMapper);
        }

        @Test
        @DisplayName("Deve retornar todos os agendamentos quando administrador solicita todos os usuários")
        void deveRetornarTodosAgendamentosParaAdministrador() {
            Usuario admin = usuario(7L, PerfilUsuario.ADMIN);
            Agendamento primeiro = agendamento(12L);
            Agendamento segundo = agendamento(13L);
            AgendamentoResponse primeiraResposta = agendamentoResponse();
            AgendamentoResponse segundaResposta = agendamentoResponse();
            when(usuarioRepositoryPort.buscarPorId(admin.getId())).thenReturn(Optional.of(admin));
            when(agendamentoRepositoryPort.buscarFiltrados(null, null, null, null))
                    .thenReturn(List.of(primeiro, segundo));
            when(agendamentoMapper.entityToResponse(primeiro)).thenReturn(primeiraResposta);
            when(agendamentoMapper.entityToResponse(segundo)).thenReturn(segundaResposta);

            List<AgendamentoResponse> resultado = service.buscaAgendamentos(admin.getId(), true);

            assertThat(resultado).containsExactly(primeiraResposta, segundaResposta);
            verify(agendamentoRepositoryPort).buscarFiltrados(null, null, null, null);
            verify(agendamentoMapper).entityToResponse(primeiro);
            verify(agendamentoMapper).entityToResponse(segundo);
        }

        @Test
        @DisplayName("Deve rejeitar consulta geral para usuário comum")
        void deveRejeitarConsultaGeralParaUsuarioComum() {
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));

            assertThrows(UsuarioSemPermissaoException.class, () -> service.buscaAgendamentos(7L, true));

            verifyNoInteractions(agendamentoRepositoryPort, agendamentoMapper);
        }

        @Test
        @DisplayName("Deve aplicar os filtros à consulta pessoal do usuário")
        void deveAplicarFiltrosAConsultaDoUsuarioAutenticado() {
            Usuario usuario = usuario(7L, PerfilUsuario.USER);
            Agendamento agendamento = agendamento(12L);
            AgendamentoResponse responseEsperada = agendamentoResponse();
            LocalDate dataInicio = LocalDate.now();
            LocalDate dataFim = dataInicio.plusDays(7);
            StatusAgendamento status = StatusAgendamento.CONFIRMADO;
            when(usuarioRepositoryPort.buscarPorId(usuario.getId())).thenReturn(Optional.of(usuario));
            when(agendamentoRepositoryPort.buscarFiltrados(usuario.getId(), dataInicio, dataFim, status))
                    .thenReturn(List.of(agendamento));
            when(agendamentoMapper.entityToResponse(agendamento)).thenReturn(responseEsperada);

            List<AgendamentoResponse> resultado = service.buscaFiltrada(
                    usuario.getId(), dataInicio, dataFim, status, false
            );

            assertThat(resultado).containsExactly(responseEsperada);
            verify(agendamentoRepositoryPort).buscarFiltrados(usuario.getId(), dataInicio, dataFim, status);
            verify(agendamentoMapper).entityToResponse(agendamento);
        }

        @Test
        @DisplayName("Deve rejeitar consulta filtrada de todos os usuários para usuário comum")
        void deveRejeitarConsultaFiltradaDeTodosUsuariosParaUsuarioComum() {
            when(usuarioRepositoryPort.buscarPorId(7L))
                    .thenReturn(Optional.of(usuario(7L, PerfilUsuario.USER)));

            assertThrows(
                    UsuarioSemPermissaoException.class,
                    () -> service.buscaFiltrada(7L, null, null, null, true)
            );

            verifyNoInteractions(agendamentoRepositoryPort, agendamentoMapper);
        }

        @Test
        @DisplayName("Deve aplicar filtros sem restringir o usuário quando administrador solicita todos")
        void deveAplicarFiltrosParaTodosUsuariosQuandoAdmin() {
            Usuario admin = usuario(7L, PerfilUsuario.ADMIN);
            LocalDate dataInicio = LocalDate.now();
            LocalDate dataFim = dataInicio.plusDays(7);
            StatusAgendamento status = StatusAgendamento.CONFIRMADO;
            when(usuarioRepositoryPort.buscarPorId(admin.getId())).thenReturn(Optional.of(admin));
            when(agendamentoRepositoryPort.buscarFiltrados(null, dataInicio, dataFim, status))
                    .thenReturn(List.of());

            List<AgendamentoResponse> resultado = service.buscaFiltrada(
                    admin.getId(), dataInicio, dataFim, status, true
            );

            assertThat(resultado).isEmpty();
            verify(agendamentoRepositoryPort).buscarFiltrados(null, dataInicio, dataFim, status);
        }
    }

    private void prepararCriacao(Usuario usuario, Sala sala) {
        when(usuarioRepositoryPort.buscarPorId(usuario.getId())).thenReturn(Optional.of(usuario));
        when(salaRepositoryPort.buscarPorIdComBloqueio(sala.getId())).thenReturn(Optional.of(sala));
    }

    private void prepararSalvamento() {
        when(agendamentoRepositoryPort.salvar(anyList())).thenAnswer(invocation -> {
            List<Agendamento> salvos = invocation.getArgument(0);
            salvos.forEach(agendamento -> agendamento.setId(99L));
            return salvos;
        });
    }

    private Usuario usuario(Long id, PerfilUsuario perfil) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setPerfilUsuario(perfil);
        return usuario;
    }

    private Sala sala(Long id) {
        return sala(id, true, 8);
    }

    private Sala sala(Long id, boolean disponivel, int capacidade) {
        return Sala.builder()
                .id(id)
                .nome("Sala Focus")
                .disponivel(disponivel)
                .capacidade(capacidade)
                .build();
    }

    private Agendamento agendamento(Long id) {
        return Agendamento.builder()
                .id(id)
                .usuarioId(usuario(7L, PerfilUsuario.USER))
                .salaId(sala(12L))
                .dataAgendamento(LocalDate.now().plusDays(1))
                .dataCriacao(LocalDateTime.now())
                .horaInicio(LocalTime.of(9, 0))
                .horaFim(LocalTime.of(10, 0))
                .qntdPessoas(4)
                .titulo("Alinhamento")
                .status(StatusAgendamento.CONFIRMADO)
                .build();
    }

    private AgendamentoResponse agendamentoResponse() {
        return new AgendamentoResponse(
                1L,
                salaResponse(sala(12L)),
                LocalDate.now().plusDays(1),
                LocalDateTime.now(),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                4,
                "Alinhamento",
                null,
                StatusAgendamento.CONFIRMADO
        );
    }

    private CriarAgendamentoRequest request(
            Sala sala,
            Usuario solicitante,
            LocalTime inicio,
            LocalTime fim
    ) {
        return request(sala, solicitante, inicio, fim, 4);
    }

    private CriarAgendamentoRequest request(
            Sala sala,
            Usuario solicitante,
            LocalTime inicio,
            LocalTime fim,
            int quantidadePessoas
    ) {
        return new CriarAgendamentoRequest(
                List.of(new CriarAgendamentoRequest.SalaRef(sala.getId())),
                LocalDate.now().plusDays(1),
                inicio,
                fim,
                quantidadePessoas,
                solicitante != null
                        ? new CriarAgendamentoRequest.UsuarioRef(solicitante.getId())
                        : null,
                "Alinhamento"
        );
    }

    private SalaResponse salaResponse(Sala sala) {
        return SalaResponse.builder()
                .id(sala.getId())
                .nome(sala.getNome())
                .disponivel(sala.getDisponivel())
                .capacidade(sala.getCapacidade())
                .localizacao(sala.getLocalizacao())
                .build();
    }

    private UsuarioResponse usuarioResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNome(),
                usuario.getPerfilUsuario()
        );
    }
}
