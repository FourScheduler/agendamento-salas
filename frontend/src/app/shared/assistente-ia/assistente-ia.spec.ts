import { TestBed } from '@angular/core/testing';
import { AssistenteIa } from './assistente-ia';

describe('AssistenteIa', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistenteIa],
    }).compileComponents();
  });

  function iniciar() {
    const fixture = TestBed.createComponent(AssistenteIa);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    return { fixture, raiz };
  }

  it('should create the component', () => {
    const { fixture } = iniciar();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the assistant root with the greeting and the input', () => {
    const { raiz } = iniciar();

    expect(raiz.querySelector('.ai-assistant')?.getAttribute('data-state')).toBe('hidden');
    expect(raiz.textContent).toContain('Posso te ajudar a reservar uma sala?');
    expect(raiz.querySelector('input.ai-panel__input')).toBeTruthy();
    expect(raiz.querySelector('.ai-panel')).toBeTruthy();
    expect(raiz.querySelector('svg[viewBox="0 0 120 140"]')).toBeTruthy();
  });

  it('should keep the send button disabled while the field is empty', () => {
    const { raiz } = iniciar();
    const botao = raiz.querySelector<HTMLButtonElement>('button.ai-panel__send');

    expect(botao?.disabled).toBe(true);
  });

  it('should enable the send button after typing', () => {
    const { fixture, raiz } = iniciar();
    const campo = raiz.querySelector<HTMLInputElement>('input.ai-panel__input')!;
    campo.value = 'Sala para 4 pessoas';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const botao = raiz.querySelector<HTMLButtonElement>('button.ai-panel__send');
    expect(botao?.disabled).toBe(false);
  });

  it('should append the user message and the response with actions to the history', async () => {
    const { fixture, raiz } = iniciar();
    fixture.componentRef.setInput('processarMensagem', async () => ({
      texto: 'Sala Comp 01, amanhã, 14h às 15h',
      acoes: [{ rotulo: 'Reservar', primaria: true, aoClicar: async () => 'Reservado!' }],
    }));

    const campo = raiz.querySelector<HTMLInputElement>('input.ai-panel__input')!;
    campo.value = 'sala para 4 amanhã às 14h';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.componentInstance.enviar();
    fixture.detectChanges();

    const mensagens = raiz.querySelectorAll('.ai-msg');
    expect(mensagens.length).toBe(2);
    expect(mensagens[0].textContent).toContain('sala para 4 amanhã às 14h');
    expect(mensagens[0].classList).toContain('ai-msg--usuario');
    expect(mensagens[1].textContent).toContain('Sala Comp 01, amanhã, 14h às 15h');
    expect(mensagens[1].querySelector('button.ai-btn--primary')?.textContent).toContain('Reservar');
  });

  it('should show actions only on the latest message', async () => {
    const { fixture, raiz } = iniciar();
    fixture.componentRef.setInput('processarMensagem', async (texto: string) =>
      texto === 'primeiro'
        ? { texto: 'Primeira resposta', acoes: [{ rotulo: 'Ação antiga', aoClicar: async () => 'ok' }] }
        : { texto: 'Segunda resposta' },
    );

    const campo = raiz.querySelector<HTMLInputElement>('input.ai-panel__input')!;
    campo.value = 'primeiro';
    campo.dispatchEvent(new Event('input'));
    await fixture.componentInstance.enviar();
    fixture.detectChanges();

    expect(raiz.querySelectorAll('.ai-msg')[1].querySelector('.ai-actions')).toBeTruthy();

    campo.value = 'segundo';
    campo.dispatchEvent(new Event('input'));
    await fixture.componentInstance.enviar();
    fixture.detectChanges();

    const mensagens = raiz.querySelectorAll('.ai-msg');
    expect(mensagens.length).toBe(4);
    expect(mensagens[1].querySelector('.ai-actions')).toBeNull();
    expect(mensagens[3].querySelector('.ai-actions')).toBeNull();
    expect(mensagens[3].textContent).toContain('Segunda resposta');
  });

  it('should open the side panel with the controls and the backdrop in the chat state', () => {
    const { fixture, raiz } = iniciar();
    fixture.componentInstance.estado.set('chat');
    fixture.detectChanges();

    expect(raiz.querySelector('.ai-panel')?.classList).toContain('ai-panel--aberto');
    expect(raiz.querySelector('.ai-panel__controles')).toBeTruthy();
    const backdrop = raiz.querySelector<HTMLElement>('.ai-backdrop');
    expect(backdrop?.classList.contains('ai-backdrop--ativo')).toBe(true);
  });

  it('should minimize when the backdrop is clicked and restore from the mascot', () => {
    const { fixture, raiz } = iniciar();
    const comp = fixture.componentInstance;
    comp.estado.set('chat');
    fixture.detectChanges();

    const backdrop = raiz.querySelector<HTMLElement>('.ai-backdrop')!;
    backdrop.click();
    fixture.detectChanges();

    expect(raiz.querySelector('.ai-assistant')?.getAttribute('data-minimized')).toBe('true');
    expect(raiz.querySelector('.ai-panel')?.classList).not.toContain('ai-panel--aberto');
    expect(backdrop.classList.contains('ai-backdrop--ativo')).toBe(false);

    comp.tocarNoMascote();
    fixture.detectChanges();

    expect(raiz.querySelector('.ai-assistant')?.getAttribute('data-minimized')).toBeNull();
    expect(raiz.querySelector('.ai-panel')?.classList).toContain('ai-panel--aberto');
  });

  it('should clear the typed text when the chat is closed', () => {
    const { fixture, raiz } = iniciar();
    const comp = fixture.componentInstance;
    comp.estado.set('chat');
    fixture.detectChanges();

    const campo = raiz.querySelector<HTMLInputElement>('input.ai-panel__input')!;
    campo.value = 'Sala para 4';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const fechar = raiz.querySelector<HTMLButtonElement>('button.ai-panel__ctl--close')!;
    fechar.click();
    fixture.detectChanges();

    expect(comp.texto()).toBe('');
    expect(raiz.querySelector('.ai-assistant')?.getAttribute('data-minimized')).toBe('true');
  });

  it('should flag an unread reply while minimized and clear it on restore', async () => {
    const { fixture, raiz } = iniciar();
    const comp = fixture.componentInstance;
    comp.estado.set('chat');
    fixture.componentRef.setInput('processarMensagem', async () => 'Reserva feita!');
    fixture.detectChanges();

    // minimiza e uma resposta chega no meio da conversa
    comp.minimizar();
    fixture.detectChanges();

    const campo = raiz.querySelector<HTMLInputElement>('input.ai-panel__input')!;
    campo.value = 'sala amanhã 14h';
    campo.dispatchEvent(new Event('input'));
    await comp.enviar();
    fixture.detectChanges();

    expect(raiz.querySelector('.ai-mascot__badge')).toBeTruthy();

    comp.restaurar();
    fixture.detectChanges();
    expect(raiz.querySelector('.ai-mascot__badge')).toBeNull();
    expect(raiz.querySelector('.ai-panel__msgs')?.textContent).toContain('Reserva feita!');
  });
});
