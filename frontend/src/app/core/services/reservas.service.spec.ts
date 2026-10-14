import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BuscaReservasRequest, Reserva } from '../models/api.models';
import { environment } from '../../../environments/environment';
import { ReservasService } from './reservas.service';

describe('ReservasService', () => {
  let service: ReservasService;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/api/agendamento/busca/filtro`;

  const requisicao: BuscaReservasRequest = {
    dataInicio: null,
    dataFinal: null,
    statusAgendamento: null,
    todosUsuarios: false,
  };

  const reserva: Reserva = {
    salaId: { id: 1, nome: 'Sala Focus', capacidade: 2, localizacao: 'Tamboré' },
    dataAgendamento: '2026-10-20',
    dataCriacao: '2026-10-14T10:15:00',
    horaInicio: '09:00:00',
    horaFim: '10:00:00',
    qntdPessoas: 2,
    titulo: 'Reunião de alinhamento',
    status: 'CONFIRMADO',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ReservasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post the booking to the real agendamento endpoint', () => {
    const criacao = {
      salaId: { id: 2 },
      data: '2026-10-20',
      horaInicio: '14:00',
      horaFim: '15:00',
      qntdPessoas: 4,
      titulo: 'Reunião de planejamento',
    };

    let resposta: unknown;
    service.confirmar(criacao).subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/agendamento`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toEqual(criacao);

    chamada.flush({
      id: 1,
      sala: { id: 2, nome: 'Sala 02' },
      inicio: '14:00:00',
      fim: '15:00:00',
      status: 'CONFIRMADO',
      solicitante: { id: 3, nome: 'Usuario Teste Um', email: 'usuario@teste.com' },
    });

    expect(resposta).toEqual({
      id: 1,
      sala: { id: 2, nome: 'Sala 02' },
      inicio: '14:00:00',
      fim: '15:00:00',
      status: 'CONFIRMADO',
      solicitante: { id: 3, nome: 'Usuario Teste Um', email: 'usuario@teste.com' },
    });
  });

  it('should search the authenticated user reservations with a GET body', () => {
    const esperadas: Reserva[] = [reserva];

    service.buscarFiltradas(requisicao).subscribe((respostas) => {
      expect(respostas).toEqual(esperadas);
    });

    const chamada = httpMock.expectOne(url);
    expect(chamada.request.method).toBe('GET');
    expect(chamada.request.body).toEqual(requisicao);
    chamada.flush(esperadas);
  });

  it('should propagate backend failures', () => {
    let erroRecebido: unknown;

    service.buscarFiltradas(requisicao).subscribe({
      error: (erro: unknown) => (erroRecebido = erro),
    });

    const chamada = httpMock.expectOne(url);
    chamada.flush(
      { status: 401, message: 'Faça login para continuar.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(erroRecebido).toBeInstanceOf(HttpErrorResponse);
    expect((erroRecebido as HttpErrorResponse).status).toBe(401);
  });
});
