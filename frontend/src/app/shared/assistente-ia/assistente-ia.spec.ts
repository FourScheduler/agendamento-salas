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
    expect(raiz.textContent).toContain('Olá! Posso te ajudar a reservar uma sala?');
    expect(raiz.querySelector('input.ai-bubble__input')).toBeTruthy();
    expect(raiz.querySelector('svg[viewBox="0 0 120 140"]')).toBeTruthy();
  });

  it('should keep the send button disabled while the field is empty', () => {
    const { raiz } = iniciar();
    const botao = raiz.querySelector<HTMLButtonElement>('button.ai-bubble__send');

    expect(botao?.disabled).toBe(true);
  });

  it('should enable the send button after typing', () => {
    const { fixture, raiz } = iniciar();
    const campo = raiz.querySelector<HTMLInputElement>('input.ai-bubble__input')!;
    campo.value = 'Sala para 4 pessoas';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const botao = raiz.querySelector<HTMLButtonElement>('button.ai-bubble__send');
    expect(botao?.disabled).toBe(false);
  });

  it('should show the response card with actions after sending', async () => {
    const { fixture, raiz } = iniciar();
    fixture.componentRef.setInput('processarMensagem', async () => ({
      texto: 'Sala Comp 01, amanhã, 14h às 15h',
      acoes: [{ rotulo: 'Reservar', primaria: true, aoClicar: async () => 'Reservado!' }],
    }));

    const campo = raiz.querySelector<HTMLInputElement>('input.ai-bubble__input')!;
    campo.value = 'sala para 4 amanhã às 14h';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.componentInstance.enviar();
    fixture.detectChanges();

    const cartao = raiz.querySelector<HTMLElement>('.ai-card');
    expect(cartao?.hidden).toBe(false);
    expect(cartao?.textContent).toContain('Sala Comp 01, amanhã, 14h às 15h');
    expect(cartao?.querySelector('button.ai-btn--primary')?.textContent).toContain('Reservar');
  });
});
