import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Agendamento } from './agendamento';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorInterceptor } from '../../core/http/api-error';

describe('Agendamento', () => {
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Agendamento],
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

  function iniciar() {
    const fixture = TestBed.createComponent(Agendamento);
    fixture.detectChanges();
    return fixture;
  }

  function chamadaDeBusca() {
    return httpMock.expectOne((requisicao) => requisicao.url.includes('/api/salas/disponiveis'));
  }

  function responder(salas: { id: number; nome: string }[]) {
    const chamada = chamadaDeBusca();
    expect(chamada.request.method).toBe('GET');
    chamada.flush(
      salas.map((sala) => ({
        ...sala,
        disponivel: true,
        capacidade: 6,
        localizacao: 'Tamboré',
      })),
    );
  }

  it('should create the component', () => {
    const fixture = iniciar();
    expect(fixture.componentInstance).toBeTruthy();
    expect(chamadaDeBusca().request.method).toBe('GET');
  });

  it('should render the page title', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Escolha uma sala');
  });

  it('should render one button per room', async () => {
    const fixture = iniciar();
    responder([{ id: 3, nome: 'Sala Comp 02' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    const salas = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button.sala',
    );
    expect(salas.length).toBe(8);
    expect(Array.from(salas).filter((sala) => !sala.disabled).length).toBe(1);
  });

  it('should show the empty state when no room is free', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-vazio')).toBeTruthy();
  });

  it('should show the error state when the API fails', async () => {
    const fixture = iniciar();
    chamadaDeBusca().flush(
      { status: 500, message: 'Erro interno inesperado.' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-erro')).toBeTruthy();
  });

  it('should log in through the panel credentials', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();

    fixture.componentInstance.entrar({ email: 'mock@fourscheduler.local', senha: 'mock123' });

    const chamada = httpMock.expectOne((requisicao) => requisicao.url.includes('/auth/login'));
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toEqual({
      email: 'mock@fourscheduler.local',
      password: 'mock123',
    });
    chamada.flush('token.jwt');
    await fixture.whenStable();

    expect(fixture.componentInstance.logado()).toBe(true);
    expect(fixture.componentInstance.erroLogin()).toBeNull();
  });

  it('should show an error when the login fails', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();

    fixture.componentInstance.entrar({ email: 'mock@fourscheduler.local', senha: 'errada' });

    const chamada = httpMock.expectOne((requisicao) => requisicao.url.includes('/auth/login'));
    chamada.flush(
      { status: 401, message: 'Usuário inexistente ou senha inválida.' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.logado()).toBe(false);
    expect(fixture.componentInstance.erroLogin()).toContain('Usuário inexistente ou senha inválida.');
  });

  it('should confirm the booking and show the success screen', async () => {
    const fixture = iniciar();
    responder([{ id: 3, nome: 'Sala Comp 02' }]);
    await fixture.whenStable();

    auth['iniciarSessao']('token.jwt', 'mock@fourscheduler.local');
    fixture.componentInstance.selecionar('Sala Comp 02');
    fixture.componentInstance.confirmar();

    const chamada = httpMock.expectOne((requisicao) => requisicao.url.includes('/api/agendamento'));
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body.salaId).toEqual({ id: 3 });
    chamada.flush({
      id: 9,
      sala: { id: 3, nome: 'Sala Comp 02', disponivel: true, capacidade: 6, localizacao: 'Tamboré' },
      inicio: '09:00:00',
      fim: '10:00:00',
      status: 'CONFIRMADO',
      solicitante: null,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.reserva()?.id).toBe(9);
    expect(compiled.querySelector('.agendamento__sucesso')).toBeTruthy();
    expect(compiled.textContent).toContain('Reserva confirmada');
    expect(compiled.textContent).toContain('Sala Comp 02');
  });

  it('should show the failure screen when the room was taken', async () => {
    const fixture = iniciar();
    responder([{ id: 3, nome: 'Sala Comp 02' }]);
    await fixture.whenStable();

    auth['iniciarSessao']('token.jwt', 'mock@fourscheduler.local');
    fixture.componentInstance.selecionar('Sala Comp 02');
    fixture.componentInstance.confirmar();

    const chamada = httpMock.expectOne((requisicao) => requisicao.url.includes('/api/agendamento'));
    chamada.flush(
      { status: 400, message: 'Sala indispovivel para reserva.' },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.reserva()).toBeNull();
    expect(fixture.componentInstance.erroConfirmacao()).toContain('Sala indispovivel');
    expect(compiled.querySelector('.agendamento__falha')).toBeTruthy();
    expect(compiled.textContent).toContain('Reserva não confirmada');
    expect(compiled.textContent).toContain('Sala indispovivel para reserva.');
    expect(compiled.querySelector('app-mapa-salas')).toBeNull();
  });

  it('should clear the failure and search again on retry', async () => {
    const fixture = iniciar();
    responder([{ id: 3, nome: 'Sala Comp 02' }]);
    await fixture.whenStable();

    auth['iniciarSessao']('token.jwt', 'mock@fourscheduler.local');
    fixture.componentInstance.selecionar('Sala Comp 02');
    fixture.componentInstance.confirmar();

    httpMock
      .expectOne((requisicao) => requisicao.url.includes('/api/agendamento'))
      .flush(
        { status: 400, message: 'Sala indispovivel para reserva.' },
        { status: 400, statusText: 'Bad Request' },
      );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const botao = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (elemento) => elemento.textContent?.includes('Tentar novamente'),
    );
    botao?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.erroConfirmacao()).toBeNull();
    responder([{ id: 3, nome: 'Sala Comp 02' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(compiled.querySelector('app-mapa-salas')).toBeTruthy();
  });
});
