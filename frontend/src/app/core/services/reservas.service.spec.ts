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

  it('should post the booking to the real agendamento endpoint', () => {
    const requisicao = {
      salaId: { id: 2 },
      data: '2026-10-20',
      horaInicio: '14:00',
      horaFim: '15:00',
      qntdPessoas: 4,
      titulo: 'Reunião de planejamento',
    };

    let resposta: unknown;
    service.confirmar(requisicao).subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/agendamento`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toEqual(requisicao);

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
});
