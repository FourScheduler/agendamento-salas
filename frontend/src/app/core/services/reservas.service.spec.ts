import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { ReservasService } from './reservas.service';

describe('ReservasService', () => {
  let service: ReservasService;
  let httpMock: HttpTestingController;

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

  it('should post the reservation to the mock endpoint', () => {
    const requisicao = {
      salaId: 7,
      sala: 'Sala 02',
      data: '2026-10-20',
      horaInicio: '14:00',
      horaFim: '15:00',
      quantidadePessoas: 4,
      solicitante: 'Kevin Miranda',
      titulo: 'Reunião de planejamento',
    };

    let resposta: unknown;
    service.confirmar(requisicao).subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/reservas`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toEqual(requisicao);

    chamada.flush({
      id: 1,
      sala: 'Sala 02',
      inicio: '2026-10-20T14:00:00',
      fim: '2026-10-20T15:00:00',
      status: 'CONFIRMADA',
      solicitante: 'Kevin Miranda',
    });

    expect(resposta).toEqual({
      id: 1,
      sala: 'Sala 02',
      inicio: '2026-10-20T14:00:00',
      fim: '2026-10-20T15:00:00',
      status: 'CONFIRMADA',
      solicitante: 'Kevin Miranda',
    });
  });
});
