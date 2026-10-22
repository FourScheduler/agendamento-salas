import { Component, computed, input, output, signal } from '@angular/core';
import { OcupacaoSala } from '../../core/models/api.models';
import { SalaPlanta } from '../../core/data/mapa-mock';
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
  imports: [Carregando, Erro, ListaSalas, Vazio],
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
   * A Arena é reserva de eventos exclusiva do ADMIN: no modo comum ela fica
   * visível como sala restrita e não clicável.
   */
  readonly podeReservarRestritas = input(false);

  readonly selecionar = output<string>();
  /** Clique em sala livre no modo múltiplo: pede para alternar a escolha. */
  readonly alternar = output<string>();
  readonly tentarNovamente = output<void>();

  /** Sala que o selo do cabeçalho deve detalhar; nenhuma antes do primeiro clique. */
  private readonly salaInformada = signal<string | null>(null);

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

  /** Sala restrita (Arena) vista por quem não tem perfil ADMIN. */
  restritaParaUsuario(sala: SalaPlanta): boolean {
    return sala.restrito && !this.podeReservarRestritas();
  }

  /** Capacidade em texto; a Arena é de eventos e não tem limite de pessoas. */
  capacidadeTexto(sala: SalaPlanta): string {
    return sala.capacidade === null ? 'Eventos' : `Até ${sala.capacidade}`;
  }

  /** Selo verde do cabeçalho: genérico sem sala, específico depois de escolher uma. */
  readonly seloDisponibilidade = computed(() => {
    const sala = this.salaDoSelo();
    return sala ? this.dicaDaSala(sala) : `Disponibilidade às ${this.horaInicio()}`;
  });

  /**
   * Sala reserva; sala ocupada só alimenta o selo com o próximo horário livre.
   * Clicar em sala ocupada nunca reserva nada — vale para o mapa e para a lista.
   */
  clicar(nome: string): void {
    const sala = this.salas().find((item) => item.nome === nome);
    this.salaInformada.set(nome);

    if (sala?.estado === 'disponivel') {
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
   * então a sala livre é apenas "Disponível". O selo do cabeçalho continua
   * nomeando a sala em `dicaDaSala`.
   */
  dicaTooltip(sala: SalaPlanta): string {
    if (sala.estado === 'disponivel' && this.atendePessoas(sala)) {
      return 'Disponível';
    }

    return this.dicaDaSala(sala);
  }

  /** Texto da dica do mouse e do selo: capacidade que não atende ou próximo horário livre. */
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

  /**
   * Última sala clicada manda sobre a selecionada: é a que o usuário acabou de ver,
   * inclusive quando clicou numa ocupada só para saber a próxima folga.
   */
  private salaDoSelo(): SalaPlanta | null {
    const nome = this.salaInformada() ?? this.selecionadas()[0] ?? this.selecionada();
    if (!nome) {
      return null;
    }

    return this.salas().find((sala) => sala.nome === nome) ?? null;
  }

  /** Arena (sem capacidade) atende qualquer quantidade; senão, compara com a sala. */
  private atendePessoas(sala: SalaPlanta): boolean {
    return sala.capacidade === null || sala.capacidade >= this.pessoas();
  }
}
