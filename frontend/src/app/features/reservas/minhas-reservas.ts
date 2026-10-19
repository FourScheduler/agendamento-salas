import { DestroyRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BuscaReservasRequest, Reserva, StatusReserva } from '../../core/models/api.models';
import { mensagemDeErro } from '../../core/http/api-error';
import { ReservasService } from '../../core/services/reservas.service';
import { dataCurta, paraIso } from '../../core/util/formatos';
import { ToastService } from '../../shared/toast/toast';
import { Carregando } from '../../shared/estados/carregando';
import { Erro } from '../../shared/estados/erro';
import { Vazio } from '../../shared/estados/vazio';

type Filtro = 'futuras' | 'passadas';

/** Item da lista já posicionado: a posição só existe nas reservas futuras. */
interface CartaoReserva {
  chave: string;
  reserva: Reserva;
  posicao: number | null;
}

/** Período personalizado que substitui o seletor Futuras/Passadas. */
interface PeriodoPersonalizado {
  inicio: string | null;
  fim: string | null;
}

const ROTULOS_STATUS: Partial<Record<StatusReserva, string>> = {
  CONFIRMADO: 'Confirmada',
  CANCELADO: 'Cancelada',
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  AGUARDANDO_ESCOLHA: 'Aguardando escolha',
  RESERVANDO: 'Reservando',
  ERRO: 'Erro',
};

/** Status que o filtro oferece; os demais estados do orquestrador ficam de fora. */
const OPCOES_STATUS: StatusReserva[] = ['CONFIRMADO', 'CANCELADO', 'AGUARDANDO_CONFIRMACAO'];

@Component({
  selector: 'app-minhas-reservas',
  imports: [Carregando, Erro, Vazio],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.css',
})
export class MinhasReservas implements OnInit {
  private readonly reservasService = inject(ReservasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly reservas = signal<Reserva[]>([]);
  readonly carregando = signal(false);
  readonly erroApi = signal<string | null>(null);
  readonly filtro = signal<Filtro>('futuras');

  /** Status escolhido no filtro; `null` significa "todos". */
  readonly statusFiltro = signal<StatusReserva | null>(null);
  /** Período informado nas datas; quando preenchido, sobrepõe o seletor Futuras/Passadas. */
  readonly periodoFiltro = signal<PeriodoPersonalizado>({ inicio: null, fim: null });

  readonly opcoesStatus = OPCOES_STATUS;

  /** true quando o período De/Até assume o controle da busca. */
  readonly periodoPersonalizado = computed(
    () => this.periodoFiltro().inicio !== null || this.periodoFiltro().fim !== null,
  );

  /** Avisa quando a data inicial é posterior à final. */
  readonly periodoInvalido = computed(() => {
    const { inicio, fim } = this.periodoFiltro();
    return Boolean(inicio && fim && inicio > fim);
  });

  /** Chave da reserva cuja confirmação de cancelamento está aberta. */
  readonly cancelamentoSolicitado = signal<string | null>(null);
  /** Chave da reserva cujo cancelamento está em andamento na API. */
  readonly cancelamentoEmAndamento = signal<string | null>(null);

  readonly visiveis = computed(() => {
    // Com período personalizado o backend já recortou por data; não filtrar de novo.
    const lista = this.periodoPersonalizado()
      ? [...this.reservas()]
      : this.reservas().filter((reserva) =>
          this.filtro() === 'futuras' ? this.ehFutura(reserva) : !this.ehFutura(reserva),
        );

    const porMomento = (a: Reserva, b: Reserva) =>
      this.momento(a).localeCompare(this.momento(b));

    const ascendente = this.periodoPersonalizado() || this.filtro() === 'futuras';

    return ascendente ? lista.sort(porMomento) : lista.sort((a, b) => porMomento(b, a));
  });

  /** Lista exibida com a ordem de cada reserva futura (1º, 2º, 3º...). */
  readonly cartoes = computed<CartaoReserva[]>(() => {
    // A numeração é da aba Futuras; no período personalizado as datas já identificam cada linha.
    const numera = !this.periodoPersonalizado() && this.filtro() === 'futuras';

    return this.visiveis().map((reserva, indice) => ({
      chave: this.chave(reserva),
      reserva,
      posicao: numera ? indice + 1 : null,
    }));
  });

  readonly tituloVazio = 'Nenhuma reserva encontrada';
  readonly mensagemVazio = computed(() =>
    this.temFiltroAtivo()
      ? 'Nenhuma reserva corresponde aos filtros escolhidos.'
      : 'As suas reservas aparecerão aqui assim que forem criadas.',
  );

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    if (this.periodoInvalido()) {
      return;
    }

    const { inicio, fim } = this.periodoFiltro();

    const requisicao: BuscaReservasRequest = {
      dataInicio: inicio,
      dataFinal: fim,
      statusAgendamento: this.statusFiltro(),
      todosUsuarios: false,
    };

    this.erroApi.set(null);
    this.carregando.set(true);

    this.reservasService
      .buscarFiltradas(requisicao)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservas) => {
          this.reservas.set(
            reservas
              .map((reserva) => this.normalizarReserva(reserva))
              .filter((reserva) => this.umaReservaValida(reserva)),
          );
          this.carregando.set(false);
        },
        error: (erro: unknown) => {
          this.reservas.set([]);
          this.carregando.set(false);
          this.erroApi.set(mensagemDeErro(erro));
        },
      });
  }

  trocarFiltro(filtro: Filtro): void {
    this.filtro.set(filtro);
  }

  /** Muda o status e consulta o backend de novo. */
  trocarStatus(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.statusFiltro.set(valor ? (valor as StatusReserva) : null);
    this.buscar();
  }

  /** Altera uma das datas do período e consulta o backend de novo. */
  trocarData(campo: 'inicio' | 'fim', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;

    this.periodoFiltro.update((periodo) => ({ ...periodo, [campo]: valor || null }));
    this.buscar();
  }

  /** Volta para o padrão: sem status e sem período informado. */
  limparFiltros(): void {
    this.statusFiltro.set(null);
    this.periodoFiltro.set({ inicio: null, fim: null });
    this.buscar();
  }

  /** Mostra a ação de limpar só quando há algo filtrado. */
  temFiltroAtivo(): boolean {
    return this.statusFiltro() !== null || this.periodoPersonalizado();
  }

  /** Volta para a tela de agendamento de salas. */
  voltarParaAgendamento(): void {
    this.router.navigate(['/agendamento']);
  }

  agendar(): void {
    this.voltarParaAgendamento();
  }

  formatarData(iso: string): string {
    return dataCurta(iso);
  }

  formatarHora(hora: string): string {
    return hora.slice(0, 5);
  }

  /** "1 pessoa" ou "2 pessoas", para a linha de metadados do cartão. */
  quantidadePessoas(qntdPessoas: number): string {
    return `${qntdPessoas} ${qntdPessoas === 1 ? 'pessoa' : 'pessoas'}`;
  }

  chave(reserva: Reserva): string {
    return `${reserva.dataAgendamento}-${reserva.horaInicio}-${reserva.salaId?.id ?? ''}`;
  }

  rotuloStatus(status: StatusReserva): string {
    return ROTULOS_STATUS[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
  }

  /** Rótulo ordinal de uma reserva futura: 1º, 2º, 3º... */
  ordinal(posicao: number): string {
    return `${posicao}º`;
  }

  /**
   * Só reserva futura, confirmada e com id aceita cancelamento.
   * Depende da data, não do número ordinal: no período De/Até a numeração
   * fica desligada, mas o cancelamento continua disponível.
   */
  podeCancelar(cartao: CartaoReserva): boolean {
    return (
      this.ehFutura(cartao.reserva) &&
      cartao.reserva.status === 'CONFIRMADO' &&
      cartao.reserva.id != null
    );
  }

  /** Abre a confirmação inline, evitando cancelamentos acidentais. */
  solicitarCancelamento(cartao: CartaoReserva): void {
    if (!this.podeCancelar(cartao)) {
      return;
    }

    this.cancelamentoSolicitado.set(this.chave(cartao.reserva));
  }

  /** Fecha a confirmação sem cancelar. */
  desistirCancelamento(): void {
    this.cancelamentoSolicitado.set(null);
  }

  cancelarReserva(cartao: CartaoReserva): void {
    const id = cartao.reserva.id;

    if (id == null || !this.podeCancelar(cartao)) {
      return;
    }

    const chave = this.chave(cartao.reserva);
    const rotulo = cartao.reserva.salaId?.nome ?? 'Reserva';

    this.cancelamentoEmAndamento.set(chave);

    this.reservasService
      .cancelar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelamentoEmAndamento.set(null);
          this.cancelamentoSolicitado.set(null);
          this.toast.sucesso('Reserva cancelada', `${rotulo} foi liberada.`);
          this.buscar();
        },
        error: (erro: unknown) => {
          this.cancelamentoEmAndamento.set(null);
          this.cancelamentoSolicitado.set(null);
          this.toast.erro('Não foi possível cancelar', mensagemDeErro(erro));
        },
      });
  }

  ehCancelada(status: StatusReserva): boolean {
    return status === 'CANCELADO' || status === 'ERRO';
  }

  ehPendente(status: StatusReserva): boolean {
    return status !== 'CONFIRMADO' && !this.ehCancelada(status);
  }

  /**
   * Descarta itens que não têm a estrutura de uma reserva.
   * Protege a tela contra respostas inesperadas da API (ex.: outro serviço na porta).
   */
  private umaReservaValida(reserva: Reserva): boolean {
    return Boolean(
      reserva &&
        reserva.salaId &&
        typeof reserva.dataAgendamento === 'string' &&
        typeof reserva.horaInicio === 'string' &&
        typeof reserva.horaFim === 'string',
    );
  }

  private normalizarReserva(reserva: Reserva): Reserva {
    return {
      ...reserva,
      salaId: reserva.salaId ?? reserva.sala,
    };
  }

  private ehFutura(reserva: Reserva): boolean {
    return this.momento(reserva) > this.agoraIso();
  }

  private momento(reserva: Reserva): string {
    return `${reserva.dataAgendamento}T${reserva.horaFim}`;
  }

  private agoraIso(): string {
    const agora = new Date();
    const hora = [agora.getHours(), agora.getMinutes(), agora.getSeconds()]
      .map((parte) => String(parte).padStart(2, '0'))
      .join(':');

    return `${paraIso(agora)}T${hora}`;
  }
}
