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

  it('should format the duration options', () => {
    const fixture = TestBed.createComponent(PainelReserva);
    const componente = fixture.componentInstance;

    expect(componente.rotuloDuracao(30)).toBe('30 min');
    expect(componente.rotuloDuracao(60)).toBe('1 hora');
    expect(componente.rotuloDuracao(90)).toBe('1 hora e 30 min');
    expect(componente.rotuloDuracao(120)).toBe('2 horas');
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
    // O seletor dá lugar ao stepper de 30 em 30 minutos com atalhos.
    expect(compilado.querySelector('select#resumo-duracao')).toBeNull();
    expect(compilado.querySelectorAll('.duracao__atalho').length).toBe(4);

    compilado
      .querySelector<HTMLButtonElement>('button[aria-label="Aumentar 30 minutos"]')
      ?.click();
    expect(duracaoEmitida).toBe(90);

    // "Dia inteiro" aplica a maior duração possível a partir do início.
    const diaInteiro = Array.from(
      compilado.querySelectorAll<HTMLButtonElement>('.duracao__atalho'),
    ).find((botao) => botao.textContent?.trim() === 'Dia inteiro');
    diaInteiro?.click();
    expect(duracaoEmitida).toBe(240);
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
