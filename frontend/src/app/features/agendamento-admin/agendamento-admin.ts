import { DestroyRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { BuscaSalasRequest, OcupacaoSala, Usuario } from '../../core/models/api.models';
import { mensagemDeErro } from '../../core/http/api-error';
import { AuthService } from '../../core/services/auth.service';
import { ReservasService } from '../../core/services/reservas.service';
import { SalasService } from '../../core/services/salas.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { SalaPlanta, resolverEstados } from '../../core/data/mapa-mock';
import {
  dataCurta,
  fimDeJornada,
  hojeIso,
  normalizarNome,
  paraHora,
  paraMinutos,
  proximaHoraCheia,
} from '../../core/util/formatos';
import { MapaSalas } from '../agendamento/mapa-salas';
import { PainelReserva } from '../agendamento/painel-reserva';
import { ToastService } from '../../shared/toast/toast';

/**
 * Agendamento administrativo: mesmo mapa e mesmo painel da tela comum, sem
 * assistente. As diferenças são escolher várias salas, duração acima de 2 horas
 * e selecionar o solicitante em outro usuário. O backend impõe as regras de
 * perfil (ADMIN); esta tela apenas conduz o administrador até elas.
 */
@Component({
  selector: 'app-agendamento-admin',
  imports: [MapaSalas, PainelReserva],
  templateUrl: './agendamento-admin.html',
  styleUrl: './agendamento-admin.css',
})
export class AgendamentoAdmin implements OnInit {
  private readonly salasService = inject(SalasService);
  private readonly reservasService = inject(ReservasService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  /**
   * Durações de 30 em 30 minutos cobrindo o dia inteiro (o limite de 120 min
   * vale apenas para USER). O fim precisa ficar antes das 24:00, então a
   * opção máxima respeita o horário inicial escolhido.
   */
  readonly duracoes = computed(() => {
    const inicio = paraMinutos(this.horaInicio()) ?? 0;
    const maximo = Math.floor((MINUTOS_NO_DIA - 1 - inicio) / PASSO_DURACAO) * PASSO_DURACAO;
    const opcoes: number[] = [];
    for (let minutos = PASSO_DURACAO; minutos <= maximo; minutos += PASSO_DURACAO) {
      opcoes.push(minutos);
    }
    return opcoes;
  });
  readonly hoje = hojeIso();

  readonly data = signal(this.hoje);
  readonly horaInicio = signal(proximaHoraCheia());
  readonly duracao = signal(60);
  readonly pessoas = signal(1);
  readonly equipamentos = signal(false);

  readonly salas = signal<SalaPlanta[]>([]);
  /** Nomes das salas escolhidas; várias ao mesmo tempo no modo administrativo. */
  readonly selecionadas = signal<string[]>([]);
  /**
   * Ocupações do dia por requisição; `itens` nulo significa que a resposta ainda
   * não chegou (ou falhou) e a planta não pode arriscar um horário livre.
   */
  private readonly ocupacoesSalvas = signal<{
    data: string;
    itens: OcupacaoSala[] | null;
  } | null>(null);
  readonly carregando = signal(false);
  readonly erroApi = signal<string | null>(null);
  readonly erroValidacao = signal<string | null>(null);

  readonly usuarios = signal<Usuario[]>([]);
  readonly carregandoUsuarios = signal(false);
  readonly erroUsuarios = signal<string | null>(null);
  /** Id do solicitante escolhido; nulo significa o próprio administrador. */
  readonly solicitanteId = signal<number | null>(null);

  readonly autenticado = this.auth.autenticado;
  readonly usuario = this.auth.usuario;
  readonly confirmando = signal(false);
  readonly erroConfirmacao = signal<string | null>(null);

  readonly salasEscolhidas = computed(() => {
    const nomes = this.selecionadas();
    return this.salas().filter((sala) => nomes.includes(sala.nome));
  });

  /** Capacidade considerada é a soma das salas escolhidas; a Arena, de
   * eventos, não tem capacidade e não limita a quantidade de pessoas. */
  readonly capacidadeTotal = computed(() => {
    const salas = this.salasEscolhidas();
    return salas.some((sala) => sala.capacidade === null)
      ? null
      : salas.reduce((total, sala) => total + (sala.capacidade ?? 0), 0);
  });

  /** Maior duração possível a partir do horário inicial (fim antes das 24:00). */
  readonly duracaoMaxima = computed(() => {
    const opcoes = this.duracoes();
    return opcoes[opcoes.length - 1] ?? null;
  });

  /** Ocupações do dia exibido; nulas enquanto não carregadas. */
  readonly ocupacoes = computed(() => {
    const salvas = this.ocupacoesSalvas();
    return salvas && salvas.data === this.data() ? salvas.itens : null;
  });

  readonly solicitanteEscolhido = computed(() => {
    const id = this.solicitanteId();
    if (id === null) {
      return null;
    }

    return this.usuarios().find((item) => item.id === id) ?? null;
  });

  ngOnInit(): void {
    this.buscar();
    this.carregarUsuarios();
  }

  /** Liga/desliga uma sala entre as escolhidas, mantendo a capacidade válida. */
  alternarSala(nome: string): void {
    this.selecionadas.update((nomes) =>
      nomes.includes(nome) ? nomes.filter((item) => item !== nome) : [...nomes, nome],
    );
    this.limparErroConfirmacao();

    const total = this.capacidadeTotal();
    if (total !== null && total > 0 && this.pessoas() > total) {
      this.pessoas.set(total);
      this.buscar();
    }
  }

  atualizarData(valor: string): void {
    this.data.set(valor);
    this.limparErroConfirmacao();
    this.buscar();
  }

  atualizarHora(valor: string): void {
    this.horaInicio.set(valor);
    this.ajustarDuracaoAoDia();
    this.limparErroConfirmacao();
    this.buscar();
  }

  atualizarDuracao(valor: number): void {
    this.duracao.set(valor);
    this.limparErroConfirmacao();
    this.buscar();
  }

  atualizarPessoas(valor: number): void {
    this.pessoas.set(valor);
    this.limparErroConfirmacao();
    this.buscar();
  }

  /** `0` no seletor representa o próprio administrador logado (sem solicitante). */
  selecionarSolicitante(id: number): void {
    this.solicitanteId.set(id === 0 ? null : id);
    this.limparErroConfirmacao();
  }

  buscar(): void {
    const falha = this.validar();
    if (falha) {
      this.erroValidacao.set(falha);
      return;
    }

    // A planta usa as ocupações do dia para apontar, em cada sala, a próxima folga.
    this.carregarOcupacoes();

    const requisicao: BuscaSalasRequest = {
      data: this.data(),
      horaInicio: this.horaInicio(),
      horaFim: horaFinal(this.horaInicio(), this.duracao()),
      qntdPessoas: this.pessoas(),
    };

    this.erroValidacao.set(null);
    this.erroApi.set(null);
    this.carregando.set(true);

    this.salasService
      .buscarDisponiveis(requisicao)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respostas) => {
          const livres = respostas.map((sala) => sala.nome);
          this.atualizarSelecao(livres);
          this.salas.set(resolverEstados(respostas));
          this.carregando.set(false);
        },
        error: (erro: unknown) => {
          this.salas.set([]);
          this.selecionadas.set([]);
          this.carregando.set(false);
          this.erroApi.set(mensagemDeErro(erro));
        },
      });
  }

  async confirmar(): Promise<void> {
    if (!this.auth.autenticado()) {
      this.erroConfirmacao.set('Faça login para confirmar a reserva.');
      return;
    }

    const escolhidas = this.salasEscolhidas();
    if (escolhidas.length === 0) {
      this.erroConfirmacao.set('Escolha ao menos uma sala no mapa para reservar.');
      return;
    }

    if (this.confirmando()) {
      return;
    }

    const horaFim = horaFinal(this.horaInicio(), this.duracao());
    this.confirmando.set(true);
    this.limparErroConfirmacao();

    try {
      const solicitante = this.solicitanteEscolhido();
      const reserva = await firstValueFrom(
        this.reservasService.confirmar({
          salaId: escolhidas.map((sala) => ({ id: sala.id })),
          data: this.data(),
          horaInicio: this.horaInicio(),
          horaFim,
          qntdPessoas: this.pessoas(),
          titulo: montarTitulo(escolhidas),
          usuarioIdSolicitante: solicitante ? { id: solicitante.id } : null,
        }),
      );

      const detalhes = reserva.id != null ? ` (nº ${reserva.id})` : '';
      const salasReservadas =
        escolhidas.length === 1 ? escolhidas[0].nome : `${escolhidas.length} salas`;
      this.toast.sucesso(
        `Reserva de ${salasReservadas} confirmada${detalhes}`,
        `${dataCurta(this.data())}, das ${this.horaInicio()} às ${horaFim}.`,
      );
      this.selecionadas.set([]);
      this.reiniciarPainel();
      this.buscar();
    } catch (erro: unknown) {
      this.erroConfirmacao.set(mensagemDeErro(erro));
    } finally {
      this.confirmando.set(false);
    }
  }

  private carregarUsuarios(): void {
    this.carregandoUsuarios.set(true);
    this.erroUsuarios.set(null);

    this.usuariosService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.usuarios.set(lista);
          this.carregandoUsuarios.set(false);
        },
        error: (erro: unknown) => {
          this.usuarios.set([]);
          this.carregandoUsuarios.set(false);
          this.erroUsuarios.set(mensagemDeErro(erro));
        },
      });
  }

  /**
   * Busca as ocupações do dia junto com o mapa, uma vez por data: a mesma janela
   * já serve a qualquer horário ou quantidade de pessoas ajustados na sequência.
   * Falha aqui degrada a dica para "ocupada neste horário", sem inventar horário.
   */
  private carregarOcupacoes(): void {
    const data = this.data();
    if (this.ocupacoesSalvas()?.data === data) {
      return;
    }

    this.ocupacoesSalvas.set({ data, itens: null });
    this.salasService
      .buscarOcupacoes(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (itens) => this.ocupacoesSalvas.set({ data, itens }),
        error: () => this.ocupacoesSalvas.set(null),
      });
  }

  /**
   * Devolve o painel ao estado inicial depois de uma reserva confirmada:
   * data de hoje e 1 pessoa, prontos para a próxima reserva.
   * A data é recalculada no momento porque `hoje` é fixo desde a abertura da tela.
   */
  private reiniciarPainel(): void {
    this.data.set(hojeIso());
    this.pessoas.set(1);
    // A reserva nova muda as ocupações do dia, então as antigas não valem mais.
    this.ocupacoesSalvas.set(null);
    this.erroValidacao.set(null);
    this.limparErroConfirmacao();
  }

  /** Depois de uma nova busca, só seguem escolhidas as salas que continuam livres. */
  private atualizarSelecao(livres: string[]): void {
    const livresNormais = new Set(livres.map((nome) => normalizarNome(nome)));
    this.selecionadas.update((nomes) =>
      nomes.filter((nome) => livresNormais.has(normalizarNome(nome))),
    );
  }

  private limparErroConfirmacao(): void {
    this.erroConfirmacao.set(null);
  }

  /**
   * Quando o horário inicial muda, a duração atual pode passar do fim do dia;
   * nesse caso ela volta para a última opção válida da lista.
   */
  private ajustarDuracaoAoDia(): void {
    const opcoes = this.duracoes();
    const maximo = opcoes[opcoes.length - 1];
    if (maximo !== undefined && this.duracao() > maximo) {
      this.duracao.set(maximo);
    }
  }

  private validar(): string | null {
    if (!this.data()) {
      return 'Informe a data da reserva.';
    }

    if (this.data() < this.hoje) {
      return 'A data não pode estar no passado.';
    }

    if (paraMinutos(this.horaInicio()) === null) {
      return 'Informe o horário inicial da reserva.';
    }

    if (fimDeJornada(this.horaInicio(), this.duracao())) {
      return 'O horário final precisa ficar dentro do mesmo dia.';
    }

    if (!Number.isInteger(this.pessoas()) || this.pessoas() < 1) {
      return 'A quantidade de pessoas deve ser ao menos 1.';
    }

    return null;
  }
}

/** Passo das opções de duração e limite do dia (fim antes das 24:00). */
const PASSO_DURACAO = 30;
const MINUTOS_NO_DIA = 24 * 60;

function horaFinal(inicio: string, duracao: number): string {
  return paraHora((paraMinutos(inicio) ?? 0) + duracao);
}

function montarTitulo(escolhidas: SalaPlanta[]): string {
  return escolhidas.length === 1
    ? `Reunião - ${escolhidas[0].nome}`
    : `Reunião - ${escolhidas.length} salas integradas`;
}
