import { DestroyRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BuscaReservasRequest, Reserva, StatusReserva } from '../../core/models/api.models';
import { mensagemDeErro } from '../../core/http/api-error';
import { ReservasService } from '../../core/services/reservas.service';
import { dataCurta, paraIso } from '../../core/util/formatos';
import { Carregando } from '../../shared/estados/carregando';
import { Erro } from '../../shared/estados/erro';
import { Vazio } from '../../shared/estados/vazio';

type Filtro = 'futuras' | 'passadas';

const ROTULOS_STATUS: Partial<Record<StatusReserva, string>> = {
  CONFIRMADO: 'Confirmada',
  CANCELADO: 'Cancelada',
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  AGUARDANDO_ESCOLHA: 'Aguardando escolha',
  RESERVANDO: 'Reservando',
  ERRO: 'Erro',
};

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

  readonly reservas = signal<Reserva[]>([]);
  readonly carregando = signal(false);
  readonly erroApi = signal<string | null>(null);
  readonly filtro = signal<Filtro>('futuras');

  readonly visiveis = computed(() => {
    const lista = this.reservas().filter((reserva) =>
      this.filtro() === 'futuras' ? this.ehFutura(reserva) : !this.ehFutura(reserva),
    );

    const porMomento = (a: Reserva, b: Reserva) =>
      this.momento(a).localeCompare(this.momento(b));

    return this.filtro() === 'futuras'
      ? [...lista].sort(porMomento)
      : [...lista].sort((a, b) => porMomento(b, a));
  });

  readonly tituloVazio = 'Nenhuma reserva encontrada';
  readonly mensagemVazio = 'As suas reservas aparecerão aqui assim que forem criadas.';

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    const requisicao: BuscaReservasRequest = {
      dataInicio: null,
      dataFinal: null,
      statusAgendamento: null,
      todosUsuarios: false,
    };

    this.erroApi.set(null);
    this.carregando.set(true);

    this.reservasService
      .buscarFiltradas(requisicao)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservas) => {
          this.reservas.set(reservas.filter((reserva) => this.umaReservaValida(reserva)));
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

  agendar(): void {
    this.router.navigate(['/agendamento']);
  }

  formatarData(iso: string): string {
    return dataCurta(iso);
  }

  formatarHora(hora: string): string {
    return hora.slice(0, 5);
  }

  chave(reserva: Reserva): string {
    return `${reserva.dataAgendamento}-${reserva.horaInicio}-${reserva.salaId?.id ?? ''}`;
  }

  rotuloStatus(status: StatusReserva): string {
    return ROTULOS_STATUS[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
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
