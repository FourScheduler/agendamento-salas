import { Component, computed, input, output } from '@angular/core';
import { SalaPlanta } from '../../core/data/mapa-mock';
import { dataExtenso as formatarData, diaSemana as formatarDia } from '../../core/util/formatos';
import { Erro } from '../../shared/estados/erro';
import { Vazio } from '../../shared/estados/vazio';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { ListaSalas } from './lista-salas';

@Component({
  selector: 'app-mapa-salas',
  imports: [Erro, ListaSalas, Skeleton, Vazio],
  templateUrl: './mapa-salas.html',
  styleUrl: './mapa-salas.css',
})
export class MapaSalas {
  readonly salas = input<SalaPlanta[]>([]);
  readonly data = input<string>('');
  readonly horaInicio = input<string>('');
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly selecionada = input<string | null>(null);

  readonly selecionar = output<string>();
  readonly tentarNovamente = output<void>();

  readonly rotuloDia = computed(() => formatarDia(this.data()));
  readonly rotuloData = computed(() => formatarData(this.data()));
  readonly livres = computed(
    () => this.salas().filter((sala) => sala.estado === 'disponivel').length,
  );
}
