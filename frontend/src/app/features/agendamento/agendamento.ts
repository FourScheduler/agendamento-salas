import { DestroyRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { BuscaSalasRequest, OrquestradorResposta, SugestaoSala } from '../../core/models/api.models';
import { mensagemDeErro } from '../../core/http/api-error';
import { AuthService } from '../../core/services/auth.service';
import { SalasService } from '../../core/services/salas.service';
import { ReservasService } from '../../core/services/reservas.service';
import { ConversasService } from '../../core/services/conversas.service';
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
import { AssistenteIa, RespostaAssistente } from '../../shared/assistente-ia/assistente-ia';
import { ToastService } from '../../shared/toast/toast';

@Component({
  selector: 'app-agendamento',
  imports: [MapaSalas, PainelReserva, AssistenteIa],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.css',
})
export class Agendamento implements OnInit {
  private readonly salasService = inject(SalasService);
  private readonly reservasService = inject(ReservasService);
  private readonly conversasService = inject(ConversasService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  /** Conversa aberta com o assistente; nula quando não há em andamento. */
  private conversaId: number | null = null;

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
  readonly autenticado = this.auth.autenticado;
  readonly usuario = this.auth.usuario;
  readonly confirmando = signal(false);
  readonly erroConfirmacao = signal<string | null>(null);

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
    this.limparErroConfirmacao();

    if (sala && this.pessoas() > sala.capacidade) {
      this.pessoas.set(sala.capacidade);
      this.buscar();
    }
  }

  atualizarData(valor: string): void {
    this.data.set(valor);
    this.limparErroConfirmacao();
    this.buscar();
  }

  atualizarHora(valor: string): void {
    this.horaInicio.set(valor);
    this.limparErroConfirmacao();
    this.buscar();
  }

  atualizarDuracao(valor: number): void {
    this.duracao.set(valor);
    this.limparErroConfirmacao();
    this.buscar();
  }

  atualizarPessoas(valor: number): void {
    this.pessoas.set(valor);
    this.limparErroConfirmacao();
    this.buscar();
  }

  /**
   * Envia o pedido ao orquestrador do backend (interpretação com IA + busca de salas).
   * Propriedade arrow porque o assistente chama a função sem receptor e, nesse caso,
   * um método comum perde o `this`.
   */
  readonly processarMensagemAssistente = async (
    texto: string,
  ): Promise<RespostaAssistente> => {
    if (!this.auth.autenticado()) {
      return { texto: 'Faça login para usar o assistente de reservas.' };
    }

    try {
      await this.garantirConversa();
      const resposta = await firstValueFrom(
        this.conversasService.enviarMensagem(this.conversaId!, texto),
      );
      this.sincronizarPainel(resposta);
      return this.montarRespostaAssistente(resposta);
    } catch (erro: unknown) {
      return { texto: mensagemDeErro(erro) };
    }
  };

  private async garantirConversa(): Promise<void> {
    if (this.conversaId !== null) {
      return;
    }
    const conversa = await firstValueFrom(this.conversasService.iniciar());
    this.conversaId = conversa.conversaId;
  }

  /** Converte a resposta do orquestrador em texto + ações do painel do assistente. */
  private montarRespostaAssistente(resposta: OrquestradorResposta): RespostaAssistente {
    if (resposta.estado === 'AGUARDANDO_ESCOLHA' && resposta.sugestoes.length > 0) {
      return {
        texto: resposta.mensagem,
        acoes: resposta.sugestoes.map((sugestao) => ({
          rotulo: `${sugestao.nome} · ${sugestao.capacidade} pessoas`,
          sugestao: true,
          aoClicar: () => this.selecionarSalaNoChat(sugestao),
        })),
      };
    }

    if (resposta.estado === 'AGUARDANDO_CONFIRMACAO') {
      return {
        texto: resposta.mensagem,
        acoes: [
          {
            rotulo: 'Confirmar agendamento',
            primaria: true,
            aoClicar: () => this.confirmarNoChat(),
          },
          { rotulo: 'Ajustar', voltarEdicao: true },
        ],
      };
    }

    return { texto: resposta.mensagem };
  }

  /** Escolhe a sala no chat e reflete a escolha no mapa e no painel. */
  private async selecionarSalaNoChat(sugestao: SugestaoSala): Promise<RespostaAssistente> {
    try {
      const resposta = await firstValueFrom(
        this.conversasService.selecionarSala(this.conversaId!, sugestao.salaId),
      );
      this.selecionar(sugestao.nome);
      this.sincronizarPainel(resposta);
      return this.montarRespostaAssistente(resposta);
    } catch (erro: unknown) {
      return { texto: mensagemDeErro(erro) };
    }
  }

  /** Confirma a reserva pela conversa e recarrega o mapa. */
  private async confirmarNoChat(): Promise<RespostaAssistente> {
    try {
      const resposta = await firstValueFrom(
        this.conversasService.confirmar(this.conversaId!),
      );
      // A reserva foi criada; a próxima solicitação começa uma conversa nova.
      this.conversaId = null;
      this.limparErroConfirmacao();
      this.buscar();
      const horaInicio = resposta.horaInicio?.slice(0, 5) ?? this.horaInicio();
      const horaFim = resposta.horaFim?.slice(0, 5) ?? horaFinal(horaInicio, this.duracao());
      this.toast.sucesso(
        mensagemToastReserva(resposta.data ?? this.data(), horaInicio, horaFim),
      );
      return { texto: resposta.mensagem };
    } catch (erro: unknown) {
      return { texto: mensagemDeErro(erro) };
    }
  }

  /** Aplica no painel/mapa o que a IA interpretou (data, horário, pessoas). */
  private sincronizarPainel(resposta: OrquestradorResposta): void {
    let mudou = false;

    if (resposta.data && resposta.data !== this.data()) {
      this.data.set(resposta.data);
      mudou = true;
    }

    if (resposta.horaInicio) {
      const hora = resposta.horaInicio.slice(0, 5);
      if (hora !== this.horaInicio()) {
        this.horaInicio.set(hora);
        mudou = true;
      }

      if (resposta.horaFim) {
        const inicio = paraMinutos(hora) ?? 0;
        const fim = paraMinutos(resposta.horaFim.slice(0, 5)) ?? 0;
        const duracao = fim - inicio;
        if (duracao > 0 && duracao !== this.duracao()) {
          this.duracao.set(duracao);
        }
      }
    }

    if (resposta.qntdPessoas && resposta.qntdPessoas !== this.pessoas()) {
      this.pessoas.set(resposta.qntdPessoas);
      mudou = true;
    }

    if (mudou) {
      this.limparErroConfirmacao();
      this.buscar();
    }
  }

  async confirmarPainel(): Promise<void> {
    await this.confirmarReserva();
  }

  /** Fluxo único de confirmação: painel de resumo e ação Reservar do chat. */
  async confirmarReserva(): Promise<string> {
    if (!this.auth.autenticado()) {
      return 'Faça login para reservar a sala.';
    }

    const sala = this.salaEscolhida();
    if (!sala) {
      return 'Escolha uma sala no mapa para reservar.';
    }

    if (this.confirmando()) {
      return 'Aguarde, estou confirmando a reserva.';
    }

    const horaFim = horaFinal(this.horaInicio(), this.duracao());
    this.confirmando.set(true);
    this.limparErroConfirmacao();

    try {
      const reserva = await firstValueFrom(
        this.reservasService.confirmar({
          salaId: { id: sala.id },
          data: this.data(),
          horaInicio: this.horaInicio(),
          horaFim,
          qntdPessoas: this.pessoas(),
          titulo: `Reunião - ${sala.nome}`,
        }),
      );

      // A sala já foi validada antes da chamada. Ela também é usada como fallback para
      // respostas de versões anteriores da API que não retornem o objeto `sala`.
      const nomeSala = reserva.sala?.nome ?? sala.nome;
      const detalhes =
        reserva.id != null
          ? ` (nº ${reserva.id}${reserva.status ? ` · ${reserva.status}` : ''})`
          : '';
      const texto = `Reserva confirmada para ${nomeSala} em ${this.data()}, das ${this.horaInicio()} às ${horaFim}${detalhes}.`;
      this.toast.sucesso(mensagemToastReserva(this.data(), this.horaInicio(), horaFim));
      this.buscar();
      return texto;
    } catch (erro: unknown) {
      const falha = mensagemDeErro(erro);
      this.erroConfirmacao.set(falha);
      return `Não consegui confirmar a reserva: ${falha}`;
    } finally {
      this.confirmando.set(false);
    }
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
          this.salas.set(resolverEstados(respostas));
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

  private limparErroConfirmacao(): void {
    this.erroConfirmacao.set(null);
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

function mensagemToastReserva(data: string, horaInicio: string, horaFim: string): string {
  const [ano, mes, dia] = data.split('-');
  return `Reserva confirmada das ${horaInicio} às ${horaFim} ${dia}/${mes}/${ano.slice(-2)}`;
}
