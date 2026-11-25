import { Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { OcupacaoSala } from '../../core/models/api.models';
import { SalaPlanta, ehCabine } from '../../core/data/mapa-mock';
import {
  dataExtenso as formatarData,
  diaSemana as formatarDia,
  fimDeJornada,
  paraHora,
  paraMinutos,
} from '../../core/util/formatos';
import { Carregando } from '../../shared/estados/carregando';
import { Erro } from '../../shared/estados/erro';
import { Vazio } from '../../shared/estados/vazio';
import { ListaSalas } from './lista-salas';

@Component({
  selector: 'app-mapa-salas',
  imports: [Carregando, Erro, ListaSalas, NgTemplateOutlet, Vazio],
  templateUrl: './mapa-salas.html',
  styleUrl: './mapa-salas.css',
})
export class MapaSalas {
  readonly salas = input<SalaPlanta[]>([]);
  readonly data = input<string>('');
  readonly horaInicio = input<string>('');
  readonly duracao = input(60);
  readonly pessoas = input(1);
  /** Ocupações do dia buscado; nulas enquanto a resposta não chega. */
  readonly ocupacoes = input<OcupacaoSala[] | null>(null);
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly selecionada = input<string | null>(null);
  /** Modo administrativo: várias salas escolhidas ao mesmo tempo. */
  readonly multipla = input(false);
  readonly selecionadas = input<string[]>([]);
  /**
   * Salas restritas ficam visíveis, mas não clicáveis, no modo comum.
   */
  readonly podeReservarRestritas = input(false);

  readonly selecionar = output<string>();
  /** Clique em sala livre no modo múltiplo: pede para alternar a escolha. */
  readonly alternar = output<string>();
  readonly tentarNovamente = output<void>();

  readonly rotuloDia = computed(() => formatarDia(this.data()));
  readonly rotuloData = computed(() => formatarData(this.data()));
  readonly livres = computed(
    () =>
      this.salas().filter(
        (sala) => sala.estado === 'disponivel' && !this.restritaParaUsuario(sala),
      ).length,
  );

  /** Salas da lista lateral: as restritas aparecem só para quem pode reservá-las. */
  readonly salasLista = computed(() =>
    this.podeReservarRestritas()
      ? this.salas()
      : this.salas().filter((sala) => !sala.restrito),
  );

  /** Salas posicionadas direto na grade da planta. */
  readonly salasGrade = computed(() =>
    this.salas().filter((sala) => !ehCabine(sala) && sala.area !== 'diretoria'),
  );
  readonly salaDiretoria = computed(() => this.salas().find((sala) => sala.area === 'diretoria'));
  /** Cabines ficam numa faixa própria, em ordem visual de 01 a 07. */
  readonly cabines = computed(() => this.salas().filter(ehCabine));

  /** Sala restrita vista por quem não tem perfil ADMIN. */
  restritaParaUsuario(sala: SalaPlanta): boolean {
    return sala.restrito && !this.podeReservarRestritas();
  }

  rotuloSala(sala: SalaPlanta): string {
    if (ehCabine(sala)) {
      return sala.nome.replace(/^Cabine /, 'Cab. ');
    }

    return sala.nome.replace(/^Componivel /, 'Comp. ');
  }

  /** Faixa de pessoas exibida no mapa; a Arena não tem limite de participantes. */
  capacidadeTexto(sala: SalaPlanta): string {
    if (sala.capacidade === null) {
      return 'Eventos';
    }

    return sala.capacidade === 1 ? '1' : `1-${sala.capacidade}`;
  }

  /** Clicar em sala ocupada ou restrita nunca reserva nada. */
  clicar(nome: string): void {
    const sala = this.salas().find((item) => item.nome === nome);

    if (sala?.estado === 'disponivel' && !this.restritaParaUsuario(sala)) {
      if (this.multipla()) {
        this.alternar.emit(nome);
      } else {
        this.selecionar.emit(nome);
      }
    }
  }

  /** Sala está escolhida no mapa: única ou entre as múltiplas. */
  estaSelecionada(nome: string): boolean {
    return this.multipla() ? this.selecionadas().includes(nome) : this.selecionada() === nome;
  }

  /**
   * Texto do tooltip da sala no mapa: o nome já aparece no próprio cartão,
   * então a sala livre é apenas "Disponível".
   */
  dicaTooltip(sala: SalaPlanta): string {
    if (sala.estado === 'disponivel' && this.atendePessoas(sala)) {
      return 'Disponível';
    }

    return this.dicaDaSala(sala);
  }

  /** Texto da dica: capacidade que não atende ou próximo horário livre. */
  dicaDaSala(sala: SalaPlanta): string {
    if (!this.atendePessoas(sala)) {
      return `${sala.nome} · não atende ${this.pessoas()} pessoas (até ${sala.capacidade})`;
    }

    if (sala.estado === 'disponivel') {
      return `${sala.nome} · Disponível`;
    }

    const ocupacoes = this.ocupacoes();
    if (ocupacoes === null) {
      return `${sala.nome} · ocupada neste horário`;
    }

    const proxima = this.proximaLiberacao(sala, ocupacoes);
    if (proxima === null) {
      return `${sala.nome} · sem horário livre hoje`;
    }

    return `${sala.nome} · Disponível às ${proxima}`;
  }

  /** Primeira hora, a partir da busca, em que a sala comporta a duração pedida. */
  private proximaLiberacao(sala: SalaPlanta, ocupacoes: OcupacaoSala[]): string | null {
    const inicioBusca = paraMinutos(this.horaInicio());
    if (inicioBusca === null) {
      return null;
    }

    const janelas = ocupacoes
      .filter((ocupacao) => ocupacao.salaId === sala.id)
      .map((ocupacao) => ({
        inicio: paraMinutos(ocupacao.horaInicio.slice(0, 5)) ?? 0,
        fim: paraMinutos(ocupacao.horaFim.slice(0, 5)) ?? 0,
      }));

    const duracao = this.duracao();
    let livre = inicioBusca;
    let conflito = janelas.find(
      (janela) => janela.fim > livre && janela.inicio < livre + duracao,
    );

    // Cada salto vai para o fim de uma reserva que atrapalha, então o laço sempre avança.
    while (conflito) {
      livre = conflito.fim;
      conflito = janelas.find(
        (janela) => janela.fim > livre && janela.inicio < livre + duracao,
      );
    }

    const candidata = paraHora(livre);
    return fimDeJornada(candidata, duracao) ? null : candidata;
  }

  /** Arena (sem capacidade) atende qualquer quantidade; senão, compara com a sala. */
  private atendePessoas(sala: SalaPlanta): boolean {
    return sala.capacidade === null || sala.capacidade >= this.pessoas();
  }
}
