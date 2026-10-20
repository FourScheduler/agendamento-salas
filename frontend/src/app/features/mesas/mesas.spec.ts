import { TestBed } from '@angular/core/testing';
import { Mesas } from './mesas';

describe('Mesas', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mesas],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Mesas);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the desk map heading', async () => {
    const fixture = TestBed.createComponent(Mesas);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Mapa de mesas');
    expect(compiled.textContent).toContain('Selecione uma mesa livre para reservar.');
    expect(compiled.textContent).toContain('Mesas livres');
    expect(compiled.textContent).toContain('Coluna estrutural');
  });

  it('should render all 115 desks', async () => {
    const fixture = TestBed.createComponent(Mesas);
    await fixture.whenStable();

    const desks = (fixture.nativeElement as HTMLElement).querySelectorAll('button.desk');
    expect(desks.length).toBe(115);
  });

  it('should start with the state buttons disabled', async () => {
    const fixture = TestBed.createComponent(Mesas);
    await fixture.whenStable();

    const botoes = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.status-button',
    );
    expect(botoes.length).toBe(2);
    expect(botoes[0].disabled).toBe(true);
    expect(botoes[1].disabled).toBe(true);
  });

  it('should select a desk and update the note', async () => {
    const fixture = TestBed.createComponent(Mesas);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const mesa = compiled.querySelector<HTMLButtonElement>('button.desk[data-number="17"]');
    mesa?.click();
    await fixture.whenStable();

    expect(compiled.querySelector('.selection-note')?.textContent).toContain(
      'Mesa 17 selecionada',
    );
    expect(mesa?.getAttribute('aria-pressed')).toBe('true');
    expect(compiled.querySelector<HTMLButtonElement>('.status-button')?.disabled).toBe(false);
  });

  it('should update the selected desk state', async () => {
    const fixture = TestBed.createComponent(Mesas);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const mesa = compiled.querySelector<HTMLButtonElement>('button.desk[data-number="17"]');
    mesa?.click();
    await fixture.whenStable();

    compiled.querySelector<HTMLButtonElement>('.status-button')?.click();
    await fixture.whenStable();

    expect(compiled.querySelector('.message')?.textContent).toContain(
      'Mesa 17 atualizada para livre.',
    );
    expect(mesa?.classList).toContain('desk--free');
  });

  it('should apply the chosen state to every desk', async () => {
    const fixture = TestBed.createComponent(Mesas);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('select#all-state');
    if (select) {
      select.value = 'fixed';
      select.dispatchEvent(new Event('change'));
    }
    await fixture.whenStable();

    compiled.querySelector<HTMLButtonElement>('.apply-all')?.click();
    await fixture.whenStable();

    expect(compiled.querySelector('.message')?.textContent).toContain(
      'Todas as mesas atualizadas para fixa.',
    );
    const fixas = compiled.querySelectorAll('button.desk--fixed');
    expect(fixas.length).toBe(115);
  });
});
