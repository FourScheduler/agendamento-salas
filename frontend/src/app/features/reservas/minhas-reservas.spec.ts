import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MinhasReservas } from './minhas-reservas';
import { BuscaReservasRequest, Reserva } from '../../core/models/api.models';
import { apiErrorInterceptor } from '../../core/http/api-error';
import { authInterceptor } from '../../core/http/auth-interceptor';
import { environment } from '../../../environments/environment';

describe('MinhasReservas', () => {
  let httpMock: HttpTestingController;

  const urlBusca = `${environment.apiUrl}/api/agendamento/busca/filtro`;

  const requisicaoEsperada: BuscaReservasRequest = {
    dataInicio: null,
    dataFinal: null,
    statusAgendamento: null,
    todosUsuarios: false,
  };

  const reservaFutura: Reserva = {
    salaId: { id: 1, nome: 'Sala Focus', capacidade: 2, localizacao: 'Tamboré' },
    dataAgendamento: '2099-10-20',
    dataCriacao: '2026-10-14T10:15:00',
    horaInicio: '09:00:00',
    horaFim: '10:00:00',
    qntdPessoas: 2,
    titulo: 'Reunião de alinhamento',
    status: 'CONFIRMADO',
  };

  const reservaPassada: Reserva = {
    ...reservaFutura,
    dataAgendamento: '2020-10-20',
    titulo: 'Reunião encerrada',
    status: 'CANCELADO',
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [MinhasReservas],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function criarFixture() {
    return TestBed.createComponent(MinhasReservas);
  }

  it('should create', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    httpMock.expectOne(urlBusca).flush([]);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should search only the authenticated user reservations on init', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();

    const chamada = httpMock.expectOne(urlBusca);
    expect(chamada.request.method).toBe('GET');
    expect(chamada.request.body).toEqual(requisicaoEsperada);
    chamada.flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Sala Focus');
    expect(compilado.textContent).toContain('Tamboré');
    expect(compilado.textContent).toContain('Confirmada');
  });

  it('should show a reservation when the API uses sala instead of salaId', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();

    const { salaId, ...reservaSemSalaId } = reservaFutura;
    httpMock.expectOne(urlBusca).flush([{ ...reservaSemSalaId, sala: salaId }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sala Focus');
  });

  it('should not ask the user to log in', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    httpMock.expectOne(urlBusca).flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('.minhas-reservas__login')).toBeFalsy();
    expect(compilado.querySelector('input')).toBeFalsy();
  });

  it('should render only future reservations by default and switch to past ones', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    httpMock.expectOne(urlBusca).flush([reservaFutura, reservaPassada]);
    await fixture.whenStable();
    fixture.detectChanges();

    let compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Reunião de alinhamento');
    expect(compilado.textContent).not.toContain('Reunião encerrada');

    componente.trocarFiltro('passadas');
    fixture.detectChanges();

    compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Reunião encerrada');
    expect(compilado.textContent).not.toContain('Reunião de alinhamento');
  });

  it('should show the empty state when the API returns items that are not reservations', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    httpMock
      .expectOne(urlBusca)
      .flush([{ id: 1, nome: 'Sala Focus', capacidade: 2, localizacao: 'Tamboré' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('app-vazio')).toBeTruthy();
    expect(compilado.textContent).toContain('Nenhuma reserva encontrada');
  });

  it('should show the same empty state in both filters when there are no reservations', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    httpMock.expectOne(urlBusca).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    let compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('app-vazio')).toBeTruthy();
    expect(compilado.textContent).toContain('Nenhuma reserva encontrada');

    componente.trocarFiltro('passadas');
    fixture.detectChanges();

    compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('app-vazio')).toBeTruthy();
    expect(compilado.textContent).toContain('Nenhuma reserva encontrada');
  });

  it('should show the error state when the backend fails', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    httpMock.expectOne(urlBusca).flush(
      { status: 500, message: 'Erro interno inesperado. Tente novamente.' },
      {
        status: 500,
        statusText: 'Server Error',
      },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('app-erro')).toBeTruthy();
    expect(compilado.textContent).toContain('Erro interno inesperado. Tente novamente.');
  });

  it('should show a friendly message when the session is not authenticated', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    httpMock.expectOne(urlBusca).flush(
      { status: 401, message: 'Faça login para continuar.' },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('app-erro')).toBeTruthy();
    expect(compilado.textContent).toContain('Faça login para continuar.');
  });
});
