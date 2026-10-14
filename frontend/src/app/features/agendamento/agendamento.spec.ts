import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Agendamento } from './agendamento';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

describe('Agendamento', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Agendamento],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
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

  it('should render the floating assistant', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-assistente-ia .ai-assistant')).toBeTruthy();
  });

  it('should render one button per room', async () => {
    const fixture = iniciar();
    responder([{ id: 6, nome: 'Componivel 02' }]);
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

  it('should ask for login when confirming the reservation while unauthenticated', async () => {
    const fixture = iniciar();
    responder([{ id: 2, nome: 'Sala 02' }]);
    await fixture.whenStable();

    fixture.componentInstance.selecionar('Sala 02');
    const texto = await fixture.componentInstance.confirmarReserva();

    expect(texto).toContain('Faça login');
    expect(httpMock.match(`${environment.apiUrl}/api/agendamento`).length).toBe(0);
  });

  it('should create the reservation when authenticated and refresh the map', async () => {
    const fixture = iniciar();
    responder([{ id: 2, nome: 'Sala 02' }]);
    await fixture.whenStable();

    fixture.componentInstance.selecionar('Sala 02');

    const login = TestBed.inject(AuthService).entrar('Kevin Miranda');
    httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush('token-jwt-123');
    await login;

    const promessa = fixture.componentInstance.confirmarReserva();

    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/agendamento`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toMatchObject({
      salaId: { id: 2 },
      qntdPessoas: 1,
      titulo: 'Reunião - Sala 02',
    });

    chamada.flush({
      id: 1,
      sala: { id: 2, nome: 'Sala 02' },
      inicio: `${fixture.componentInstance.horaInicio()}:00`,
      fim: '15:00:00',
      status: 'CONFIRMADO',
      solicitante: { id: 3, nome: 'Usuario Teste Um', email: 'usuario@teste.com' },
    });

    const texto = await promessa;
    expect(texto).toContain('Reserva confirmada para Sala 02');
    expect(fixture.componentInstance.confirmacao()).toContain('Reserva confirmada');

    responder([]);
    await fixture.whenStable();
    expect(fixture.componentInstance.selecionada()).toBeNull();
  });

  it('should reserve through the assistant action when signed in', async () => {
    const fixture = iniciar();
    responder([{ id: 2, nome: 'Sala 02' }]);
    await fixture.whenStable();

    fixture.componentInstance.selecionar('Sala 02');

    const login = TestBed.inject(AuthService).entrar('Kevin Miranda');
    httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush('token-jwt-123');
    await login;

    const resposta =
      await fixture.componentInstance.processarMensagemAssistente('sala para 4 pessoas');
    const acao = resposta.acoes?.find((item) => item.rotulo === 'Reservar');
    expect(acao).toBeTruthy();

    const promessa = acao?.aoClicar?.() as Promise<string>;
    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/agendamento`);
    chamada.flush({
      id: 2,
      sala: { id: 2, nome: 'Sala 02' },
      inicio: `${fixture.componentInstance.horaInicio()}:00`,
      fim: '15:00:00',
      status: 'CONFIRMADO',
      solicitante: { id: 3, nome: 'Usuario Teste Um', email: 'usuario@teste.com' },
    });

    expect(await promessa).toContain('Reserva confirmada');

    responder([]);
    await fixture.whenStable();
  });
});
