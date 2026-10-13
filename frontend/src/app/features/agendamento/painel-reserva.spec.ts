import { TestBed } from '@angular/core/testing';
import { PainelReserva } from './painel-reserva';
import { resolverEstados } from '../../core/data/mapa-mock';

describe('PainelReserva', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelReserva],
    }).compileComponents();
  });

  function montar(pessoas = 4) {
    const fixture = TestBed.createComponent(PainelReserva);
    fixture.componentRef.setInput('sala', resolverEstados(['Sala 01'])[5]);
    fixture.componentRef.setInput('data', '2026-06-18');
    fixture.componentRef.setInput('horaInicio', '14:00');
    fixture.componentRef.setInput('duracao', 60);
    fixture.componentRef.setInput('pessoas', pessoas);
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

  it('should keep the confirm action disabled', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const botao = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.resumo__confirmar',
    );
    expect(botao?.disabled).toBe(true);
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
