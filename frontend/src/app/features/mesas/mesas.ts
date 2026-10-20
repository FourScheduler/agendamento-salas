import { Component, computed, signal } from '@angular/core';
import { CelulaMesa } from './celula-mesa';
import {
  CelulaMapa,
  EstadoMesa,
  Mesa,
  MESAS_LIVRES,
  NOMES_MESAS,
  ROTULOS_ESTADO,
} from './mesas.model';

const LINHAS_SUPERIORES: readonly number[][] = [
  [112, 113, 114, 115],
  [111, 110, 109, 108],
  [104, 105, 106, 107],
  [103, 102, 101, 100],
];

const LINHAS_CENTRAIS: readonly number[][] = [
  [98, 99],
  [97, 96],
];

const LINHAS_INFERIORES: readonly number[][] = [
  [93, 94, 95],
  [92, 91, 90, 89],
  [85, 86, 87, 88],
  [84, 83, 82, 81],
  [77, 78, 79, 80],
  [76, 75, 74, 73],
];

function criarMesa(numero: number, cadeira: 'topo' | 'base' | null = null): Mesa {
  const nome = NOMES_MESAS[numero] ?? (MESAS_LIVRES.has(numero) ? 'Livre' : 'Mesa');
  return { numero, nome, cadeira };
}

function criarLinhas(linhas: readonly number[][]): Mesa[] {
  return linhas.flatMap((linha, indiceLinha) =>
    linha.map((numero) => criarMesa(numero, indiceLinha % 2 === 0 ? 'topo' : 'base')),
  );
}

function criarEsquerdas(): CelulaMapa[] {
  const celulas: CelulaMapa[] = [];
  for (let inicioBloco = 0; inicioBloco < 72; inicioBloco += 16) {
    const noBloco = Math.min(16, 72 - inicioBloco);
    for (let par = 0; par < noBloco / 8; par++) {
      const inicioLinha = inicioBloco + 1 + par * 8;
      for (let indice = 0; indice < 4; indice++) {
        const numero = inicioLinha + indice * 2;
        celulas.push({ chave: `${numero}`, mesa: criarMesa(numero, 'topo') });
      }
      for (let indice = 0; indice < 4; indice++) {
        const numero = inicioLinha + indice * 2 + 1;
        celulas.push({ chave: `${numero}`, mesa: criarMesa(numero, 'base') });
      }
    }
    if (inicioBloco + noBloco < 72) {
      celulas.push({ chave: `corredor-${inicioBloco}`, mesa: null });
    }
  }
  return celulas;
}

function criarEstadosIniciais(mesas: readonly Mesa[]): Record<number, EstadoMesa> {
  const estados: Record<number, EstadoMesa> = {};
  for (const mesa of mesas) {
    estados[mesa.numero] = MESAS_LIVRES.has(mesa.numero) ? 'free' : 'fixed';
  }
  return estados;
}

@Component({
  selector: 'app-mesas',
  imports: [CelulaMesa],
  templateUrl: './mesas.html',
  styleUrl: './mesas.css',
})
export class Mesas {
  readonly esquerdas: CelulaMapa[] = criarEsquerdas();
  readonly superiores: Mesa[] = criarLinhas(LINHAS_SUPERIORES);
  readonly centrais: Mesa[] = criarLinhas(LINHAS_CENTRAIS);
  readonly inferiores: Mesa[] = criarLinhas(LINHAS_INFERIORES);

  private readonly todas: Mesa[] = [
    ...this.esquerdas.flatMap((celula) => (celula.mesa ? [celula.mesa] : [])),
    ...this.superiores,
    ...this.centrais,
    ...this.inferiores,
  ];

  readonly selecionada = signal<Mesa | null>(null);
  readonly estados = signal<Record<number, EstadoMesa>>(criarEstadosIniciais(this.todas));
  readonly mensagem = signal('');
  readonly estadoGeral = signal<EstadoMesa>('free');

  readonly notaSelecao = computed(() => {
    const mesa = this.selecionada();
    return mesa
      ? `Mesa ${mesa.numero} selecionada. Escolha um estado para atualizar a cor.`
      : 'Clique em uma mesa para selecioná-la; depois escolha o estado.';
  });

  selecionar(mesa: Mesa): void {
    this.selecionada.set(mesa);
  }

  aplicarEstado(estado: EstadoMesa): void {
    const mesa = this.selecionada();
    if (!mesa) {
      return;
    }
    this.atualizarEstados({ [mesa.numero]: estado });
    this.mensagem.set(`Mesa ${mesa.numero} atualizada para ${ROTULOS_ESTADO[estado].toLowerCase()}.`);
  }

  aplicarATodas(): void {
    const atualizacoes: Record<number, EstadoMesa> = {};
    for (const mesa of this.todas) {
      atualizacoes[mesa.numero] = this.estadoGeral();
    }
    this.atualizarEstados(atualizacoes);
    this.mensagem.set(`Todas as mesas atualizadas para ${ROTULOS_ESTADO[this.estadoGeral()].toLowerCase()}.`);
  }

  definirEstadoGeral(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    if (valor === 'free' || valor === 'fixed') {
      this.estadoGeral.set(valor);
    }
  }

  private atualizarEstados(atualizacoes: Record<number, EstadoMesa>): void {
    this.estados.update((atual) => ({ ...atual, ...atualizacoes }));
  }
}
