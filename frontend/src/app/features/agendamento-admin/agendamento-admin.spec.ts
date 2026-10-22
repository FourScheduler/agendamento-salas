import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AgendamentoAdmin } from './agendamento-admin';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorInterceptor } from '../../core/http/api-error';
import { authInterceptor } from '../../core/http/auth-interceptor';
import { environment } from '../../../environments/environment';

function aguardarMicrotarefas(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Entra como administrador pelo login real, o caminho da tela admin. */
async function entrarComoAdmin(httpMock: HttpTestingController): Promise<void> {
  const login = TestBed.inject(AuthService).entrar('admin@teste.com', '123456');
  httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush('token-admin');
  await aguardarMicrotarefas();
  httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush({
    id: 1,
    nome: 'Administrador Principal',
    email: 'admin@teste.com',
    perfilUsuario: 'ADMIN',
  });
  await login;
}

describe('AgendamentoAdmin', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AgendamentoAdmin],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
  });

  function chamadaDeBusca() {
    return httpMock.expectOne((requisicao) => requisicao.url.includes('/api/salas/disponiveis'));
  }

  function chamadaDeOcupacoes() {
    return httpMock.expectOne((requisicao) => requisicao.url.includes('/api/salas/ocupacoes'));
  }

  /**
   * Limpa as ocupações pendentes da planta. Só existem quando a data muda ou depois
   * de uma reserva nova, então nem toda busca traz esse segundo GET.
   */
  function responderOcupacoes() {
    httpMock
      .match((requisicao) => requisicao.url.includes('/api/salas/ocupacoes'))
      .forEach((chamada) => chamada.flush([]));
  }

  function chamadaDeUsuarios() {
    return httpMock.expectOne(`${environment.apiUrl}/api/usuarios`);
  }

  /**
   * Monta a tela e responde a carga inicial de usuários e as ocupações do dia.
   * A busca de salas fica pendente de propósito: cada teste a responde com
   * `responder(...)`, como no spec do agendamento comum.
   */
  function iniciar(usuarios: unknown[] = []) {
    const fixture = TestBed.createComponent(AgendamentoAdmin);
    // Fixa um horário válido para a validação de fim de jornada não abortar a busca.
    fixture.componentInstance.horaInicio.set('09:00');
    fixture.detectChanges();
    chamadaDeOcupacoes().flush([]);
    chamadaDeUsuarios().flush(usuarios);
    return fixture;
  }

  function responder(salas: { id: number; nome: string; capacidade: number }[]) {
    chamadaDeBusca().flush(
      salas.map((sala) => ({ ...sala, disponivel: true, localizacao: 'Tamboré' })),
    );
  }

  it('should create the component and load rooms and users', () => {
    const fixture = iniciar();
    expect(fixture.componentInstance).toBeTruthy();
    expect(chamadaDeBusca().request.method).toBe('GET');
  });

  it('should render the same map and panel layout of the common screen', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Escolha as salas');
    expect(compiled.querySelector('app-mapa-salas')).toBeTruthy();
    expect(compiled.querySelector('app-painel-reserva')).toBeTruthy();
    // A tela administrativa não tem assistente.
    expect(compiled.querySelector('app-assistente-ia')).toBeNull();
  });

  it('should offer duration options covering the rest of the day', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();

    // Início fixo em 09:00: o dia tem opções até 23:30 e nada que passe da meia-noite.
    const opcoes = fixture.componentInstance.duracoes();
    expect(opcoes).toContain(180);
    expect(opcoes).toContain(240);
    expect(opcoes).toContain(720); // 12 horas
    expect(opcoes).toContain(870); // 09:00 + 870 min = 23:30
    expect(opcoes).not.toContain(900); // 09:00 + 900 min = 24:00, fora do dia
  });

  it('should reduce the duration when a new start would end after midnight', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();

    const componente = fixture.componentInstance;
    componente.duracao.set(870); // válido às 09:00
    componente.atualizarHora('16:00');
    responder([]);

    expect(componente.duracao()).toBe(450); // 16:00 + 450 min = 23:30
    expect(componente.erroValidacao()).toBeNull();
  });

  it('should show the empty state when no room is free', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-vazio')).toBeTruthy();
  });

  it('should toggle multiple rooms in the summary', async () => {
    const fixture = iniciar();
    responder([
      { id: 1, nome: 'Sala 01', capacidade: 4 },
      { id: 2, nome: 'Sala 02', capacidade: 4 },
      { id: 5, nome: 'Componivel 01', capacidade: 8 },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const componente = fixture.componentInstance;
    componente.alternarSala('Sala 01');
    componente.alternarSala('Componivel 01');

    expect(componente.selecionadas()).toEqual(['Sala 01', 'Componivel 01']);
    expect(componente.salasEscolhidas().length).toBe(2);
    expect(componente.capacidadeTotal()).toBe(12);

    // Clicar de novo na sala escolhida devolve o estado anterior.
    componente.alternarSala('Sala 01');
    expect(componente.selecionadas()).toEqual(['Componivel 01']);
  });

  it('should mark every chosen room on the map', async () => {
    const fixture = iniciar();
    responder([
      { id: 1, nome: 'Sala 01', capacidade: 4 },
      { id: 2, nome: 'Sala 02', capacidade: 4 },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const mapa = fixture.nativeElement as HTMLElement;
    const livres = Array.from(mapa.querySelectorAll<HTMLButtonElement>('button.sala')).filter(
      (sala) => sala.getAttribute('aria-disabled') !== 'true',
    );

    livres[0].click();
    livres[1].click();
    fixture.detectChanges();

    const marcadas = Array.from(mapa.querySelectorAll<HTMLButtonElement>('button.sala')).filter(
      (sala) => sala.getAttribute('aria-pressed') === 'true',
    );
    expect(marcadas.length).toBe(2);
    expect(fixture.componentInstance.selecionadas().length).toBe(2);
  });

  it('should offer a requester search that filters by name or email', async () => {
    const fixture = iniciar([
      { id: 1, nome: 'Administrador Principal', email: 'admin@teste.com', perfilUsuario: 'ADMIN' },
      { id: 3, nome: 'Usuario Teste Um', email: 'usuario@teste.com', perfilUsuario: 'USER' },
    ]);
    responder([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const painel = (fixture.nativeElement as HTMLElement).querySelector('app-painel-reserva')!;
    const botao = Array.from(painel.querySelectorAll<HTMLButtonElement>('button.linha__botao'))
      .find((item) => item.textContent?.includes('Solicitante'));
    expect(botao).toBeTruthy();

    botao?.click();
    fixture.detectChanges();

    // Em vez de um <select> com todos os usuários, o admin digita nome ou e-mail.
    const campo = painel.querySelector<HTMLInputElement>('#resumo-solicitante');
    expect(campo).toBeTruthy();
    expect(campo?.placeholder).toContain('nome ou e-mail');

    campo!.value = 'usuario';
    campo!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const sugestoes = painel.querySelectorAll('[role="option"]');
    expect(sugestoes.length).toBe(1);
    expect(sugestoes[0].textContent).toContain('Usuario Teste Um');
  });

  it('should confirm a reservation with several rooms and the chosen requester', async () => {
    const fixture = iniciar([
      { id: 1, nome: 'Administrador Principal', email: 'admin@teste.com', perfilUsuario: 'ADMIN' },
      { id: 3, nome: 'Usuario Teste Um', email: 'usuario@teste.com', perfilUsuario: 'USER' },
    ]);
    responder([
      { id: 1, nome: 'Sala 01', capacidade: 4 },
      { id: 5, nome: 'Componivel 01', capacidade: 8 },
    ]);
    await fixture.whenStable();

    const componente = fixture.componentInstance;
    componente.alternarSala('Sala 01');
    componente.alternarSala('Componivel 01');
    componente.duracao.set(180);
    componente.selecionarSolicitante(3);

    await entrarComoAdmin(httpMock);

    const promessa = componente.confirmar();

    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/agendamento`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toMatchObject({
      salaId: [{ id: 1 }, { id: 5 }],
      horaInicio: '09:00',
      horaFim: '12:00',
      qntdPessoas: 1,
      titulo: 'Reunião - 2 salas integradas',
      usuarioIdSolicitante: { id: 3 },
    });

    chamada.flush({
      id: 10,
      sala: { id: 1, nome: 'Sala 01' },
      inicio: '09:00:00',
      fim: '12:00:00',
      status: 'CONFIRMADO',
      solicitante: { id: 3, nome: 'Usuario Teste Um', email: 'usuario@teste.com' },
      agendamentos: [
        { id: 10, sala: { id: 1, nome: 'Sala 01' } },
        { id: 11, sala: { id: 5, nome: 'Componivel 01' } },
      ],
    });

    await promessa;

    expect(componente.selecionadas()).toEqual([]);

    // A confirmação recarrega as ocupações e a lista de salas livres.
    responderOcupacoes();
    responder([]);
    await fixture.whenStable();
  });

  it('should ask for login when confirming while unauthenticated', async () => {
    const fixture = iniciar();
    responder([{ id: 1, nome: 'Sala 01', capacidade: 4 }]);
    await fixture.whenStable();

    fixture.componentInstance.alternarSala('Sala 01');
    await fixture.componentInstance.confirmar();

    expect(fixture.componentInstance.erroConfirmacao()).toContain('Faça login');
    expect(httpMock.match(`${environment.apiUrl}/api/agendamento`).length).toBe(0);
  });

  it('should keep only rooms still free after a new search', async () => {
    const fixture = iniciar();
    responder([
      { id: 1, nome: 'Sala 01', capacidade: 4 },
      { id: 2, nome: 'Sala 02', capacidade: 4 },
    ]);
    await fixture.whenStable();

    const componente = fixture.componentInstance;
    componente.alternarSala('Sala 01');

    componente.atualizarHora('15:00');
    responder([{ id: 2, nome: 'Sala 02', capacidade: 4 }]);

    expect(componente.selecionadas()).toEqual([]);
  });
});
