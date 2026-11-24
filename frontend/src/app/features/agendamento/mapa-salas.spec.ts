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
      (sala) =>
        sala.querySelector('.sala__nome')?.textContent?.trim() === nome ||
        sala.getAttribute('aria-label')?.startsWith(nome) ||
        sala.getAttribute('aria-label')?.includes(` — ${nome} · `),
    );
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MapaSalas);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render every bookable room of the new plan and the legend', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;

    // 17 salas; a Arena é restrita para o usuário comum e não vira botão.
    expect(compiled.querySelectorAll('button.sala').length).toBe(16);
    expect(compiled.querySelectorAll('.legenda__itens li').length).toBe(5);
    expect(compiled.querySelector('app-lista-salas')).toBeTruthy();
    expect(compiled.textContent).not.toContain('Layout ilustrativo');
    expect(compiled.textContent).toContain('Sala Focus');
    expect(botaoPorNome(fixture, 'Componivel 02')?.querySelector('.sala__nome')?.textContent?.trim())
      .toBe('Comp. 02');
    expect(botaoPorNome(fixture, 'Sala Focus')?.querySelector('.sala__capacidade')?.textContent?.trim())
      .toBe('1-2');
    expect(botaoPorNome(fixture, 'Cabine 03')?.querySelector('.sala__capacidade')?.textContent?.trim())
      .toBe('1');
    const capacidadeIndividual = botaoPorNome(fixture, 'Cabine 03')?.querySelector('.sala__capacidade');
    const capacidadeGrupo = botaoPorNome(fixture, 'Sala Focus')?.querySelector('.sala__capacidade');
    expect(capacidadeIndividual?.firstElementChild?.textContent?.trim()).toBe('1');
    expect(capacidadeIndividual?.lastElementChild?.classList.contains('lucide-user-round')).toBe(true);
    expect(capacidadeGrupo?.firstElementChild?.textContent?.trim()).toBe('1-2');
    expect(capacidadeGrupo?.lastElementChild?.classList.contains('lucide-users-round')).toBe(true);
    expect(compiled.textContent).toContain('Suporte');
  });

  it('should mark occupied rooms as not bookable', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.sala--ocupada').length).toBe(15);
    expect(compiled.querySelectorAll('button.sala[aria-disabled="true"]').length).toBe(15);
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

  it.each(['Sala 01', 'Sala 02', 'Sala 03'])(
    'should display capacity five and allow selecting %s for five participants',
    (nome) => {
      const fixture = montar([{ id: 1 }, { id: 2 }, { id: 3 }]);
      fixture.componentRef.setInput('pessoas', 5);
      fixture.detectChanges();
      let escolhida = '';
      fixture.componentInstance.selecionar.subscribe((valor) => (escolhida = valor));
      const botao = botaoPorNome(fixture, nome)!;

      expect(botao.querySelector('.sala__capacidade')?.textContent?.trim()).toBe('1-5');
      expect(botao.getAttribute('aria-disabled')).not.toBe('true');
      botao.click();

      expect(escolhida).toBe(nome);
    },
  );

  it('should render the floor plan areas of the new drawing', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.faixa--topoEsquerda')).toBeNull();
    expect(compiled.querySelector('.faixa--topoDireita')).toBeNull();
    expect(compiled.querySelector('.faixa--entrada')).toBeNull();
    expect(compiled.querySelector('.faixa--rodape')).toBeNull();
    expect(compiled.querySelector('.mesaReuniao')).toBeNull();
    expect(compiled.querySelector('.faixa--circulacaoEsquerda')).toBeTruthy();
    expect(compiled.querySelector('.faixa--circulacaoCentral')).toBeTruthy();
    expect(compiled.querySelector('.faixa--circulacaoDireita')).toBeTruthy();
    expect(compiled.querySelectorAll('.faixa--mesas').length).toBe(2);
    expect(compiled.querySelectorAll('.faixa[aria-hidden="true"]').length).toBe(5);
    expect(
      Array.from(compiled.querySelectorAll('.estrutural')).map((area) => area.textContent?.trim()),
    ).toEqual(['Presidência', 'RH', 'Financeiro', 'servidores', 'Suporte']);
    expect(compiled.querySelector('.sala[style*="focus"]')).toBeTruthy();
    expect(compiled.querySelector('.planta__alaDiretoria .sala[style*="diretoria"]')).toBeTruthy();
    expect(compiled.querySelector('.sala[style*="presidencia"]')).toBeNull();
  });

  it('should group the seven cabines with their capacities', () => {
    const fixture = montar([{ id: 11 }, { id: 13 }]);
    const compiled = fixture.nativeElement as HTMLElement;
    const cabines = compiled.querySelectorAll<HTMLButtonElement>(
      '.planta__cabines button.sala--cabine',
    );

    expect(cabines.length).toBe(7);
    for (let numero = 1; numero <= 7; numero++) {
      const sufixo = String(numero).padStart(2, '0');
      const cabine = botaoPorNome(fixture, `Cabine ${sufixo}`);
      expect(cabine?.querySelector('.sala__nome')?.textContent?.trim()).toBe(`Cab. ${sufixo}`);
      expect(cabine?.getAttribute('aria-label')).toContain(`Cab. ${sufixo} — Cabine ${sufixo}`);
    }
    expect(botaoPorNome(fixture, 'Cabine 01')?.querySelector('.sala__capacidade')?.textContent?.trim())
      .toBe('1-4');
    expect(botaoPorNome(fixture, 'Cabine 02')?.querySelector('.sala__capacidade')?.textContent?.trim())
      .toBe('1-4');
    expect(botaoPorNome(fixture, 'Cabine 03')?.querySelector('.sala__capacidade')?.textContent?.trim())
      .toBe('1');
    expect(botaoPorNome(fixture, 'Cabine 07')?.querySelector('.sala__capacidade')?.textContent?.trim())
      .toBe('1');
    expect(botaoPorNome(fixture, 'Cabine 03')?.getAttribute('aria-label')).toContain(' · 1');
    expect(botaoPorNome(fixture, 'Cabine 01')?.querySelector('.lucide-users-round')).toBeTruthy();
    expect(botaoPorNome(fixture, 'Cabine 01')?.getAttribute('aria-disabled')).toBeNull();
    expect(botaoPorNome(fixture, 'Cabine 02')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('should select a cabine and Reunião Diretoria from the plan', () => {
    const fixture = montar([{ id: 10 }, { id: 13 }]);
    const escolhidas: string[] = [];
    fixture.componentInstance.selecionar.subscribe((nome) => escolhidas.push(nome));

    botaoPorNome(fixture, 'Cabine 03')?.click();
    botaoPorNome(fixture, 'Reunião Diretoria')?.click();

    expect(escolhidas).toEqual(['Cabine 03', 'Reunião Diretoria']);
    expect(
      botaoPorNome(fixture, 'Reunião Diretoria')?.querySelector('.sala__capacidade')?.textContent?.trim(),
    ).toBe('1-4');
  });

  it.each([false, true])('should keep Presidência non-bookable in admin mode %s', (admin) => {
    const fixture = montar([{ id: 10 }]);
    fixture.componentRef.setInput('podeReservarRestritas', admin);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const ala = compiled.querySelector('.planta__alaDiretoria')!;

    expect(ala.querySelectorAll('button.sala')).toHaveLength(1);
    expect(ala.querySelector('.estrutural--presidencia')?.textContent).toBe('Presidência');
    expect(botaoPorNome(fixture, 'Presidência')).toBeUndefined();
    expect(compiled.querySelector('app-lista-salas')?.textContent).not.toContain('Presidência');
    expect(fixture.componentInstance.salasLista().find((sala) => sala.id === 10)?.nome).toBe(
      'Reunião Diretoria',
    );
  });

  it('should explain that an individual cabine does not fit a group', () => {
    const fixture = montar([{ id: 13 }]);
    fixture.componentRef.setInput('pessoas', 2);
    fixture.detectChanges();

    const dica = botaoPorNome(fixture, 'Cabine 03')?.querySelector('.sala__dica');

    expect(dica?.textContent).toContain('não atende 2 pessoas (até 1)');
  });

  it('should keep the Arena restricted for regular users with an events tooltip', () => {
    const fixture = montar([{ id: 6 }]);
    const compiled = fixture.nativeElement as HTMLElement;
    const arena = compiled.querySelector('.sala--restrita');

    expect(arena).toBeTruthy();
    expect(arena?.querySelector('.sala__capacidade')?.textContent).toContain('Eventos');
    expect(arena?.textContent).toContain('Reserva somente com o Facilities.');
    expect(arena?.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Arena reservável apenas pelo Facilities.',
    );
    expect(arena?.tagName).toBe('DIV');
  });

  it('should let the admin book the Arena when it is free', () => {
    const fixture = TestBed.createComponent(MapaSalas);
    fixture.componentRef.setInput('salas', resolverEstados([{ id: 9 }]));
    fixture.componentRef.setInput('data', '2026-06-18');
    fixture.componentRef.setInput('horaInicio', '14:00');
    fixture.componentRef.setInput('podeReservarRestritas', true);
    fixture.detectChanges();

    const arena = botaoPorNome(fixture, 'Arena');

    expect(arena).toBeTruthy();
    expect(arena?.getAttribute('aria-disabled')).toBeNull();
    expect(arena?.textContent).toContain('Eventos');
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

  it('should not show a generic availability label before any room is clicked', () => {
    const fixture = montar([{ id: 6 }]);

    expect(fixture.componentInstance.seloDisponibilidade()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.planta__disponibilidade')).toBeNull();
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
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.planta__disponibilidade')?.textContent)
      .toContain('Sala 01 · Disponível às 15:00');
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
