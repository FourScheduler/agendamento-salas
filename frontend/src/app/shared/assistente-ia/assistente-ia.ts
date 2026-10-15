import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

export interface AcaoAssistente {
  rotulo: string;
  primaria?: boolean;
  /** Renderiza como cartão de sala (sugestões do orquestrador). */
  sugestao?: boolean;
  /** Devolve o texto enviado de volta ao campo para edição. */
  voltarEdicao?: boolean;
  aoClicar?: () => ResultadoEnvio | Promise<ResultadoEnvio>;
}

export interface RespostaAssistente {
  texto?: string;
  acoes?: AcaoAssistente[];
}

/** Uma bolha do histórico exibido no painel lateral. */
export interface MensagemAssistente {
  id: number;
  de: 'usuario' | 'assistente';
  texto?: string;
  acoes?: AcaoAssistente[];
  carregando?: boolean;
  /** Exemplos clicáveis no primeiro balão de ajuda. */
  exemplos?: readonly string[];
}

export type ResultadoEnvio = string | RespostaAssistente | void;

export type ProcessarMensagem = (texto: string) => ResultadoEnvio | Promise<ResultadoEnvio>;

const TEXTOS = {
  saudacao: 'Olá! Posso te ajudar a reservar uma sala?',
  placeholder: 'Ex: Quero uma sala para 4 pessoas amanhã das 14h às 15h',
  placeholderCurto: 'Ex.: Sala para 4 amanhã às 14h as 15h',
  ajuda: 'É só escrever do seu jeito que eu entendo. Por exemplo:',
  exemplos: [
    'Quero uma sala para 4 pessoas amanhã das 14h às 15h',
    'Sala para o dia 19/10/2026 para cinco pessoas das 11h as 12h', // Não será possível com o integra
    'Quero agendar uma sala',
  ],
  pensando: 'Entendendo o seu pedido…',
  erro: 'Não consegui processar agora. Pode tentar de novo?',
} as const;

const TIMELINE = {
  startDelay: 600,
  popDuration: 800,
  waveDelay: 140,
  armRaiseDuration: 420,
  waveCount: 3,
  waveSwingDuration: 480,
  armLowerDuration: 450,
  armRaisedAngle: 90,
  armSwingAngle: 20,
  bodySwayAngle: 2.2,
  blinkAt: 0.55,
  blinkDuration: 200,
  bubbleDuration: 520,
  holdBeforeChat: 3200,
  morphDuration: 720,
  breatheDuration: 3400,
  breatheDistance: 6,
  helpDelay: 450,
  jumpDuration: 560,
  jumpHeight: 16,
  thinkingDelay: 350,
  happyDuration: 1400,
  blinkEveryMin: 2200,
  blinkEveryRange: 3600,
  glanceEveryMin: 5000,
  glanceEveryRange: 5000,
  idleArmAngle: 3.5,
  followPointer: true,
  fadeDuration: 320,
} as const;

const EASE = {
  pop: 'cubic-bezier(.34, 1.56, .64, 1)',
  bubble: 'cubic-bezier(.34, 1.35, .64, 1)',
  swing: 'cubic-bezier(.45, 0, .55, 1)',
  soft: 'cubic-bezier(.4, 0, .2, 1)',
  morph: 'cubic-bezier(.55, 0, .2, 1)',
  breathe: 'ease-in-out',
} as const;

type EstadoAssistente = 'hidden' | 'intro' | 'greeting' | 'chat';
type HumorAssistente = 'happy' | 'think';

class Cancelado extends Error {}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mediaSegura(consulta: string): MediaQueryList {
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(consulta);
  }
  return {
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}

function parte<T extends Element>(raiz: Element, nome: string): T {
  const alvo = raiz.querySelector<T>(`[data-part="${nome}"]`);
  if (!alvo) {
    throw new Error(`Parte do assistente não encontrada: ${nome}`);
  }
  return alvo;
}

@Component({
  selector: 'app-assistente-ia',
  templateUrl: './assistente-ia.html',
})
export class AssistenteIa implements AfterViewInit, OnDestroy {
  /** Ponto de ligação com a página: recebe o texto e devolve a resposta (ou nada). */
  readonly processarMensagem = input<ProcessarMensagem | undefined>(undefined);

  readonly textos = TEXTOS;
  readonly estado = signal<EstadoAssistente>('hidden');
  readonly humor = signal<HumorAssistente | null>(null);
  readonly olhar = signal<'campo' | null>(null);
  readonly historico = signal<MensagemAssistente[]>([]);
  readonly ocupado = signal(false);
  readonly texto = signal('');
  readonly placeholder = signal<string>(TEXTOS.placeholder);
  readonly prontoParaEnviar = computed(() => this.texto().trim().length > 0);
  readonly minimizado = signal(false);
  /** Houve resposta nova enquanto o chat estava minimizado (mostra o ponto no mascote). */
  readonly naoLido = signal(false);
  /** Chat aberto e visível (estado de conversa, sem estar minimizado). */
  readonly chatAberto = computed(() => this.estado() === 'chat' && !this.minimizado());

  private readonly raiz = viewChild.required<ElementRef<HTMLDivElement>>('raiz');
  private readonly painel = viewChild.required<ElementRef<HTMLElement>>('painel');
  private readonly lista = viewChild.required<ElementRef<HTMLDivElement>>('lista');
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  private readonly animacoesDisponiveis = typeof Element.prototype.animate === 'function';
  private readonly telaEstreita = mediaSegura('(max-width: 600px)');
  private readonly reduzirMovimento = mediaSegura('(prefers-reduced-motion: reduce)');

  private host!: HTMLElement;
  private mascot!: Element;
  private jump!: Element;
  private floater!: Element;
  private shadow!: Element;
  private sway!: Element;
  private arm!: Element;
  private arm2!: Element;
  private blink!: Element;
  private thrust!: Element;
  private bubbleEl!: Element;
  private sparkles: Element[] = [];
  private pulses: Element[] = [];

  private atualRun = 0;
  private humorTimer = 0;
  private pensamentoTimer = 0;
  private proximoId = 0;
  private pensandoId: number | null = null;
  private ocupacaoEnvio = false;
  private ultimoTexto = '';
  private ultimoPonteiroEm = 0;
  private coordenadasPonteiro: [number, number] | null = null;
  private quadroPonteiro = 0;
  private apontarPara: { x: number; y: number } | null = null;
  private olharLateral: { x: number; y: number } | null = null;
  private idleLigado = false;
  private idleTimers: ReturnType<typeof setTimeout>[] = [];

  ngAfterViewInit(): void {
    this.host = this.raiz().nativeElement;
    this.mascot = parte(this.host, 'mascot');
    this.jump = parte(this.host, 'jump');
    this.floater = parte(this.host, 'float');
    this.shadow = parte(this.host, 'shadow');
    this.sway = parte(this.host, 'sway');
    this.arm = parte(this.host, 'arm');
    this.arm2 = parte(this.host, 'arm2');
    this.blink = parte(this.host, 'blink');
    this.thrust = parte(this.host, 'thrust');
    this.bubbleEl = parte(this.host, 'bubble');
    this.sparkles = [...this.host.querySelectorAll('[data-part="sparkle"]')];
    this.pulses = [...this.host.querySelectorAll('.m-pulse')];

    this.aplicarPlaceholder();
    this.telaEstreita.addEventListener('change', this.aplicarPlaceholder);
    window.addEventListener('pointermove', this.aoMoverPonteiro, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.aoSairDoDocumento);

    void this.executarTimeline();
  }

  ngOnDestroy(): void {
    this.atualRun++;
    this.pararVida();
    clearTimeout(this.humorTimer);
    clearTimeout(this.pensamentoTimer);
    this.telaEstreita.removeEventListener('change', this.aplicarPlaceholder);
    window.removeEventListener('pointermove', this.aoMoverPonteiro);
    document.documentElement.removeEventListener('pointerleave', this.aoSairDoDocumento);
    if (this.quadroPonteiro) {
      cancelAnimationFrame(this.quadroPonteiro);
    }
    if (this.host && typeof this.host.getAnimations === 'function') {
      this.host.getAnimations({ subtree: true }).forEach((animacao) => animacao.cancel());
    }
  }

  aoDigitar(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
      evento.preventDefault();
      void this.enviar();
    }
  }

  async enviar(): Promise<void> {
    const texto = this.texto().trim();
    if (!texto || this.ocupacaoEnvio) {
      return;
    }
    this.ocupacaoEnvio = true;
    this.ultimoTexto = texto;
    this.texto.set('');
    this.pular();
    this.campo().nativeElement.focus();
    this.adicionarMensagem({ de: 'usuario', texto });
    this.definirHumor('think');
    this.pensamentoTimer = window.setTimeout(() => this.mostrarPensando(), TIMELINE.thinkingDelay);
    try {
      const processar = this.processarMensagem();
      const resultado: ResultadoEnvio = processar ? await processar(texto) : undefined;
      clearTimeout(this.pensamentoTimer);
      this.definirHumor(null);
      this.apresentar(resultado);
      this.reagir();
    } catch (erro) {
      clearTimeout(this.pensamentoTimer);
      this.definirHumor(null);
      console.error('[AssistenteIa] processarMensagem falhou:', erro);
      this.texto.set(texto);
      this.apresentar({ texto: TEXTOS.erro });
    } finally {
      this.ocupacaoEnvio = false;
    }
  }

  editar(texto: string): void {
    this.texto.set(texto);
    this.campo().nativeElement.focus();
  }

  /** Recolhe o painel para o mascote. A página volta ao normal. */
  minimizar(): void {
    if (!this.chatAberto()) {
      return;
    }
    this.minimizado.set(true);
    this.olhar.set(null);
    this.apontarPara = null;
    this.atualizarOlhar();
    if (this.host?.contains(document.activeElement)) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  }

  /** Volta do mascote para o painel e devolve o foco ao campo. */
  restaurar(): void {
    if (!this.minimizado()) {
      return;
    }
    this.minimizado.set(false);
    this.naoLido.set(false);
    this.campo().nativeElement.focus();
    this.rolarAoFim();
  }

  /** Fecha o painel: some com a conversa e limpa o que foi digitado. */
  fecharChat(): void {
    if (!this.chatAberto()) {
      return;
    }
    this.texto.set('');
    this.minimizar();
  }

  /** Esc: fecha o painel se estiver aberto. */
  aoTeclarEscape(): void {
    if (this.chatAberto()) {
      this.minimizar();
    }
  }

  /** Ações só ficam clicáveis na última mensagem (evita repetir ações antigas). */
  acoesAtivas(mensagem: MensagemAssistente): boolean {
    const historico = this.historico();
    return (
      historico.length > 0 &&
      historico[historico.length - 1].id === mensagem.id &&
      !!mensagem.acoes?.length
    );
  }

  temSugestao(mensagem: MensagemAssistente): boolean {
    return !!mensagem.acoes?.some((acao) => acao.sugestao);
  }

  async executarAcao(acao: AcaoAssistente): Promise<void> {
    if (this.ocupacaoEnvio) {
      return;
    }
    this.ocupado.set(true);
    try {
      if (acao.voltarEdicao) {
        this.editar(this.ultimoTexto);
        return;
      }
      const proximo = await acao.aoClicar?.();
      if (proximo) {
        this.apresentar(proximo);
        this.reagir();
      } else {
        this.semAcoes();
      }
    } catch (erro) {
      console.error('[AssistenteIa] ação falhou:', erro);
      this.apresentar({ texto: TEXTOS.erro });
    } finally {
      this.ocupado.set(false);
    }
  }

  focarNoCampo(): void {
    this.olhar.set('campo');
    this.atualizarOlhar();
  }

  sairDoCampo(evento: FocusEvent): void {
    if (!this.painel().nativeElement.contains(evento.relatedTarget as Node | null)) {
      this.olhar.set(null);
      this.atualizarOlhar();
    }
  }

  tocarNoMascote(): void {
    const estado = this.estado();
    if (estado === 'hidden' || estado === 'intro') {
      return;
    }
    this.risadinha();
    this.reagir();
    if (estado === 'chat') {
      if (this.minimizado()) {
        this.restaurar();
      } else {
        this.campo().nativeElement.focus();
      }
    }
  }

  private apresentar(resultado: ResultadoEnvio): void {
    const resumo: RespostaAssistente | null =
      resultado == null ? null : typeof resultado === 'string' ? { texto: resultado } : resultado;
    if (this.minimizado()) {
      this.naoLido.set(true);
    }
    if (!resumo || (!resumo.texto && !resumo.acoes?.length)) {
      this.removerPensando();
      return;
    }
    const resposta: Omit<MensagemAssistente, 'id'> = {
      de: 'assistente',
      texto: resumo.texto,
      acoes: resumo.acoes,
    };
    const pensando = this.pensandoId;
    this.pensandoId = null;
    if (pensando !== null) {
      this.historico.update((lista) =>
        lista.map((mensagem) => (mensagem.id === pensando ? { ...resposta, id: pensando } : mensagem)),
      );
      this.rolarAoFim();
    } else {
      this.adicionarMensagem(resposta);
    }
  }

  private mostrarAjuda(): void {
    this.adicionarMensagem({ de: 'assistente', texto: TEXTOS.ajuda, exemplos: TEXTOS.exemplos });
  }

  private mostrarPensando(): void {
    if (this.pensandoId !== null) {
      return;
    }
    this.pensandoId = this.adicionarMensagem({ de: 'assistente', carregando: true });
  }

  private removerPensando(): void {
    if (this.pensandoId === null) {
      return;
    }
    const id = this.pensandoId;
    this.pensandoId = null;
    this.historico.update((lista) => lista.filter((mensagem) => mensagem.id !== id));
  }

  private adicionarMensagem(mensagem: Omit<MensagemAssistente, 'id'>): number {
    const id = ++this.proximoId;
    this.historico.update((lista) => [...lista, { ...mensagem, id }]);
    this.rolarAoFim();
    return id;
  }

  /** Remove as ações da última mensagem (resposta sem continuação). */
  private semAcoes(): void {
    this.historico.update((lista) =>
      lista.map((mensagem, indice) =>
        indice === lista.length - 1 ? { ...mensagem, acoes: undefined } : mensagem,
      ),
    );
  }

  private rolarAoFim(): void {
    window.setTimeout(() => {
      const lista = this.lista?.()?.nativeElement;
      if (lista) {
        lista.scrollTop = lista.scrollHeight;
      }
    });
  }

  private definirHumor(novo: HumorAssistente | null, ms?: number): void {
    clearTimeout(this.humorTimer);
    this.humor.set(novo);
    this.atualizarOlhar();
    if (novo && ms) {
      this.humorTimer = window.setTimeout(() => {
        if (this.humor() === novo) {
          this.definirHumor(null);
        }
      }, ms);
    }
  }

  private atualizarOlhar(): void {
    if (!this.host) {
      return;
    }
    let valor = { x: 0, y: 0 };
    if (this.olhar() === 'campo') {
      valor = { x: -2.6, y: 0.8 };
    } else if (this.humor() === 'think') {
      valor = { x: 2.6, y: -3 };
    } else if (this.olharLateral) {
      valor = this.olharLateral;
    } else if (this.apontarPara) {
      valor = this.apontarPara;
    }
    this.host.style.setProperty('--look-x', `${valor.x.toFixed(2)}px`);
    this.host.style.setProperty('--look-y', `${valor.y.toFixed(2)}px`);
  }

  private aoMoverPonteiro = (evento: PointerEvent): void => {
    if (
      !TIMELINE.followPointer ||
      evento.pointerType !== 'mouse' ||
      this.reduzirMovimento.matches ||
      !this.mascot
    ) {
      return;
    }
    const estado = this.estado();
    if (estado === 'hidden' || estado === 'intro') {
      return;
    }
    this.ultimoPonteiroEm = Date.now();
    this.coordenadasPonteiro = [evento.clientX, evento.clientY];
    if (this.quadroPonteiro) {
      return;
    }
    this.quadroPonteiro = requestAnimationFrame(() => {
      this.quadroPonteiro = 0;
      if (!this.coordenadasPonteiro) {
        return;
      }
      const retangulo = this.mascot.getBoundingClientRect();
      const dx = this.coordenadasPonteiro[0] - (retangulo.left + retangulo.width / 2);
      const dy = this.coordenadasPonteiro[1] - (retangulo.top + retangulo.height * 0.36);
      const distancia = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, distancia / 260);
      this.apontarPara = { x: (dx / distancia) * k * 3.6, y: (dy / distancia) * k * 2.6 };
      this.atualizarOlhar();
    });
  };

  private aoSairDoDocumento = (): void => {
    this.apontarPara = null;
    this.atualizarOlhar();
  };

  private aplicarPlaceholder = (): void => {
    this.placeholder.set(this.telaEstreita.matches ? TEXTOS.placeholderCurto : TEXTOS.placeholder);
  };

  private reagir(): void {
    this.definirHumor('happy', TIMELINE.happyDuration);
    this.brilhar();
  }

  private brilhar(): void {
    if (this.reduzirMovimento.matches || !this.animacoesDisponiveis) {
      return;
    }
    this.sparkles.forEach((brilho, indice) => brilharAnimacao(brilho, indice));
  }

  private get semMovimento(): boolean {
    return this.reduzirMovimento.matches || !this.animacoesDisponiveis;
  }

  private iniciarVida(): void {
    this.idleLigado = true;
    const angulo = TIMELINE.idleArmAngle;
    this.arm.animate(
      [{ transform: `rotate(${-angulo}deg)` }, { transform: `rotate(${angulo}deg)` }],
      {
        duration: 3100,
        direction: 'alternate',
        iterations: Infinity,
        easing: EASE.swing,
        composite: 'add',
      },
    );
    this.arm2.animate(
      [{ transform: `rotate(${angulo}deg)` }, { transform: `rotate(${-angulo}deg)` }],
      {
        duration: 3700,
        direction: 'alternate',
        iterations: Infinity,
        easing: EASE.swing,
        composite: 'add',
      },
    );
    this.thrust.animate(
      [
        { transform: 'scale(1, 1)', opacity: 0.9 },
        { transform: 'scale(.9, 1.2)', opacity: 1 },
      ],
      { duration: 420, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' },
    );
    this.pulses.forEach((pulso, indice) =>
      pulso.animate([{ opacity: 0.7 }, { opacity: 1 }], {
        duration: 1800 + indice * 370,
        direction: 'alternate',
        iterations: Infinity,
        easing: 'ease-in-out',
      }),
    );
    this.agendarPiscar();
    this.agendarOlharLateral();
  }

  private pararVida(): void {
    this.idleLigado = false;
    this.idleTimers.forEach(clearTimeout);
    this.idleTimers = [];
  }

  private agendarDepois(funcao: () => void, ms: number): void {
    this.idleTimers.push(setTimeout(funcao, ms));
  }

  private piscar(): void {
    this.blink.animate(
      [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)' }, { transform: 'scaleY(1)' }],
      { duration: 170, easing: 'ease-in-out' },
    );
  }

  private agendarPiscar(): void {
    this.agendarDepois(
      () => {
        if (!this.idleLigado) {
          return;
        }
        this.piscar();
        if (Math.random() < 0.28) {
          this.agendarDepois(() => this.piscar(), 240);
        }
        this.agendarPiscar();
      },
      TIMELINE.blinkEveryMin + Math.random() * TIMELINE.blinkEveryRange,
    );
  }

  private agendarOlharLateral(): void {
    this.agendarDepois(
      () => {
        if (!this.idleLigado) {
          return;
        }
        const quieto = !this.olhar() && !this.humor() && Date.now() - this.ultimoPonteiroEm > 2500;
        if (quieto) {
          this.olharLateral = { x: sorteio(-3.2, 3.2), y: sorteio(-1.4, 1) };
          this.atualizarOlhar();
          this.agendarDepois(
            () => {
              this.olharLateral = null;
              this.atualizarOlhar();
            },
            sorteio(900, 1500),
          );
        }
        this.agendarOlharLateral();
      },
      TIMELINE.glanceEveryMin + Math.random() * TIMELINE.glanceEveryRange,
    );
  }

  private iniciarRespiracao(): void {
    const distancia = TIMELINE.breatheDistance;
    const laco = { duration: TIMELINE.breatheDuration, iterations: Infinity };
    const suave = { easing: EASE.breathe };
    this.floater.animate(
      [
        { transform: 'translateY(0)', ...suave },
        { transform: `translateY(${-distancia}px)`, ...suave },
        { transform: 'translateY(0)' },
      ],
      laco,
    );
    this.shadow.animate(
      [
        { transform: 'scaleX(1)', opacity: 1, ...suave },
        { transform: 'scaleX(.84)', opacity: 0.55, ...suave },
        { transform: 'scaleX(1)', opacity: 1 },
      ],
      laco,
    );
  }

  private pular(): void {
    if (this.semMovimento) {
      return;
    }
    const altura = TIMELINE.jumpHeight;
    const duracao = TIMELINE.jumpDuration;
    this.jump.animate(
      [
        { transform: 'translateY(0) scale(1, 1)', easing: 'ease-out' },
        {
          transform: 'translateY(0) scale(1.07, .92)',
          offset: 0.16,
          easing: 'cubic-bezier(.2, .7, .3, 1)',
        },
        {
          transform: `translateY(${-altura}px) scale(.96, 1.06)`,
          offset: 0.5,
          easing: 'cubic-bezier(.7, 0, .8, .3)',
        },
        { transform: 'translateY(0) scale(1.1, .88)', offset: 0.82, easing: 'ease-out' },
        { transform: 'translateY(0) scale(1, 1)' },
      ],
      { duration: duracao },
    );
    this.shadow.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(.7)', offset: 0.5 },
        { transform: 'scale(1)' },
      ],
      { duration: duracao, composite: 'add' },
    );
  }

  private risadinha(): void {
    if (this.semMovimento) {
      return;
    }
    this.jump.animate(
      [
        { transform: 'rotate(0deg) scale(1, 1)', easing: 'ease-out' },
        { transform: 'rotate(-7deg) scale(1.05, .95)', offset: 0.2, easing: 'ease-in-out' },
        { transform: 'rotate(6deg) scale(.97, 1.04)', offset: 0.45, easing: 'ease-in-out' },
        { transform: 'rotate(-4deg) scale(1.03, .97)', offset: 0.7, easing: 'ease-in-out' },
        { transform: 'rotate(0deg) scale(1, 1)' },
      ],
      { duration: 620 },
    );
  }

  private reiniciar(): void {
    this.pararVida();
    clearTimeout(this.humorTimer);
    if (typeof this.host.getAnimations === 'function') {
      this.host.getAnimations({ subtree: true }).forEach((animacao) => animacao.cancel());
    }
    this.estado.set('hidden');
    this.humor.set(null);
    this.olhar.set(null);
    this.apontarPara = null;
    this.olharLateral = null;
    this.atualizarOlhar();
    this.historico.set([]);
    this.pensandoId = null;
    this.proximoId = 0;
    this.texto.set('');
    this.minimizado.set(false);
    this.naoLido.set(false);
    if (this.host.contains(document.activeElement)) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  }

  private async executarTimeline(): Promise<void> {
    const id = ++this.atualRun;
    const vivo = (): void => {
      if (id !== this.atualRun) {
        throw new Cancelado();
      }
    };
    const ate = async <T>(promessa: Promise<T>): Promise<T> => {
      const resultado = await promessa;
      vivo();
      return resultado;
    };
    const pausa = (ms: number) => ate(esperar(ms));
    const ir = async (
      alvo: Element,
      quadros: Keyframe[],
      opcoes: KeyframeAnimationOptions,
    ): Promise<void> => {
      await alvo.animate(quadros, opcoes).finished;
      vivo();
    };

    try {
      this.reiniciar();
      await pausa(TIMELINE.startDelay);

      if (!this.animacoesDisponiveis) {
        this.estado.set('chat');
        this.mostrarAjuda();
        return;
      }

      if (this.reduzirMovimento.matches) {
        return await this.aparecerComFade({ pausa, ir });
      }

      this.estado.set('intro');
      await ir(
        this.mascot,
        [
          { transform: 'scale(0, 0)', easing: 'cubic-bezier(.2, .8, .3, 1)' },
          { transform: 'scale(1.13, .88)', offset: 0.55, easing: 'ease-in-out' },
          { transform: 'scale(.96, 1.06)', offset: 0.78, easing: 'ease-in-out' },
          { transform: 'scale(1, 1)' },
        ],
        { duration: TIMELINE.popDuration },
      );

      await pausa(TIMELINE.waveDelay);
      const topo = TIMELINE.armRaisedAngle + TIMELINE.armSwingAngle;
      const baixo = TIMELINE.armRaisedAngle - TIMELINE.armSwingAngle;
      await ir(this.arm, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${topo}deg)` }], {
        duration: TIMELINE.armRaiseDuration,
        easing: EASE.pop,
        fill: 'forwards',
      });

      const tempoAceno = TIMELINE.waveCount * TIMELINE.waveSwingDuration;
      const angulosBraco = [topo];
      const angulosCorpo = [0];
      for (let indice = 0; indice < TIMELINE.waveCount; indice++) {
        angulosBraco.push(baixo, topo);
        angulosCorpo.push(TIMELINE.bodySwayAngle, -TIMELINE.bodySwayAngle);
      }
      angulosCorpo.push(0);

      const acenando = this.arm.animate(
        angulosBraco.map((angulo) => ({ transform: `rotate(${angulo}deg)`, easing: EASE.swing })),
        { duration: tempoAceno },
      );
      const balancando = this.sway.animate(
        angulosCorpo.map((angulo) => ({ transform: `rotate(${angulo}deg)`, easing: EASE.swing })),
        { duration: tempoAceno },
      );
      const piscando = this.blink.animate(
        [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)' }, { transform: 'scaleY(1)' }],
        { duration: TIMELINE.blinkDuration, delay: tempoAceno * TIMELINE.blinkAt },
      );
      await ate(Promise.all([acenando.finished, balancando.finished, piscando.finished]));

      this.estado.set('greeting');
      this.reagir();
      const descendo = this.arm.animate(
        [{ transform: `rotate(${topo}deg)` }, { transform: 'rotate(0deg)' }],
        { duration: TIMELINE.armLowerDuration, easing: EASE.soft, fill: 'forwards' },
      );
      const surgindo = this.bubbleEl.animate(
        [
          { opacity: 0, transform: 'scale(.55)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: TIMELINE.bubbleDuration, easing: EASE.bubble, fill: 'backwards' },
      );
      await ate(Promise.all([descendo.finished, surgindo.finished]));

      await pausa(TIMELINE.holdBeforeChat);
      this.iniciarRespiracao();
      this.iniciarVida();

      await ir(
        this.bubbleEl,
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.7)' }],
        { duration: TIMELINE.morphDuration * 0.5, easing: EASE.morph },
      );
      this.estado.set('chat');
      await pausa(TIMELINE.morphDuration * 0.5);

      await pausa(TIMELINE.helpDelay);
      this.mostrarAjuda();
      this.pular();
      this.reagir();
    } catch (erro) {
      if (!(erro instanceof Cancelado) && (erro as Error)?.name !== 'AbortError') {
        throw erro;
      }
    }
  }

  private async aparecerComFade({
    pausa,
    ir,
  }: {
    pausa: (ms: number) => Promise<void>;
    ir: (alvo: Element, quadros: Keyframe[], opcoes: KeyframeAnimationOptions) => Promise<void>;
  }): Promise<void> {
    this.estado.set('intro');
    await ir(this.mascot, [{ opacity: 0 }, { opacity: 1 }], {
      duration: TIMELINE.fadeDuration,
      easing: 'ease-out',
    });

    this.estado.set('greeting');
    await ir(this.bubbleEl, [{ opacity: 0 }, { opacity: 1 }], {
      duration: TIMELINE.fadeDuration,
      easing: 'ease-out',
    });

    await pausa(TIMELINE.holdBeforeChat);
    await ir(this.bubbleEl, [{ opacity: 1 }, { opacity: 0 }], {
      duration: TIMELINE.fadeDuration / 2,
      fill: 'forwards',
    });
    this.estado.set('chat');
    this.mostrarAjuda();
  }
}

function sorteio(minimo: number, maximo: number): number {
  return minimo + Math.random() * (maximo - minimo);
}

function brilharAnimacao(brilho: Element, indice: number): void {
  brilho.animate(
    [
      { opacity: 0, transform: 'translateY(0) scale(0) rotate(0deg)' },
      { opacity: 1, transform: 'translateY(-4px) scale(1) rotate(20deg)', offset: 0.4 },
      { opacity: 0, transform: 'translateY(-11px) scale(.3) rotate(60deg)' },
    ],
    { duration: 900, delay: indice * 140, easing: 'ease-out' },
  );
}
