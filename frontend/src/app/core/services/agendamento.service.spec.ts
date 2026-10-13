import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoResumo, ConfirmacaoAgendamento, CriarAgendamentoRequest } from '../models/api.models';
import { environment } from '../../../environments/environment';

describe('AgendamentoService', () => {
  let service: AgendamentoService;
  let httpMock: HttpTestingController;

  const requisicao: CriarAgendamentoRequest = {
    salaId: { id: 2 },
    data: '2026-10-13',
    horaInicio: '09:00',
    horaFim: '10:00',
    qntdPessoas: 4,
    titulo: 'Reunião',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AgendamentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should confirm a booking via POST', () => {
    const confirmada: ConfirmacaoAgendamento = {
      id: 10,
      sala: { id: 2, nome: 'Sala Comp 01', disponivel: true, capacidade: 8, localizacao: 'Tamboré' },
      inicio: '09:00',
      fim: '10:00',
      status: 'CONFIRMADO',
      solicitante: { id: 1, email: 'mock@fourscheduler.local', nome: 'Usuário Mock', perfilUsuario: 'USER' },
    };

    let resposta!: ConfirmacaoAgendamento | null;
    service.confirmar(requisicao).subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/agendamento`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toEqual(requisicao);
    chamada.flush(confirmada);

    expect(resposta?.id).toBe(10);
    expect(resposta?.status).toBe('CONFIRMADO');
  });

  it('should list my bookings via GET', () => {
    const lista: AgendamentoResumo[] = [
      {
        salaId: { id: 2, nome: 'Sala Comp 01', disponivel: true, capacidade: 8, localizacao: 'Tamboré' },
        dataAgendamento: '2026-10-20',
        dataCriacao: '2026-10-12T18:00:00',
        horaInicio: '09:00:00',
        horaFim: '10:00:00',
        qntdPessoas: 4,
        titulo: 'Reunião',
        usuarioIdSolicitante: null,
        status: 'CONFIRMADO',
      },
    ];

    let resposta!: AgendamentoResumo[];
    service.listar().subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${environment.apiUrl}/api/agendamento/meus`);
    expect(chamada.request.method).toBe('GET');
    chamada.flush(lista);

    expect(resposta.length).toBe(1);
    expect(resposta[0].salaId.nome).toBe('Sala Comp 01');
  });
});
