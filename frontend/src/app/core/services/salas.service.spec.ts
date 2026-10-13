import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { SalasService } from './salas.service';
import { BuscaSalasRequest, Sala } from '../models/api.models';
import { environment } from '../../../environments/environment';

describe('SalasService', () => {
  let service: SalasService;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/api/salas/disponiveis`;

  const requisicao: BuscaSalasRequest = {
    data: '2026-10-10',
    horaInicio: '09:00',
    horaFim: '10:00',
    qntdPessoas: 6,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SalasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search available rooms with a GET body', () => {
    const esperadas: Sala[] = [
      {
        id: 1,
        nome: 'Sala Focus',
        disponivel: true,
        capacidade: 8,
        localizacao: 'Tamboré',
      },
    ];

    service.buscarDisponiveis(requisicao).subscribe((respostas) => {
      expect(respostas).toEqual(esperadas);
    });

    const chamada = httpMock.expectOne(url);
    expect(chamada.request.method).toBe('GET');
    expect(chamada.request.body).toEqual(requisicao);
    chamada.flush(esperadas);
  });

  it('should propagate backend failures', () => {
    let erroRecebido: unknown;

    service.buscarDisponiveis(requisicao).subscribe({
      error: (erro: unknown) => (erroRecebido = erro),
    });

    const chamada = httpMock.expectOne(url);
    chamada.flush(
      { status: 400, message: 'A data não pode estar no passado.' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(erroRecebido).toBeInstanceOf(HttpErrorResponse);
    expect((erroRecebido as HttpErrorResponse).status).toBe(400);
  });
});
