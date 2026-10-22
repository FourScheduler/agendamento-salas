import { TestBed } from '@angular/core/testing';
import { resolverEstados } from '../../core/data/mapa-mock';
import { ListaSalas } from './lista-salas';

describe('ListaSalas', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSalas],
    }).compileComponents();
  });

  function montar(disponiveis: Array<{ id: number }>, selecionada: string | null = null) {
    const fixture = TestBed.createComponent(ListaSalas);
    fixture.componentRef.setInput('salas', resolverEstados(disponiveis));
    fixture.componentRef.setInput('selecionada', selecionada);
    fixture.detectChanges();
    return fixture;
  }

  /** Salas que a lista marca como reserváveis (`aria-disabled` só nas ocupadas). */
  function habilitadas(fixture: { nativeElement: HTMLElement }) {
    const lista = fixture.nativeElement as HTMLElement;
    return Array.from(lista.querySelectorAll<HTMLButtonElement>('button')).filter(
      (item) => item.getAttribute('aria-disabled') !== 'true',
    );
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ListaSalas);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render one row per room', () => {
    const fixture = montar([]);
    const lista = (fixture.nativeElement as HTMLElement).querySelectorAll('button');

    // Inclui a Arena (id 9); no fluxo comum ela não chega à lista filtrada pelo mapa.
    expect(lista.length).toBe(9);
  });

  it('should show "Eventos" for a room without capacity', () => {
    const fixture = montar([{ id: 6 }]);
    const arena = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((item) => item.textContent?.includes('Arena'));

    expect(arena?.textContent).toContain('Eventos · sem limite de pessoas');
  });

  it('should allow selecting only the available rooms', () => {
    const fixture = montar([{ id: 6 }]);
    const itens = habilitadas(fixture);

    expect(itens.length).toBe(1);
    expect(itens[0].textContent).toContain('Componivel 02');
  });

  it('should show the state of each room', () => {
    const fixture = montar([{ id: 6 }]);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Livre');
    expect(texto).toContain('Ocupada');
  });

  it('should emit the selected room', () => {
    const fixture = montar([{ id: 6 }]);
    let escolhida = '';

    fixture.componentInstance.clique.subscribe((nome) => (escolhida = nome));

    habilitadas(fixture)[0].click();

    expect(escolhida).toBe('Componivel 02');
  });

  it('should mark the selected room', () => {
    const fixture = montar([{ id: 6 }], 'Componivel 02');
    const marcada = (fixture.nativeElement as HTMLElement).querySelector(
      '.lista__item--selecionada',
    );

    expect(marcada?.textContent).toContain('Componivel 02');
    expect(marcada?.getAttribute('aria-pressed')).toBe('true');
  });
});
