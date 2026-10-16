import { Component, input, output } from '@angular/core';
import { EstadoMesa, Mesa } from './mesas.model';

@Component({
  selector: 'app-celula-mesa',
  templateUrl: './celula-mesa.html',
  styleUrl: './celula-mesa.css',
})
export class CelulaMesa {
  readonly mesa = input.required<Mesa>();
  readonly estado = input.required<EstadoMesa>();
  readonly selecionada = input(false);
  readonly selecionar = output<Mesa>();
}
