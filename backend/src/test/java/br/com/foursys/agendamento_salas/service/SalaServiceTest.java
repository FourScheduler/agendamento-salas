
package br.com.foursys.agendamento_salas.service;

import br.com.foursys.agendamento_salas.domain.Agendamento;
import br.com.foursys.agendamento_salas.domain.Sala;
import br.com.foursys.agendamento_salas.domain.Usuario;
import br.com.foursys.agendamento_salas.dto.request.CriarSalaRequest;
import br.com.foursys.agendamento_salas.dto.response.OcupacaoSalaResponse;
import br.com.foursys.agendamento_salas.dto.response.SalaResponse;
import br.com.foursys.agendamento_salas.enums.PerfilUsuario;
import br.com.foursys.agendamento_salas.exception.SalaInexistenteException;
import br.com.foursys.agendamento_salas.exception.SalaJaExisteException;
import br.com.foursys.agendamento_salas.exception.UsuarioInexistenteException;
import br.com.foursys.agendamento_salas.exception.ValidacaoBuscaException;
import br.com.foursys.agendamento_salas.mapper.SalaMapper;
import br.com.foursys.agendamento_salas.port.out.AgendamentoRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.SalaRepositoryPort;
import br.com.foursys.agendamento_salas.port.out.UsuarioRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SalaServiceTest {

    @Mock
    private SalaRepositoryPort salaRepositoryPort;

    @Mock
    private SalaMapper salaMapper;

    @Mock
    private UsuarioRepositoryPort usuarioRepositoryPort;

    @Mock
    private AgendamentoRepositoryPort agendamentoRepositoryPort;

    private SalaService salaService;

    @BeforeEach
    void setUp() {
        salaService = new SalaService(
                salaRepositoryPort,
                salaMapper,
                usuarioRepositoryPort,
                agendamentoRepositoryPort
        );
    }

    @Test
    void deveCriarSalaComSucesso() {
        CriarSalaRequest request = new CriarSalaRequest(
                "Sala 01",
                10,
                "Andar 1"
        );

        Sala salaSalva = Sala.builder()
                .nome("Sala 01")
                .disponivel(true)
                .capacidade(10)
                .localizacao("Andar 1")
                .build();

        SalaResponse response = mock(SalaResponse.class);

        when(salaRepositoryPort.existsByNomeIgnoreCase("Sala 01"))
                .thenReturn(false);

        when(salaRepositoryPort.salvar(any(Sala.class)))
                .thenReturn(salaSalva);

        when(salaMapper.entityToResponse(salaSalva))
                .thenReturn(response);

        SalaResponse resultado = salaService.criar(request);

        assertSame(response, resultado);

        verify(salaRepositoryPort).existsByNomeIgnoreCase("Sala 01");
        verify(salaRepositoryPort).salvar(any(Sala.class));
        verify(salaMapper).entityToResponse(salaSalva);
    }

    @Test
    void deveRejeitarCriacaoDeSalaComNomeJaExistente() {
        CriarSalaRequest request = new CriarSalaRequest(
                "Sala 01",
                10,
                "Andar 1"
        );

        when(salaRepositoryPort.existsByNomeIgnoreCase("Sala 01"))
                .thenReturn(true);

        assertThrows(
                SalaJaExisteException.class,
                () -> salaService.criar(request)
        );

        verify(salaRepositoryPort).existsByNomeIgnoreCase("Sala 01");
        verify(salaRepositoryPort, never()).salvar(any());
        verifyNoInteractions(salaMapper);
    }

    @Test
    void deveNormalizarEspacosAntesDeVerificarNomeExistente() {
        CriarSalaRequest request = new CriarSalaRequest(
                "  Sala    01  ",
                10,
                "Andar 1"
        );

        when(salaRepositoryPort.existsByNomeIgnoreCase("Sala 01"))
                .thenReturn(true);

        assertThrows(
                SalaJaExisteException.class,
                () -> salaService.criar(request)
        );

        verify(salaRepositoryPort)
                .existsByNomeIgnoreCase("Sala 01");

        verify(salaRepositoryPort, never()).salvar(any());
    }

    @Test
    void deveBuscarSalaPorId() {
        Sala sala = Sala.builder()
                .id(1L)
                .nome("Sala de Reunião")
                .disponivel(true)
                .capacidade(5)
                .localizacao("2º andar")
                .build();

        when(salaRepositoryPort.buscarPorId(1L))
                .thenReturn(Optional.of(sala));

        Sala resultado = salaService.buscarPorId(1L);

        assertSame(sala, resultado);

        verify(salaRepositoryPort).buscarPorId(1L);
    }

    @Test
    void deveLancarExcecaoQuandoSalaNaoExistir() {
        Long id = 999L;

        when(salaRepositoryPort.buscarPorId(id))
                .thenReturn(Optional.empty());

        assertThrows(
                SalaInexistenteException.class,
                () -> salaService.buscarPorId(id)
        );

        verify(salaRepositoryPort).buscarPorId(id);
        verifyNoInteractions(salaMapper);
    }


    @Test
    void deveListarTodasAsSalas() {
        Sala sala1 = Sala.builder()
                .nome("Sala 01")
                .disponivel(true)
                .capacidade(10)
                .localizacao("Andar 1")
                .build();

        Sala sala2 = Sala.builder()
                .nome("Sala 02")
                .disponivel(true)
                .capacidade(20)
                .localizacao("Andar 2")
                .build();

        SalaResponse response1 = mock(SalaResponse.class);
        SalaResponse response2 = mock(SalaResponse.class);

        when(salaRepositoryPort.buscarTodas())
                .thenReturn(List.of(sala1, sala2));

        when(salaMapper.entityToResponse(sala1))
                .thenReturn(response1);

        when(salaMapper.entityToResponse(sala2))
                .thenReturn(response2);

        List<SalaResponse> resultado = salaService.listarSalas();

        assertEquals(2, resultado.size());
        assertEquals(List.of(response1, response2), resultado);

        verify(salaRepositoryPort).buscarTodas();
        verify(salaMapper).entityToResponse(sala1);
        verify(salaMapper).entityToResponse(sala2);
    }

    @Test
    void deveRetornarListaVaziaQuandoNaoExistiremSalas() {
        when(salaRepositoryPort.buscarTodas())
                .thenReturn(List.of());

        List<SalaResponse> resultado = salaService.listarSalas();

        assertTrue(resultado.isEmpty());

        verify(salaRepositoryPort).buscarTodas();
        verifyNoInteractions(salaMapper);
    }

    @Test
    void deveBuscarSalasDisponiveisComSucesso() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        Sala sala = Sala.builder()
                .nome("Sala 01")
                .disponivel(true)
                .capacidade(10)
                .localizacao("Andar 1")
                .build();

        SalaResponse response = mock(SalaResponse.class);

        when(salaRepositoryPort.buscarDisoniveis(
                data,
                inicio,
                fim,
                5
        )).thenReturn(List.of(sala));

        when(salaMapper.entityToResponse(sala))
                .thenReturn(response);

        List<SalaResponse> resultado = salaService.buscarSalasDisponiveis(
                data,
                inicio,
                fim,
                5,
                null
        );

        assertEquals(1, resultado.size());
        assertSame(response, resultado.get(0));

        verify(salaRepositoryPort)
                .buscarDisoniveis(data, inicio, fim, 5);

        verify(salaMapper).entityToResponse(sala);

        verifyNoInteractions(usuarioRepositoryPort);
    }

    @Test
    void deveRetornarListaVaziaQuandoNenhumaSalaEstiverDisponivel() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        when(salaRepositoryPort.buscarDisoniveis(
                data,
                inicio,
                fim,
                5
        )).thenReturn(List.of());

        List<SalaResponse> resultado = salaService.buscarSalasDisponiveis(
                data,
                inicio,
                fim,
                5,
                null
        );

        assertTrue(resultado.isEmpty());

        verify(salaRepositoryPort)
                .buscarDisoniveis(data, inicio, fim, 5);

        verifyNoInteractions(salaMapper);
    }

    @Test
    void deveListarSalasSemCapacidadeSemErroDeOrdenacao() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        Sala arena = Sala.builder()
                .nome("Arena")
                .disponivel(true)
                .capacidade(null)
                .restrito(true)
                .localizacao("Tamboré")
                .build();

        Sala salaComCapacidade = Sala.builder()
                .nome("Sala 01")
                .disponivel(true)
                .capacidade(4)
                .localizacao("Tamboré")
                .build();

        when(salaRepositoryPort.buscarDisoniveis(
                data,
                inicio,
                fim,
                5
        )).thenReturn(List.of(arena, salaComCapacidade));

        when(salaMapper.entityToResponse(arena))
                .thenReturn(mock(SalaResponse.class));
        when(salaMapper.entityToResponse(salaComCapacidade))
                .thenReturn(mock(SalaResponse.class));

        List<SalaResponse> resultado = salaService.buscarSalasDisponiveis(
                data,
                inicio,
                fim,
                5,
                null
        );

        assertEquals(2, resultado.size());
    }

    @Test
    void deveRejeitarQuantidadeDePessoasMenorQueUm() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        inicio,
                        fim,
                        0,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
        verifyNoInteractions(usuarioRepositoryPort);
        verifyNoInteractions(salaMapper);
    }

    @Test
    void deveRejeitarQuantidadeDePessoasNula() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        inicio,
                        fim,
                        null,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void deveRejeitarDataNoPassado() {
        LocalDate data = LocalDate.now().minusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        inicio,
                        fim,
                        5,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void deveRejeitarDataNula() {
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        null,
                        inicio,
                        fim,
                        5,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void deveRejeitarHorarioInicialNulo() {
        LocalDate data = LocalDate.now().plusDays(1);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        null,
                        LocalTime.of(15, 0),
                        5,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void deveRejeitarHorarioFinalNulo() {
        LocalDate data = LocalDate.now().plusDays(1);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        LocalTime.of(14, 0),
                        null,
                        5,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void deveRejeitarHorarioFinalAnteriorAoInicial() {
        LocalDate data = LocalDate.now().plusDays(1);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        LocalTime.of(15, 0),
                        LocalTime.of(14, 0),
                        5,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void deveRejeitarHorarioFinalIgualAoInicial() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime horario = LocalTime.of(14, 0);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        horario,
                        horario,
                        5,
                        null
                )
        );

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void deveCalcularDuracaoEmMinutos() {
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(16, 30);

        long duracao = salaService.calcularDuracao(inicio, fim);

        assertEquals(150, duracao);
    }

    @Test
    void usuarioDeveSerImpedidoDeReservarMaisDeDuasHoras() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(17, 0);

        Usuario usuario = mock(Usuario.class);

        when(usuarioRepositoryPort.buscarUsuarioEmail("usuario@email.com"))
                .thenReturn(Optional.of(usuario));

        when(usuario.getPerfilUsuario())
                .thenReturn(PerfilUsuario.USER);

        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        inicio,
                        fim,
                        5,
                        "usuario@email.com"
                )
        );

        verify(usuarioRepositoryPort)
                .buscarUsuarioEmail("usuario@email.com");

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void usuarioPodeReservarExatamenteDuasHoras() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(16, 0);

        when(salaRepositoryPort.buscarDisoniveis(
                data,
                inicio,
                fim,
                5
        )).thenReturn(List.of());

        List<SalaResponse> resultado = salaService.buscarSalasDisponiveis(
                data,
                inicio,
                fim,
                5,
                "usuario@email.com"
        );

        assertTrue(resultado.isEmpty());

        verify(salaRepositoryPort)
                .buscarDisoniveis(data, inicio, fim, 5);

        verifyNoInteractions(usuarioRepositoryPort);
    }

    @Test
    void usuarioComPerfilDiferenteDeUserPodeReservarMaisDeDuasHoras() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(18, 0);

        Usuario usuario = mock(Usuario.class);

        when(usuarioRepositoryPort.buscarUsuarioEmail("admin@email.com"))
                .thenReturn(Optional.of(usuario));

        when(usuario.getPerfilUsuario())
                .thenReturn(PerfilUsuario.ADMIN);

        when(salaRepositoryPort.buscarDisoniveis(
                data,
                inicio,
                fim,
                5
        )).thenReturn(List.of());

        List<SalaResponse> resultado = salaService.buscarSalasDisponiveis(
                data,
                inicio,
                fim,
                5,
                "admin@email.com"
        );

        assertTrue(resultado.isEmpty());

        verify(salaRepositoryPort)
                .buscarDisoniveis(data, inicio, fim, 5);
    }

    @Test
    void deveLancarExcecaoQuandoUsuarioNaoExistir() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(17, 0);

        when(usuarioRepositoryPort.buscarUsuarioEmail("usuario@email.com"))
                .thenReturn(Optional.empty());

        assertThrows(
                UsuarioInexistenteException.class,
                () -> salaService.buscarSalasDisponiveis(
                        data,
                        inicio,
                        fim,
                        5,
                        "usuario@email.com"
                )
        );

        verify(usuarioRepositoryPort)
                .buscarUsuarioEmail("usuario@email.com");

        verifyNoInteractions(salaRepositoryPort);
    }

    @Test
    void emailNuloDeveConsiderarUsuarioComoUser() {
        LocalDate data = LocalDate.now().plusDays(1);
        LocalTime inicio = LocalTime.of(14, 0);
        LocalTime fim = LocalTime.of(15, 0);

        when(salaRepositoryPort.buscarDisoniveis(
                data,
                inicio,
                fim,
                5
        )).thenReturn(List.of());

        List<SalaResponse> resultado = salaService.buscarSalasDisponiveis(
                data,
                inicio,
                fim,
                5,
                null
        );

        assertTrue(resultado.isEmpty());

        verifyNoInteractions(usuarioRepositoryPort);
        verify(salaRepositoryPort)
                .buscarDisoniveis(data, inicio, fim, 5);
    }

    @Test
    void deveListarOcupacoesDaData() {
        LocalDate data = LocalDate.now().plusDays(1);

        Agendamento primeiraReserva = Agendamento.builder()
                .salaId(Sala.builder().id(2L).build())
                .horaInicio(LocalTime.of(14, 0))
                .horaFim(LocalTime.of(15, 0))
                .build();

        Agendamento segundaReserva = Agendamento.builder()
                .salaId(Sala.builder().id(5L).build())
                .horaInicio(LocalTime.of(16, 30))
                .horaFim(LocalTime.of(17, 0))
                .build();

        when(agendamentoRepositoryPort.buscarPorData(data))
                .thenReturn(List.of(primeiraReserva, segundaReserva));

        List<OcupacaoSalaResponse> resultado = salaService.buscarOcupacoes(data);

        assertEquals(2, resultado.size());
        assertEquals(2L, resultado.get(0).salaId());
        assertEquals(LocalTime.of(14, 0), resultado.get(0).horaInicio());
        assertEquals(LocalTime.of(15, 0), resultado.get(0).horaFim());
        assertEquals(5L, resultado.get(1).salaId());

        verify(agendamentoRepositoryPort).buscarPorData(data);
        verifyNoInteractions(salaRepositoryPort);
        verifyNoInteractions(salaMapper);
    }

    @Test
    void deveRetornarListaVaziaQuandoDataNaoTiverReservas() {
        LocalDate data = LocalDate.now().plusDays(1);

        when(agendamentoRepositoryPort.buscarPorData(data)).thenReturn(List.of());

        List<OcupacaoSalaResponse> resultado = salaService.buscarOcupacoes(data);

        assertTrue(resultado.isEmpty());

        verify(agendamentoRepositoryPort).buscarPorData(data);
    }

    @Test
    void deveRejeitarDataNulaNasOcupacoes() {
        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarOcupacoes(null)
        );

        verifyNoInteractions(agendamentoRepositoryPort);
    }

    @Test
    void deveRejeitarDataPassadaNasOcupacoes() {
        assertThrows(
                ValidacaoBuscaException.class,
                () -> salaService.buscarOcupacoes(LocalDate.now().minusDays(1))
        );

        verifyNoInteractions(agendamentoRepositoryPort);
    }
}
