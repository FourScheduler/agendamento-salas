import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Usuario } from '../../core/models/api.models';
import { SalaPlanta } from '../../core/data/mapa-mock';
import { dataCurta, paraHora, paraMinutos, rotuloDuracao as formatarDuracao } from '../../core/util/formatos';

type CampoAberto = 'data' | 'horario' | 'duracao' | 'solicitante' | null;

const FIM_DO_DIA = 24 * 60;
/** Passo e mínimo do stepper de duração (admin). */
const PASSO_DURACAO = 30;
/** Máximo de sugestões mostradas na busca de solicitante. */
const LIMITE_SUGESTOES = 8;

/** Item da busca de solicitante; `id` 0 é o próprio administrador logado. */
interface SugestaoSolicitante {
  id: number;
  nome: string;
  email: string | null;
  proprio: boolean;
}

/** Texto comparável na busca: sem acento e em minúsculas. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-painel-reserva',
  templateUrl: './painel-reserva.html',
  styleUrl: './painel-reserva.css',
})
export class PainelReserva {
  readonly sala = input<SalaPlanta | null>(null);
  /** Modo administrativo: várias salas escolhidas; vazio no modo comum. */
  readonly salas = input<SalaPlanta[]>([]);
  readonly data = input<string>('');
  readonly horaInicio = input<string>('');
  readonly duracao = input<number>(60);
  readonly pessoas = input<number>(1);
  readonly duracoes = input<number[]>([30, 60, 90, 120]);
  /** Modo stepper (admin): −/+ de 30 em 30 min em vez da lista de opções. */
  readonly stepperDuracao = input(false);
  /** Maior duração possível para o horário inicial; nulo quando não há limite. */
  readonly duracaoMaxima = input<number | null>(null);
  readonly equipamentos = input<boolean>(false);
  readonly autenticado = input<boolean>(false);
  readonly solicitante = input<string | null>(null);
  /** Modo administrativo: lista de usuários para escolher o solicitante. */
  readonly solicitantes = input<Usuario[]>([]);
  readonly solicitanteId = input<number | null>(null);
  readonly confirmando = input<boolean>(false);

  readonly dataAlterada = output<string>();
  readonly horaAlterada = output<string>();
  readonly duracaoAlterada = output<number>();
  readonly pessoasAlterada = output<number>();
  readonly equipamentosAlterada = output<boolean>();
  readonly solicitanteAlterado = output<number>();
  readonly confirmar = output<void>();

  readonly campoAberto = signal<CampoAberto>(null);

  /** Texto digitado na busca de solicitante (modo administrativo). */
  readonly buscaSolicitante = signal('');
  /** Sugestão em destaque no teclado (-1: nenhuma). */
  readonly sugestaoAtiva = signal(-1);

  private readonly injector = inject(Injector);
  private readonly campoBusca = viewChild<ElementRef<HTMLInputElement>>('campoBusca');

  readonly rotuloData = computed(() => dataCurta(this.data()));

  /** Capacidade considerada: soma das salas no modo múltiplo, senão a sala única. */
  readonly maximo = computed(() => {
    const salas = this.salas();
    if (salas.length > 0) {
      // Sala sem capacidade (Arena, de eventos) não limita as pessoas.
      if (salas.some((sala) => sala.capacidade === null)) {
        return null;
      }

      return salas.reduce((total, sala) => total + (sala.capacidade ?? 0), 0);
    }

    return this.sala()?.capacidade ?? null;
  });

  readonly naCapacidade = computed(() => {
    const limite = this.maximo();
    return limite !== null && this.pessoas() >= limite;
  });

  readonly duracaoMinima = computed(() => this.duracao() <= PASSO_DURACAO);

  readonly duracaoNoMaximo = computed(() => {
    const maximo = this.duracaoMaxima();
    return maximo !== null && this.duracao() >= maximo;
  });

  /** Atalhos do stepper: durações redondas até o máximo do dia. */
  readonly atalhosDuracao = computed(() => {
    const maximo = this.duracaoMaxima();
    const valores = [30, 60, 120, 240].filter(
      (minutos) => maximo === null || minutos < maximo,
    );

    if (maximo !== null && maximo > 0) {
      valores.push(maximo);
    }

    return valores;
  });

  readonly temSala = computed(() => this.sala() !== null || this.salas().length > 0);

  readonly podeConfirmar = computed(
    () => this.autenticado() && this.temSala() && !this.confirmando(),
  );

  readonly notaConfirmacao = computed(() => {
    if (!this.autenticado()) {
      return 'Faça login para confirmar a reserva.';
    }

    if (!this.temSala()) {
      return 'Selecione uma sala no mapa para continuar.';
    }

    return 'Reserva de demonstração; nada é enviado ao Outlook.';
  });

  /** Solicitante escolhido no modo administrativo; nulo significa o próprio admin. */
  readonly solicitanteEscolhido = computed(
    () => this.solicitantes().find((item) => item.id === this.solicitanteId())?.nome ?? null,
  );

  /**
   * Sugestões da busca por nome ou e-mail (sem acento/maiúsculas). O administrador
   * logado vem como primeiro item, marcado como `(eu mesmo)`, para não depender de
   * rolagem nem se repetir na lista.
   */
  readonly sugestoesSolicitante = computed<SugestaoSolicitante[]>(() => {
    const termo = normalizar(this.buscaSolicitante().trim());
    const nomeProprio = (this.solicitante() ?? '').trim();
    const proprio: SugestaoSolicitante = {
      id: 0,
      nome: nomeProprio || 'Eu mesmo',
      email: null,
      proprio: true,
    };

    const outros = this.solicitantes()
      .filter((usuario) => normalizar(usuario.nome) !== normalizar(nomeProprio))
      .map<SugestaoSolicitante>((usuario) => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        proprio: false,
      }));

    const casaComTermo = (item: SugestaoSolicitante) =>
      normalizar(item.nome).includes(termo) ||
      (item.email !== null && normalizar(item.email).includes(termo));

    const sugestoes: SugestaoSolicitante[] = casaComTermo(proprio) ? [proprio] : [];
    sugestoes.push(...outros.filter(casaComTermo).slice(0, LIMITE_SUGESTOES - sugestoes.length));

    return sugestoes;
  });

  /** Id da sugestão em destaque, para o aria-activedescendant do campo. */
  readonly sugestaoAtivaId = computed(() => {
    const sugestao = this.sugestoesSolicitante()[this.sugestaoAtiva()];
    return sugestao ? `sugestao-solicitante-${sugestao.id}` : null;
  });

  readonly horaFim = computed(() => {
    const inicio = paraMinutos(this.horaInicio());
    if (inicio === null) {
      return '--:--';
    }

    return paraHora(Math.min(inicio + this.duracao(), FIM_DO_DIA));
  });

  alternar(campo: Exclude<CampoAberto, null>): void {
    const abrindo = this.campoAberto() !== campo;
    this.campoAberto.set(abrindo ? campo : null);

    if (abrindo && campo === 'solicitante') {
      // Abre com o nome já escolhido selecionado: basta digitar para trocar.
      this.buscaSolicitante.set(this.solicitanteEscolhido() ?? '');
      this.sugestaoAtiva.set(-1);

      afterNextRender(
        () => {
          const campoBusca = this.campoBusca()?.nativeElement;
          campoBusca?.focus();
          campoBusca?.select();
        },
        { injector: this.injector },
      );
    }
  }

  /** Filtra a lista de usuários por nome ou e-mail enquanto o admin digita. */
  buscarSolicitante(texto: string): void {
    this.buscaSolicitante.set(texto);
    this.sugestaoAtiva.set(this.sugestoesSolicitante().length > 0 ? 0 : -1);
  }

  /** Escolhe um usuário da lista; `0` representa o próprio administrador. */
  escolherSolicitante(id: number): void {
    this.solicitanteAlterado.emit(id);
    this.campoAberto.set(null);
  }

  /** Setas, Enter e Esc na lista de sugestões do solicitante. */
  teclaSolicitante(evento: KeyboardEvent): void {
    const sugestoes = this.sugestoesSolicitante();

    switch (evento.key) {
      case 'ArrowDown':
        this.sugestaoAtiva.update((indice) => Math.min(indice + 1, sugestoes.length - 1));
        evento.preventDefault();
        break;
      case 'ArrowUp':
        this.sugestaoAtiva.update((indice) => Math.max(indice - 1, -1));
        evento.preventDefault();
        break;
      case 'Enter': {
        const indice = this.sugestaoAtiva() >= 0 ? this.sugestaoAtiva() : sugestoes.length === 1 ? 0 : -1;
        const sugestao = sugestoes[indice];
        if (sugestao) {
          this.escolherSolicitante(sugestao.id);
          evento.preventDefault();
        }
        break;
      }
      case 'Escape':
        this.campoAberto.set(null);
        evento.preventDefault();
        break;
    }
  }

  mudarPessoas(delta: number): void {
    const limite = this.maximo();
    const alvo = this.pessoas() + delta;
    const valor = Math.max(1, limite === null ? alvo : Math.min(alvo, limite));

    if (valor !== this.pessoas()) {
      this.pessoasAlterada.emit(valor);
    }
  }

  /** Passo do stepper de duração: +/− 30 minutos, respeitando o fim do dia. */
  mudarDuracao(delta: number): void {
    const maximo = this.duracaoMaxima();
    const alvo = this.duracao() + delta;
    const valor = Math.max(PASSO_DURACAO, maximo === null ? alvo : Math.min(alvo, maximo));

    if (valor !== this.duracao()) {
      this.duracaoAlterada.emit(valor);
    }
  }

  /** Aplica um atalho de duração do stepper (ex.: "2 h" ou "Dia inteiro"). */
  aplicarDuracao(minutos: number): void {
    if (minutos !== this.duracao()) {
      this.duracaoAlterada.emit(minutos);
    }
  }

  caixaMarcada(evento: Event): boolean {
    return (evento.target as HTMLInputElement).checked;
  }

  valorDoCampo(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  valorNumerico(evento: Event): number {
    return Number(this.valorDoCampo(evento));
  }

  rotuloDuracao(minutos: number): string {
    return formatarDuracao(minutos);
  }

  /** Último atalho do stepper é o dia cheio a partir do horário inicial. */
  rotuloAtalhoDuracao(minutos: number): string {
    return minutos === this.duracaoMaxima() ? 'Dia inteiro' : formatarDuracao(minutos);
  }

  /** Capacidade em texto; a Arena é de eventos e não tem limite de pessoas. */
  rotuloCapacidade(sala: SalaPlanta): string {
    return sala.capacidade === null ? 'Eventos' : `Até ${sala.capacidade} pessoas`;
  }
}
