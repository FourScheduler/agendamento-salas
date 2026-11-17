import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ehFimDeSemana } from '../../core/util/formatos';

@Component({
  selector: 'app-calendario-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': 'abrir($event)',
    '(keydown.enter)': 'abrir($event)',
    '(keydown.space)': 'abrir($event)',
    '(keydown.arrowdown)': 'abrir($event)',
    '(input)': 'impedirEntrada($event)',
    '(change)': 'impedirEntrada($event)',
  },
  template: `
    <ng-content />
    <dialog
      #dialogo
      aria-label="Escolher data"
      (click)="fecharSeFora($event)"
      (keydown)="$event.stopPropagation()"
    >
      <header>
        <button
          type="button"
          aria-label="Mês anterior"
          [disabled]="!!minima() && mes() <= minima().slice(0, 7)"
          (click)="mudarMes(-1)"
        >
          ‹
        </button>
        <strong aria-live="polite">{{ tituloMes() }}</strong>
        <button type="button" aria-label="Próximo mês" (click)="mudarMes(1)">
          ›
        </button>
      </header>
      <div class="dias">
        @for (dia of diasDaSemana; track dia) {
          <span aria-hidden="true">{{ dia }}</span>
        }
        @for (dia of dias(); track dia.data) {
          <button
            type="button"
            [disabled]="dia.bloqueado"
            [attr.aria-label]="dia.rotulo"
            [attr.aria-pressed]="dia.data === data() && !dia.bloqueado"
            (click)="selecionar(dia.data)"
          >
            {{ dia.numero }}
          </button>
        }
      </div>
      <button class="fechar" type="button" (click)="dialogo.close()">Fechar</button>
    </dialog>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    dialog {
      position: fixed;
      box-sizing: border-box;
      width: min(296px, calc(100vw - 1rem));
      max-height: calc(100dvh - 1rem);
      overflow: auto;
      margin: 0;
      padding: 0.75rem;
      border: 1px solid var(--gray-150);
      border-radius: 14px;
      background: #ffffff;
      color: var(--gray-800);
      box-shadow: 0 16px 40px rgb(34 34 57 / 24%);
      font-size: 0.8125rem;
    }

    dialog::backdrop {
      background: transparent;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    header strong {
      color: var(--navy);
      font-size: 0.875rem;
      text-transform: capitalize;
    }

    .dias {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 0.25rem;
      text-align: center;
    }

    .dias span {
      padding: 0.375rem 0;
      color: var(--gray-500);
      font-size: 0.75rem;
      font-weight: 700;
    }

    button {
      min-width: 0;
      min-height: 36px;
      border: 1px solid transparent;
      border-radius: 8px;
      background: #ffffff;
      color: var(--gray-800);
      font: inherit;
      cursor: pointer;
    }

    header button {
      width: 36px;
      min-height: 36px;
      border-color: var(--gray-150);
      font-size: 1.25rem;
    }

    .dias button:hover:not(:disabled):not([aria-pressed='true']),
    header button:hover:not(:disabled) {
      border-color: var(--orange-400);
      background: var(--orange-soft);
    }

    button:disabled {
      background: var(--disabled);
      cursor: not-allowed;
      opacity: 0.45;
    }

    button[aria-pressed='true'] {
      border-color: var(--orange);
      background: var(--orange);
      color: #ffffff;
      font-weight: 700;
    }

    button:focus-visible {
      outline: 2px solid var(--orange);
      outline-offset: 1px;
    }

    .fechar {
      display: block;
      min-height: 36px;
      margin: 0.5rem 0 0 auto;
      padding: 0 0.625rem;
      border-color: var(--gray-150);
      font-weight: 700;
    }

    .fechar:hover {
      border-color: var(--orange-400);
      color: var(--orange);
    }
  `,
})
export class CalendarioData {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly data = input.required<string>();
  readonly minima = input('');
  readonly desabilitado = input(false);
  readonly alinharDireita = input(false);
  readonly dataSelecionada = output<string>();
  readonly mes = signal('');

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly diasDaSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  readonly tituloMes = computed(() =>
    this.mes()
      ? new Intl.DateTimeFormat('pt-BR', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(`${this.mes()}-01T12:00:00Z`))
      : '',
  );
  readonly dias = computed(() => {
    if (!this.mes()) {
      return [];
    }

    const primeiroDia = `${this.mes()}-01`;
    const deslocamento = (new Date(`${primeiroDia}T12:00:00Z`).getUTCDay() + 6) % 7;

    return Array.from({ length: 42 }, (_, indice) => {
      const data = adicionarDias(primeiroDia, indice - deslocamento);
      return {
        data,
        numero: Number(data.slice(8)),
        bloqueado:
          this.bloqueado(data) || ehFimDeSemana(data) || data.slice(0, 7) !== this.mes(),
        rotulo: formatarData(data),
      };
    });
  });

  abrir(evento: Event): void {
    if (!(evento.target instanceof Element) || this.desabilitado()) {
      return;
    }

    const alvo =
      evento.target instanceof HTMLInputElement
        ? evento.target
        : this.host.nativeElement.querySelector<HTMLInputElement>('input[type="date"]');
    if (!alvo || alvo.disabled) {
      return;
    }

    evento.preventDefault();
    const atual = this.data();
    const referencia = /^\d{4}-\d{2}-\d{2}$/.test(atual)
      ? atual
      : this.minima() || hojeIso();
    const data = this.minima() && referencia < this.minima() ? this.minima() : referencia;
    this.mes.set(data.slice(0, 7));

    const dialogo = this.dialogo().nativeElement;
    const campo = alvo.getBoundingClientRect();
    const largura = Math.min(296, window.innerWidth - 16);
    const altura = 310;
    const topo =
      campo.bottom + altura + 4 <= window.innerHeight - 8
        ? campo.bottom + 4
        : Math.max(8, campo.top - altura - 4);
    const esquerda = this.alinharDireita() ? campo.right - largura : campo.left;
    dialogo.style.left = `${Math.max(8, Math.min(esquerda, window.innerWidth - largura - 8))}px`;
    dialogo.style.top = `${topo}px`;
    dialogo.showModal();
  }

  fecharSeFora(evento: MouseEvent): void {
    evento.stopPropagation();
    const dialogo = this.dialogo().nativeElement;
    const area = dialogo.getBoundingClientRect();
    if (
      evento.target === dialogo &&
      (evento.clientX < area.left ||
        evento.clientX > area.right ||
        evento.clientY < area.top ||
        evento.clientY > area.bottom)
    ) {
      dialogo.close();
    }
  }

  mudarMes(delta: number): void {
    const data = new Date(`${this.mes()}-01T12:00:00Z`);
    data.setUTCMonth(data.getUTCMonth() + delta);
    this.mes.set(data.toISOString().slice(0, 7));
  }

  selecionar(data: string): void {
    if (this.desabilitado() || this.bloqueado(data) || ehFimDeSemana(data)) {
      return;
    }

    this.dataSelecionada.emit(data);
    this.dialogo().nativeElement.close();
  }

  impedirEntrada(evento: Event): void {
    if (evento.target instanceof HTMLInputElement && evento.target.type === 'date') {
      evento.preventDefault();
      evento.stopPropagation();
      evento.target.value = this.data();
    }
  }

  private bloqueado(data: string): boolean {
    return !!this.minima() && data < this.minima();
  }
}

function adicionarDias(data: string, dias: number): string {
  const dia = new Date(`${data}T12:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() + dias);
  return dia.toISOString().slice(0, 10);
}

function formatarData(data: string): string {
  return data.split('-').reverse().join('/');
}

function hojeIso(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}
