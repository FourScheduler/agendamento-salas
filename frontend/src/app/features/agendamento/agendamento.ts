import { DestroyRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BuscaSalasRequest } from '../../core/models/api.models';
import { mensagemDeErro } from '../../core/http/api-error';
import { SalasService } from '../../core/services/salas.service';
import { SalaPlanta, resolverEstados } from '../../core/data/mapa-mock';
import {
  fimDeJornada,
  hojeIso,
  normalizarNome,
  paraHora,
  paraMinutos,
  proximaHoraCheia,
} from '../../core/util/formatos';
import { MapaSalas } from './mapa-salas';
import { PainelReserva } from './painel-reserva';

@Component({
  selector: 'app-agendamento',
  imports: [MapaSalas, PainelReserva],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.css',
})
export class Agendamento implements OnInit {
  private readonly salasService = inject(SalasService);
  private readonly destroyRef = inject(DestroyRef);

  readonly duracoes = [30, 60, 90, 120];
  readonly hoje = hojeIso();

  readonly data = signal(this.hoje);
  readonly horaInicio = signal(proximaHoraCheia());
  readonly duracao = signal(60);
  readonly pessoas = signal(1);
  readonly equipamentos = signal(false);

  readonly salas = signal<SalaPlanta[]>([]);
  readonly selecionada = signal<string | null>(null);
  readonly carregando = signal(false);
  readonly erroApi = signal<string | null>(null);
  readonly erroValidacao = signal<string | null>(null);

  readonly salaEscolhida = computed(() => {
    const nome = this.selecionada();
    if (!nome) {
      return null;
    }

    return this.salas().find((sala) => sala.nome === nome) ?? null;
  });

  ngOnInit(): void {
    this.buscar();
  }

  selecionar(nome: string): void {
    const sala = this.salas().find((item) => item.nome === nome);
    this.selecionada.set(nome);

    if (sala && this.pessoas() > sala.capacidade) {
      this.pessoas.set(sala.capacidade);
      this.buscar();
    }
  }

  atualizarData(valor: string): void {
    this.data.set(valor);
    this.buscar();
  }

  atualizarHora(valor: string): void {
    this.horaInicio.set(valor);
    this.buscar();
  }

  atualizarDuracao(valor: number): void {
    this.duracao.set(valor);
    this.buscar();
  }

  atualizarPessoas(valor: number): void {
    this.pessoas.set(valor);
    this.buscar();
  }

  buscar(): void {
    const falha = this.validar();
    if (falha) {
      this.erroValidacao.set(falha);
      return;
    }

    const requisicao: BuscaSalasRequest = {
      data: this.data(),
      horaInicio: this.horaInicio(),
      horaFim: horaFinal(this.horaInicio(), this.duracao()),
      qntdPessoas: this.pessoas(),
    };

    this.erroValidacao.set(null);
    this.erroApi.set(null);
    this.carregando.set(true);

    this.salasService
      .buscarDisponiveis(requisicao)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respostas) => {
          const livres = respostas.map((sala) => sala.nome);
          this.atualizarSelecao(livres);
          this.salas.set(resolverEstados(livres));
          this.carregando.set(false);
        },
        error: (erro: unknown) => {
          this.salas.set([]);
          this.selecionada.set(null);
          this.carregando.set(false);
          this.erroApi.set(mensagemDeErro(erro));
        },
      });
  }

  private atualizarSelecao(livres: string[]): void {
    const atual = this.selecionada();
    if (!atual) {
      return;
    }

    const continua = livres.some((nome) => normalizarNome(nome) === normalizarNome(atual));
    if (!continua) {
      this.selecionada.set(null);
    }
  }

  private validar(): string | null {
    if (!this.data()) {
      return 'Informe a data da reserva.';
    }

    if (this.data() < this.hoje) {
      return 'A data não pode estar no passado.';
    }

    if (paraMinutos(this.horaInicio()) === null) {
      return 'Informe o horário inicial da reserva.';
    }

    if (fimDeJornada(this.horaInicio(), this.duracao())) {
      return 'O horário final precisa ficar dentro do mesmo dia.';
    }

    if (!Number.isInteger(this.pessoas()) || this.pessoas() < 1) {
      return 'A quantidade de pessoas deve ser ao menos 1.';
    }

    return null;
  }
}

function horaFinal(inicio: string, duracao: number): string {
  return paraHora((paraMinutos(inicio) ?? 0) + duracao);
}
