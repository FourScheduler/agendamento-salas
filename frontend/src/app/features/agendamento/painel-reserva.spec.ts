import { TestBed } from '@angular/core/testing';
import { PainelReserva } from './painel-reserva';
import { resolverEstados } from '../../core/data/mapa-mock';

describe('PainelReserva', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelReserva],
    }).compileComponents();
  });

  function montar(
    pessoas = 4,
    opcoes: { autenticado?: boolean; solicitante?: string } = {},
  ) {
    const fixture = TestBed.createComponent(PainelReserva);
    fixture.componentRef.setInput('sala', resolverEstados([{ id: 1 }])[0]);
    fixture.componentRef.setInput('data', '2026-06-18');
    fixture.componentRef.setInput('horaInicio', '14:00');
    fixture.componentRef.setInput('duracao', 60);
    fixture.componentRef.setInput('pessoas', pessoas);
    fixture.componentRef.setInput('autenticado', opcoes.autenticado ?? false);
    fixture.componentRef.setInput('solicitante', opcoes.solicitante ?? null);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(PainelReserva);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should format the duration options', () => {
    const fixture = TestBed.createComponent(PainelReserva);
    const componente = fixture.componentInstance;

    expect(componente.rotuloDuracao(30)).toBe('30 min');
    expect(componente.rotuloDuracao(60)).toBe('1 hora');
    expect(componente.rotuloDuracao(90)).toBe('1 hora e 30 min');
    expect(componente.rotuloDuracao(120)).toBe('2 horas');
  });

  it('should show the selected room and the final time', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sala 01');
    expect(compiled.textContent).toContain('14:00 - 15:00');
    expect(compiled.textContent).toContain('18 jun, quinta-feira');
  });

  it('should keep the confirm action disabled while unauthenticated', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const botao = compiled.querySelector<HTMLButtonElement>('.resumo__confirmar');
    expect(botao?.disabled).toBe(true);
    expect(compiled.textContent).toContain('Faça login para confirmar a reserva.');
  });

  it('should enable the confirm action and emit when authenticated', async () => {
    const fixture = montar(4, { autenticado: true });
    await fixture.whenStable();

    let confirmado = false;
    fixture.componentInstance.confirmar.subscribe(() => (confirmado = true));

    const botao = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.resumo__confirmar',
    );
    expect(botao?.disabled).toBe(false);

    botao?.click();

    expect(confirmado).toBe(true);
  });

  it('should not render a success message in the summary', async () => {
    const fixture = montar(4, { autenticado: true });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.resumo__sucesso')).toBeNull();
    expect(compiled.querySelector('.resumo__nota')?.textContent).toContain(
      'nada é enviado ao Outlook',
    );
  });

  it('should show the requester of the reservation', async () => {
    const fixture = montar(4, { autenticado: true, solicitante: 'Usuario Teste Um' });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Solicitante');
    expect(compiled.textContent).toContain('Usuario Teste Um');
  });

  it('should hide the requester row when there is no session', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Solicitante');
  });

  it('should emit the new number of people', async () => {
    const fixture = montar(2);
    await fixture.whenStable();

    let quantidade = 0;
    fixture.componentInstance.pessoasAlterada.subscribe((valor) => (quantidade = valor));

    const botoes = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.stepper',
    );
    botoes[1].click();

    expect(quantidade).toBe(3);
  });

  it('should block the stepper at the room capacity', async () => {
    const fixture = montar(4);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const botoes = compiled.querySelectorAll<HTMLButtonElement>('.stepper');

    expect(botoes[1].disabled).toBe(true);
    expect(compiled.textContent).toContain('Esta sala comporta até 4 pessoas.');
  });

  it('should emit the equipment request flag', async () => {
    const fixture = montar();
    await fixture.whenStable();

    let marcado = false;
    fixture.componentInstance.equipamentosAlterada.subscribe((valor) => (marcado = valor));

    const compiled = fixture.nativeElement as HTMLElement;
    const caixa = compiled.querySelector<HTMLInputElement>('#resumo-equipamentos');
    expect(caixa).toBeTruthy();
    expect(compiled.textContent).toContain('Solicite o equipamento previamente à equipe');

    caixa?.click();

    expect(marcado).toBe(true);
  });
});
