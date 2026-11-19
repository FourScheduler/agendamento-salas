import { Component, input, output } from '@angular/core';
import { EstadoSala, SalaPlanta } from '../../core/data/mapa-mock';

const ROTULOS: Record<EstadoSala, string> = {
  disponivel: 'Livre',
  ocupada: 'Ocupada',
  indisponivel: 'Indisponível',
};

@Component({
  selector: 'app-lista-salas',
  templateUrl: './lista-salas.html',
  styleUrl: './lista-salas.css',
})
export class ListaSalas {
  readonly salas = input<SalaPlanta[]>([]);
  readonly selecionada = input<string | null>(null);
  /** Modo administrativo: várias salas escolhidas ao mesmo tempo. */
  readonly multipla = input(false);
  readonly selecionadas = input<string[]>([]);

  /** Clique em qualquer sala, inclusive ocupada: quem recebe decide o que fazer com ele. */
  readonly clique = output<string>();

  /** Sala está escolhida na lista: única ou entre as múltiplas. */
  estaSelecionada(nome: string): boolean {
    return this.multipla() ? this.selecionadas().includes(nome) : this.selecionada() === nome;
  }

  rotulo(estado: EstadoSala): string {
    return ROTULOS[estado];
  }
}
