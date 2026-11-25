import { TestBed } from '@angular/core/testing';
import { PainelReserva } from './painel-reserva';
import { resolverEstados } from '../../core/data/mapa-mock';
import { Usuario } from '../../core/models/api.models';

describe('PainelReserva', () => {
  const USUARIOS: Usuario[] = [
    { id: 1, nome: 'Administrador Principal', email: 'admin@teste.com', perfilUsuario: 'ADMIN' },
    { id: 3, nome: 'Ana Maria', email: 'ana@teste.com', perfilUsuario: 'USER' },
    { id: 4, nome: 'Carlos Silva', email: 'carlos@teste.com', perfilUsuario: 'USER' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelReserva],
    }).compileComponents();
  });

  function montar(
    pessoas = 4,
    opcoes: {
      autenticado?: boolean;
      solicitante?: string;
      solicitantes?: Usuario[];
      solicitanteId?: number | null;
    } = {},
  ) {
    const fixture = TestBed.createComponent(PainelReserva);
    fixture.componentRef.setInput('sala', resolverEstados([{ id: 1 }])[0]);
    fixture.componentRef.setInput('data', '2026-06-18');
    fixture.componentRef.setInput('horaInicio', '14:00');
    fixture.componentRef.setInput('duracao', 60);
    fixture.componentRef.setInput('pessoas', pessoas);
    fixture.componentRef.setInput('autenticado', opcoes.autenticado ?? false);
    fixture.componentRef.setInput('solicitante', opcoes.solicitante ?? null);
    fixture.componentRef.setInput('solicitantes', opcoes.solicitantes ?? []);
    fixture.componentRef.setInput('solicitanteId', opcoes.solicitanteId ?? null);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(PainelReserva);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('não exibe legenda de sala vazia no início do resumo', () => {
    const fixture = montar();
    fixture.componentRef.setInput('sala', null);
    fixture.detectChanges();

    const painel = fixture.nativeElement as HTMLElement;
    expect(painel.querySelector('.resumo__salas')).toBeNull();
    expect(painel.textContent).not.toContain('Selecione uma sala na planta para continuar.');
  });

  it('emite a sala removida e impede a remoção durante a confirmação', () => {
    const fixture = montar();
    const painel = fixture.nativeElement as HTMLElement;
    const removidas: string[] = [];
    fixture.componentInstance.salaRemovida.subscribe((nome) => removidas.push(nome));
    const botao = painel.querySelector<HTMLButtonElement>('.resumo__remover')!;
    botao.click();
    fixture.componentRef.setInput('confirmando', true);
    fixture.detectChanges();
    expect(botao.disabled).toBe(true);
    botao.click();
    expect(removidas).toEqual(['Sala 01']);
  });

  it('should format the duration options', () => {
    const fixture = TestBed.createComponent(PainelReserva);
    const componente = fixture.componentInstance;

    expect(componente.rotuloDuracao(30)).toBe('30 min');
    expect(componente.rotuloDuracao(60)).toBe('1 hora');
    expect(componente.rotuloDuracao(90)).toBe('1 hora e 30 min');
    expect(componente.rotuloDuracao(120)).toBe('2 horas');
  });

  it('emite a sala do cartão administrativo e bloqueia o X durante o envio', () => {
    const fixture = montar();
    const painel = fixture.nativeElement as HTMLElement;
    expect(painel.querySelector('.resumo__remover')).toBeTruthy();
    const salas = resolverEstados([{ id: 5 }, { id: 9 }]).filter(s => [5, 9].includes(s.id));
    fixture.componentRef.setInput('salas', salas);
    fixture.detectChanges();
    const removidas: string[] = [];
    fixture.componentInstance.salaRemovida.subscribe(nome => removidas.push(nome));
    const arena = painel.querySelector<HTMLButtonElement>('button[aria-label="Remover sala Arena"]')!;
    expect(painel.querySelectorAll('.resumo__remover')).toHaveLength(2);
    arena.click();
    fixture.componentRef.setInput('confirmando', true);
    fixture.detectChanges();
    expect(arena.disabled).toBe(true);
    arena.click();
    expect(removidas).toEqual(['Arena']);
  });

  it('should offer a stepper with quick durations in admin mode', () => {
    const fixture = TestBed.createComponent(PainelReserva);
    fixture.componentRef.setInput('stepperDuracao', true);
    fixture.componentRef.setInput('duracaoMaxima', 240);
    fixture.componentRef.setInput('duracao', 60);
    fixture.detectChanges();

    let duracaoEmitida = 0;
    fixture.componentInstance.duracaoAlterada.subscribe((minutos) => (duracaoEmitida = minutos));

    fixture.componentInstance.alternar('duracao');
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    // O seletor dá lugar ao stepper de 15 em 15 minutos com atalhos.
    expect(compilado.querySelector('select#resumo-duracao')).toBeNull();
    expect(compilado.querySelectorAll('.duracao__atalho').length).toBe(7);

    compilado
      .querySelector<HTMLButtonElement>('button[aria-label="Aumentar 15 minutos"]')
      ?.click();
    expect(duracaoEmitida).toBe(75);

    // "Dia inteiro" aplica a maior duração possível a partir do início.
    const diaInteiro = Array.from(
      compilado.querySelectorAll<HTMLButtonElement>('.duracao__atalho'),
    ).find((botao) => botao.textContent?.trim() === 'Dia inteiro');
    diaInteiro?.click();
    expect(duracaoEmitida).toBe(240);
  });

  it.each([
    [15, '15 min', '14:15'],
    [45, '45 min', '14:45'],
    [75, '1 hora e 15 min', '15:15'],
    [90, '1 hora e 30 min', '15:30'],
    [105, '1 hora e 45 min', '15:45'],
  ])('should select %i minutes and show the final time in USER mode', (minutos, rotulo, fim) => {
    const fixture = montar();
    fixture.componentInstance.alternar('duracao');
    fixture.detectChanges();
    const select = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLSelectElement>('#resumo-duracao')!;
    expect(Array.from(select.options).map((opcao) => Number(opcao.value)))
      .toEqual([15, 30, 45, 60, 75, 90, 105, 120]);
    expect(Array.from(select.options).find((opcao) => Number(opcao.value) === minutos)?.textContent)
      .toContain(rotulo);
    let emitida = 0;
    fixture.componentInstance.duracaoAlterada.subscribe((valor) => (emitida = valor));

    select.value = String(minutos);
    select.dispatchEvent(new Event('change'));
    fixture.componentRef.setInput('duracao', emitida);
    fixture.detectChanges();

    expect(emitida).toBe(minutos);
    expect(fixture.componentInstance.horaFim()).toBe(fim);
  });

  it.each([
    [15, '15 min'],
    [45, '45 min'],
    [90, '1 hora e 30 min'],
  ])('should apply the %i minute quick duration in ADMIN mode', (minutos, rotulo) => {
    const fixture = montar();
    fixture.componentRef.setInput('stepperDuracao', true);
    fixture.componentRef.setInput('duracaoMaxima', 570);
    fixture.componentInstance.alternar('duracao');
    fixture.detectChanges();
    let emitida = 0;
    fixture.componentInstance.duracaoAlterada.subscribe((valor) => (emitida = valor));
    const botao = Array.from((fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.duracao__atalho'))
      .find((item) => item.textContent?.trim() === rotulo)!;

    botao.click();
    fixture.componentRef.setInput('duracao', emitida);
    fixture.detectChanges();

    expect(emitida).toBe(minutos);
    expect(fixture.componentInstance.duracaoMinima()).toBe(minutos === 15);
  });

  it('should clamp the admin stepper to 15 minutes and to the end of day', () => {
    const fixture = montar();
    fixture.componentRef.setInput('duracao', 30);
    fixture.componentRef.setInput('duracaoMaxima', 45);
    let emitida = 0;
    fixture.componentInstance.duracaoAlterada.subscribe((valor) => (emitida = valor));

    fixture.componentInstance.mudarDuracao(-15);
    expect(emitida).toBe(15);
    fixture.componentInstance.mudarDuracao(15);
    expect(emitida).toBe(45);
    expect(fixture.componentInstance.atalhosDuracao()).toEqual([15, 30, 45]);
  });

  it('should navigate admin durations in 15-minute steps and disable the limits', () => {
    const fixture = montar();
    fixture.componentRef.setInput('stepperDuracao', true);
    fixture.componentRef.setInput('duracao', 15);
    fixture.componentRef.setInput('duracaoMaxima', 135);
    fixture.componentInstance.alternar('duracao');
    fixture.componentInstance.duracaoAlterada.subscribe((valor) => {
      fixture.componentRef.setInput('duracao', valor);
    });
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    const aumentar = elemento.querySelector<HTMLButtonElement>(
      'button[aria-label="Aumentar 15 minutos"]',
    )!;
    const diminuir = elemento.querySelector<HTMLButtonElement>(
      'button[aria-label="Diminuir 15 minutos"]',
    )!;
    expect(diminuir.disabled).toBe(true);

    for (const minutos of [30, 45, 60, 75, 90, 105, 120, 135]) {
      aumentar.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.duracao()).toBe(minutos);
    }

    expect(aumentar.disabled).toBe(true);
    diminuir.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.duracao()).toBe(120);
    expect(aumentar.disabled).toBe(false);
  });

  it('should show the selected room and the final time', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sala 01');
    expect(compiled.textContent).toContain('14:00 - 15:00');
    expect(compiled.textContent).toContain('18 jun, quinta-feira');
  });

  it('should show the reservation label in the summary header', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const cabecalho = compiled.querySelector('.resumo__cabecalho');

    expect(cabecalho).toBeTruthy();
    expect(cabecalho?.querySelector('.eyebrow')?.textContent).toContain('Sua reserva');
  });

  it('should allow a confirmation attempt while unauthenticated when a room is selected', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const botao = compiled.querySelector<HTMLButtonElement>('.resumo__confirmar');
    expect(botao?.disabled).toBe(false);
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
    expect(botao?.textContent?.trim()).toBe('Confirmar reserva');

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

  it('should filter the requester suggestions by name or email while typing', async () => {
    const fixture = montar(4, { autenticado: true, solicitantes: USUARIOS });
    await fixture.whenStable();

    fixture.componentInstance.alternar('solicitante');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const campo = compiled.querySelector<HTMLInputElement>('#resumo-solicitante');
    expect(campo).toBeTruthy();
    expect(campo?.placeholder).toContain('nome ou e-mail');
    // Lista inicial limitada: nada de <select> com todos os usuários.
    // Primeiro item é sempre o "(eu mesmo)", sem precisar rolar.
    expect(compiled.querySelectorAll('[role="option"]').length).toBe(4);
    expect(compiled.querySelector('[role="option"] .sugestoes__nome')?.textContent).toContain(
      '(eu mesmo)',
    );

    campo!.value = 'ana@';
    campo!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    let sugestoes = compiled.querySelectorAll('[role="option"]');
    expect(sugestoes.length).toBe(1);
    expect(sugestoes[0].textContent).toContain('Ana Maria');

    campo!.value = 'CARLOS';
    campo!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    sugestoes = compiled.querySelectorAll('[role="option"]');
    expect(sugestoes.length).toBe(1);
    expect(sugestoes[0].textContent).toContain('carlos@teste.com');

    campo!.value = 'ninguem';
    campo!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(compiled.querySelector('.sugestoes__vazio')?.textContent).toContain(
      'Nenhum usuário encontrado',
    );
  });

  it('should show the logged administrator once, first, and find him by searching', async () => {
    const fixture = montar(4, {
      autenticado: true,
      solicitante: 'Administrador Principal',
      solicitantes: USUARIOS,
    });
    await fixture.whenStable();

    fixture.componentInstance.alternar('solicitante');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const nomes = () =>
      Array.from(compiled.querySelectorAll('[role="option"] .sugestoes__nome')).map((item) =>
        item.textContent?.trim(),
      );

    // Aparece uma vez só, no topo da lista com o selo "(eu mesmo)".
    expect(nomes()).toEqual([
      'Administrador Principal (eu mesmo)',
      'Ana Maria',
      'Carlos Silva',
    ]);

    // Buscar o próprio nome encontra o "(eu mesmo)" em vez de nada.
    const campo = compiled.querySelector<HTMLInputElement>('#resumo-solicitante')!;
    campo.value = 'Administrador Principal';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.querySelector('[role="option"] .sugestoes__nome')?.textContent).toContain(
      '(eu mesmo)',
    );
    expect(compiled.querySelectorAll('[role="option"]').length).toBe(1);
  });

  it('should emit the requester chosen from a suggestion or as myself', async () => {
    const fixture = montar(4, { autenticado: true, solicitantes: USUARIOS });
    await fixture.whenStable();

    let escolhido = -1;
    fixture.componentInstance.solicitanteAlterado.subscribe((id) => (escolhido = id));

    fixture.componentInstance.alternar('solicitante');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const campo = compiled.querySelector<HTMLInputElement>('#resumo-solicitante')!;
    campo.value = 'ana';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    compiled.querySelector<HTMLLIElement>('[role="option"]')?.click();
    expect(escolhido).toBe(3);
    // Escolher fecha o editor do campo.
    expect(fixture.componentInstance.campoAberto()).toBeNull();

    fixture.componentInstance.alternar('solicitante');
    fixture.detectChanges();
    // Com a busca vazia, o "(eu mesmo)" é o primeiro item da lista.
    compiled.querySelector<HTMLLIElement>('[role="option"]')?.click();
    expect(escolhido).toBe(0);
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
    const fixture = montar(5);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const botoes = compiled.querySelectorAll<HTMLButtonElement>('.stepper');

    expect(botoes[1].disabled).toBe(true);
    expect(compiled.textContent).toContain('Esta sala comporta até 5 pessoas.');
  });

  it('should allow increasing participants from four to five', () => {
    const fixture = montar(4);
    let pessoas = 0;
    fixture.componentInstance.pessoasAlterada.subscribe((valor) => (pessoas = valor));
    const aumentar = (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.stepper')[1];

    expect(aumentar.disabled).toBe(false);
    aumentar.click();

    expect(pessoas).toBe(5);
  });

  it.each([1, 2, 3])('should advise borrowing a chair for five people in room %i', (id) => {
    const fixture = montar(5, { autenticado: true });
    fixture.componentRef.setInput('sala', resolverEstados([{ id }]).find((sala) => sala.id === id));
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('.resumo__aviso-cadeira[role="status"]')?.textContent?.trim())
      .toBe('Para cinco pessoas nesta sala, solicite uma cadeira à equipe de Facilities.');
    expect(elemento.querySelector<HTMLButtonElement>('.resumo__confirmar')?.disabled).toBe(false);
  });

  it('should update the chair advice when changing participants or rooms', () => {
    const fixture = montar(5);
    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('[role="status"]')).toBeTruthy();

    fixture.componentRef.setInput('pessoas', 4);
    fixture.detectChanges();
    expect(elemento.querySelector('[role="status"]')).toBeNull();

    fixture.componentRef.setInput('pessoas', 5);
    fixture.componentRef.setInput('sala', resolverEstados([{ id: 5 }]).find((sala) => sala.id === 5));
    fixture.detectChanges();
    expect(elemento.querySelector('[role="status"]')).toBeNull();

    fixture.componentRef.setInput('sala', null);
    fixture.detectChanges();
    expect(elemento.querySelector('[role="status"]')).toBeNull();
  });

  it('should show chair advice in ADMIN mode for five people and an applicable room', () => {
    const fixture = montar(5, { autenticado: true });
    const salas = resolverEstados([{ id: 2 }, { id: 5 }]);
    fixture.componentRef.setInput('sala', null);
    fixture.componentRef.setInput('salas', salas.filter((sala) => [2, 5].includes(sala.id)));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent)
      .toContain('solicite uma cadeira à equipe de Facilities.');

    fixture.componentRef.setInput('salas', salas.filter((sala) => sala.id === 5));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeNull();
  });

  it('should show the Facilities note only when equipment is selected', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const caixa = compiled.querySelector<HTMLInputElement>('#resumo-equipamentos');
    expect(caixa).toBeTruthy();
    expect(compiled.querySelector('.resumo__facilities')).toBeNull();

    let marcado = false;
    fixture.componentInstance.equipamentosAlterada.subscribe((valor) => (marcado = valor));
    caixa?.click();
    expect(marcado).toBe(true);

    fixture.componentRef.setInput('equipamentos', true);
    fixture.detectChanges();
    expect(compiled.querySelector('.resumo__facilities')?.textContent?.trim())
      .toBe('Solicite o equipamento previamente à equipe de Facilities.');

    caixa?.click();
    expect(marcado).toBe(false);

    fixture.componentRef.setInput('equipamentos', false);
    fixture.detectChanges();
    expect(compiled.querySelector('.resumo__facilities')).toBeNull();
  });
});
