import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MeusAgendamentos } from './meus-agendamentos';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorInterceptor } from '../../core/http/api-error';
import { AgendamentoResumo } from '../../core/models/api.models';

describe('MeusAgendamentos', () => {
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [MeusAgendamentos],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function logar() {
    auth['iniciarSessao']('token.jwt', 'mock@fourscheduler.local');
  }

  function iniciar() {
    const fixture = TestBed.createComponent(MeusAgendamentos);
    fixture.detectChanges();
    return fixture;
  }

  function chamadaDeLista() {
    return httpMock.expectOne((requisicao) => requisicao.url.includes('/api/agendamento/meus'));
  }

  function agendamento(sobrescritas: Partial<AgendamentoResumo> = {}): AgendamentoResumo {
    return {
      salaId: { id: 2, nome: 'Sala Comp 01', disponivel: true, capacidade: 8, localizacao: 'Tamboré' },
      dataAgendamento: '2026-10-20',
      dataCriacao: '2026-10-12T18:00:00',
      horaInicio: '09:00:00',
      horaFim: '10:00:00',
      qntdPessoas: 4,
      titulo: 'Reunião de alinhamento',
      usuarioIdSolicitante: null,
      status: 'CONFIRMADO',
      ...sobrescritas,
    };
  }

  it('should create the component', () => {
    const fixture = iniciar();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the login card without calling the API when logged out', async () => {
    const fixture = iniciar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-login-cartao')).toBeTruthy();
    expect(compiled.textContent).toContain('Entre para ver seus agendamentos');
    expect(fixture.componentInstance.logado()).toBe(false);
  });

  it('should log in and load the bookings list', async () => {
    const fixture = iniciar();
    await fixture.whenStable();

    fixture.componentInstance.entrar({ email: 'mock@fourscheduler.local', senha: 'mock123' });

    const login = httpMock.expectOne((requisicao) => requisicao.url.includes('/auth/login'));
    login.flush('token.jwt');
    await fixture.whenStable();

    const lista = chamadaDeLista();
    lista.flush([agendamento()]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.meus-agendamentos__lista')).toBeTruthy();
    expect(compiled.textContent).toContain('Sala Comp 01');
    expect(compiled.textContent).toContain('Confirmado');
    expect(compiled.textContent).toContain('09:00 - 10:00');
    expect(compiled.textContent).toContain('4 pessoas');
  });

  it('should show the error when the login fails', async () => {
    const fixture = iniciar();
    await fixture.whenStable();

    fixture.componentInstance.entrar({ email: 'mock@fourscheduler.local', senha: 'errada' });

    const login = httpMock.expectOne((requisicao) => requisicao.url.includes('/auth/login'));
    login.flush(
      { status: 401, message: 'Usuário inexistente ou senha inválida.' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.logado()).toBe(false);
    expect(compiled.textContent).toContain('Usuário inexistente ou senha inválida.');
  });

  it('should show the skeleton while the list loads', () => {
    logar();
    const fixture = iniciar();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.meus-agendamentos__lista')).toBeTruthy();
    expect(compiled.querySelectorAll('app-skeleton').length).toBe(15);
    expect(compiled.querySelector('[role="status"]')?.getAttribute('aria-label')).toContain(
      'agendamentos',
    );

    chamadaDeLista().flush([]);
  });

  it('should show the empty state for a logged user without bookings', async () => {
    logar();
    const fixture = iniciar();

    chamadaDeLista().flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-vazio')).toBeTruthy();
    expect(compiled.textContent).toContain('Nenhum agendamento por aqui');
  });

  it('should show the error state and retry the request', async () => {
    logar();
    const fixture = iniciar();

    chamadaDeLista().flush(
      { status: 500, message: 'Erro interno inesperado.' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-erro')).toBeTruthy();

    compiled.querySelector<HTMLButtonElement>('.botao')?.click();
    chamadaDeLista().flush([agendamento()]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.erro()).toBeNull();
    expect(compiled.querySelector('.meus-agendamentos__lista')).toBeTruthy();
  });

  it('should render the newest bookings first', async () => {
    logar();
    const fixture = iniciar();

    chamadaDeLista().flush([
      agendamento({ dataAgendamento: '2026-10-10', titulo: 'Antiga' }),
      agendamento({ dataAgendamento: '2026-10-25', titulo: 'Futura' }),
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const itens = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.meus-agendamentos__item',
    );
    expect(itens.length).toBe(2);
    expect(itens[0].textContent).toContain('Futura');
    expect(itens[1].textContent).toContain('Antiga');
  });
});
