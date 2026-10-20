import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConversasService } from './conversas.service';
import { OrquestradorResposta } from '../models/api.models';
import { environment } from '../../../environments/environment';

describe('ConversasService', () => {
  let service: ConversasService;
  let httpMock: HttpTestingController;

  const urlBase = `${environment.apiUrl}/api/agendamento/conversas`;

  const respostaOrquestrador: OrquestradorResposta = {
    conversaId: 7,
    estado: 'AGUARDANDO_ESCOLHA',
    mensagem: 'Encontrei algumas salas disponíveis. Qual você prefere?',
    sugestoes: [{ salaId: 2, nome: 'Sala 02', capacidade: 4, localizacao: 'Tamboré' }],
    data: '2026-10-20',
    horaInicio: '14:00:00',
    horaFim: '15:00:00',
    qntdPessoas: 4,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ConversasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start a conversation', () => {
    let resposta: unknown;
    service.iniciar().subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(urlBase);
    expect(chamada.request.method).toBe('POST');
    chamada.flush({ conversaId: 7, status: 'RECEBENDO_SOLICITACAO' });

    expect(resposta).toEqual({ conversaId: 7, status: 'RECEBENDO_SOLICITACAO' });
  });

  it('should send the message with the conversation id', () => {
    let resposta: unknown;
    service.enviarMensagem(7, 'sala para 4 amanhã às 14h').subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${urlBase}/mensagens`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toEqual({
      conversaId: 7,
      mensagem: 'sala para 4 amanhã às 14h',
    });
    chamada.flush(respostaOrquestrador);

    expect(resposta).toEqual(respostaOrquestrador);
  });

  it('should select the room with PATCH', () => {
    let resposta: unknown;
    service.selecionarSala(7, 2).subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${urlBase}/7/selecionar`);
    expect(chamada.request.method).toBe('PATCH');
    expect(chamada.request.body).toEqual({ salaId: 2 });
    chamada.flush(respostaOrquestrador);

    expect(resposta).toEqual(respostaOrquestrador);
  });

  it('should confirm the booking', () => {
    let resposta: unknown;
    service.confirmar(7).subscribe((valor) => (resposta = valor));

    const chamada = httpMock.expectOne(`${urlBase}/7/confirmar`);
    expect(chamada.request.method).toBe('POST');
    chamada.flush({
      ...respostaOrquestrador,
      estado: 'CONFIRMADO',
      mensagem: 'Agendamento realizado com sucesso!',
      sugestoes: [],
    });

    expect(resposta).toMatchObject({ estado: 'CONFIRMADO' });
  });

  it('should propagate backend failures', () => {
    let erroRecebido: unknown;

    service.enviarMensagem(7, 'sala').subscribe({
      error: (erro: unknown) => (erroRecebido = erro),
    });

    httpMock
      .expectOne(`${urlBase}/mensagens`)
      .flush(
        { status: 503, message: 'Não consegui interpretar o pedido.' },
        { status: 503, statusText: 'Service Unavailable' },
      );

    expect(erroRecebido).toMatchObject({ status: 503 });
  });
});
