import { TestBed } from '@angular/core/testing';
import { MapaSalas } from './mapa-salas';
import { resolverEstados } from '../../core/data/mapa-mock';

describe('MapaSalas', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaSalas],
    }).compileComponents();
  });

  function montar(disponiveis: Array<{ id: number }>, selecionada: string | null = null) {
    const fixture = TestBed.createComponent(MapaSalas);
    fixture.componentRef.setInput('salas', resolverEstados(disponiveis));
    fixture.componentRef.setInput('data', '2026-06-18');
    fixture.componentRef.setInput('horaInicio', '14:00');
    fixture.componentRef.setInput('selecionada', selecionada);
    fixture.detectChanges();
    return fixture;
  }

  /** Salas que a planta marca como reserváveis (`aria-disabled` só nas ocupadas). */
  function selecionaveis(fixture: { nativeElement: HTMLElement }) {
    const compilado = fixture.nativeElement as HTMLElement;
    return Array.from(compilado.querySelectorAll<HTMLButtonElement>('button.sala')).filter(
      (sala) => sala.getAttribute('aria-disabled') !== 'true',
    );
  }

  function botaoPorNome(fixture: { nativeElement: HTMLElement }, nome: string) {
    const compilado = fixture.nativeElement as HTMLElement;
    return Array.from(compilado.querySelectorAll<HTMLButtonElement>('button.sala')).find(
      (sala) => sala.querySelector('.sala__nome')?.textContent?.trim() === nome,
    );
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MapaSalas);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the eight rooms and the legend', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('button.sala').length).toBe(8);
    expect(compiled.querySelectorAll('.legenda__itens li').length).toBe(5);
    expect(compiled.querySelector('app-lista-salas')).toBeTruthy();
    expect(compiled.textContent).not.toContain('Layout ilustrativo');
    expect(compiled.textContent).toContain('Sala Focus');
    expect(compiled.textContent).toContain('Até 2 pessoas');
    expect(compiled.textContent).toContain('Time do suporte');
  });

  it('should mark occupied rooms as not bookable', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.sala--ocupada').length).toBe(7);
    expect(compiled.querySelectorAll('button.sala[aria-disabled="true"]').length).toBe(7);
  });

  it('should emit the selected room', () => {
    const fixture = montar([{ id: 6 }]);
    let escolhida = '';

    fixture.componentInstance.selecionar.subscribe((nome) => (escolhida = nome));
    const disponivel = selecionaveis(fixture);
    expect(disponivel.length).toBe(1);

    disponivel[0].click();

    expect(escolhida).toBe('Componivel 02');
  });

  it('should render the floor plan areas of the reference drawing', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.faixa--margem')).toBeTruthy();
    expect(compiled.querySelector('.faixa--corredor')).toBeTruthy();
    expect(compiled.querySelector('.faixa--janelas')).toBeTruthy();
    expect(compiled.querySelector('.faixa--rodape')).toBeTruthy();
    expect(compiled.querySelectorAll('.faixa[aria-hidden="true"]').length).toBe(5);
    expect(compiled.querySelectorAll('.estrutural').length).toBe(2);
    expect(compiled.querySelector('.sala[style*="focus"]')).toBeTruthy();
  });

  it('should keep the auditorium restricted with capacity and booking tooltip', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;
    const auditorio = compiled.querySelector('.sala--restrita');

    expect(auditorio).toBeTruthy();
    expect(auditorio?.querySelector('.sala__capacidade')?.textContent).toContain('A definir');
    expect(auditorio?.textContent).toContain('somente com um responsável');
    expect(auditorio?.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Reserve com a equipe de Facilities',
    );
    expect(auditorio?.tagName).toBe('DIV');
  });

  it('should show the empty state when every room is taken', () => {
    const fixture = montar([]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-vazio')).toBeTruthy();
    expect(compiled.querySelector('app-lista-salas')).toBeNull();
  });

  it('should show the error state with retry', () => {
    const fixture = TestBed.createComponent(MapaSalas);
    fixture.componentRef.setInput('salas', []);
    fixture.componentRef.setInput('erro', 'Falha de rede.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-erro')).toBeTruthy();
    expect(compiled.textContent).toContain('Falha de rede.');
  });

  it('should show when an occupied room becomes free', () => {
    const fixture = montar([{ id: 6 }]);
    fixture.componentRef.setInput('ocupacoes', [
      { salaId: 1, horaInicio: '14:00', horaFim: '15:00' },
    ]);
    fixture.detectChanges();

    const dica = botaoPorNome(fixture, 'Sala 01')?.querySelector('.sala__dica');

    expect(dica?.textContent).toContain('Sala 01 · Disponível às 15:00');
  });

  it('should say when an occupied room has no slot left today', () => {
    const fixture = montar([{ id: 6 }]);
    fixture.componentRef.setInput('ocupacoes', [
      { salaId: 1, horaInicio: '14:00', horaFim: '23:30' },
    ]);
    fixture.detectChanges();

    const dica = botaoPorNome(fixture, 'Sala 01')?.querySelector('.sala__dica');

    expect(dica?.textContent).toContain('sem horário livre hoje');
  });

  it('should show the free room as available', () => {
    const fixture = montar([{ id: 6 }]);

    const dica = botaoPorNome(fixture, 'Componivel 02')?.querySelector('.sala__dica');

    expect(dica?.textContent?.trim()).toBe('Disponível');
  });

  it('should not guess an hour while the occupations are unknown', () => {
    const fixture = montar([{ id: 6 }]);

    const dica = botaoPorNome(fixture, 'Sala 01')?.querySelector('.sala__dica');

    expect(dica?.textContent).toContain('ocupada neste horário');
  });

  it('should explain the capacity when the group does not fit the room', () => {
    const fixture = montar([{ id: 6 }]);
    fixture.componentRef.setInput('pessoas', 5);
    fixture.detectChanges();

    const dica = botaoPorNome(fixture, 'Sala Focus')?.querySelector('.sala__dica');

    expect(dica?.textContent).toContain('não atende 5 pessoas (até 2)');
  });

  it('should keep the generic label before any room is clicked', () => {
    const fixture = montar([{ id: 6 }]);

    expect(fixture.componentInstance.seloDisponibilidade()).toBe(
      'Disponibilidade às 14:00',
    );
  });

  it('should inform the next free time when an occupied room is clicked', () => {
    const fixture = montar([{ id: 6 }]);
    fixture.componentRef.setInput('ocupacoes', [
      { salaId: 1, horaInicio: '14:00', horaFim: '15:00' },
    ]);
    fixture.detectChanges();

    let escolhida = '';
    fixture.componentInstance.selecionar.subscribe((nome) => (escolhida = nome));
    botaoPorNome(fixture, 'Sala 01')?.click();

    // Clique em sala ocupada informa no selo, mas nunca reserva.
    expect(escolhida).toBe('');
    expect(fixture.componentInstance.seloDisponibilidade()).toBe(
      'Sala 01 · Disponível às 15:00',
    );
  });

  it('should name the selected room in the header badge', () => {
    const fixture = montar([{ id: 6 }], 'Componivel 02');

    expect(fixture.componentInstance.seloDisponibilidade()).toBe(
      'Componivel 02 · Disponível',
    );
  });

  it('should inform the next free time from the room list as well', () => {
    const fixture = montar([{ id: 6 }]);
    fixture.componentRef.setInput('ocupacoes', [
      { salaId: 1, horaInicio: '14:00', horaFim: '15:00' },
    ]);
    fixture.detectChanges();

    let escolhida = '';
    fixture.componentInstance.selecionar.subscribe((nome) => (escolhida = nome));
    const itemDaLista = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        'app-lista-salas button',
      ),
    ).find((item) => item.textContent?.includes('Sala 01'));

    itemDaLista?.click();

    expect(escolhida).toBe('');
    expect(fixture.componentInstance.seloDisponibilidade()).toBe(
      'Sala 01 · Disponível às 15:00',
    );
  });
});
