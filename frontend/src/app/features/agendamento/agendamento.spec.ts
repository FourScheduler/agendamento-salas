import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Agendamento } from './agendamento';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorInterceptor } from '../../core/http/api-error';
import { authInterceptor } from '../../core/http/auth-interceptor';
import { RespostaAssistente } from '../../shared/assistente-ia/assistente-ia';
import { environment } from '../../../environments/environment';

function aguardarMicrotarefas(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function entrarDemo(httpMock: HttpTestingController): Promise<void> {
  const login = TestBed.inject(AuthService).entrar('Kevin Miranda');
  httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush('token-jwt-123');
  await aguardarMicrotarefas();
  httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush({
    id: 3,
    nome: 'Usuario Teste Um',
    email: 'usuario@teste.com',
  });
  await login;
}

describe('Agendamento', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Agendamento],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
  });

  function iniciar() {
    const fixture = TestBed.createComponent(Agendamento);
    // Fixa um horário válido: proximaHoraCheia() usa o relógio real e, perto do fim do
    // dia, a validação de fimDeJornada aborta a busca antes de qualquer requisição.
    fixture.componentInstance.horaInicio.set('09:00');
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

    await entrarDemo(httpMock);

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
    expect(texto).toContain('nº 1 · CONFIRMADO');
    expect(fixture.componentInstance.confirmacao()).toContain('Reserva confirmada');

    responder([]);
    await fixture.whenStable();
    expect(fixture.componentInstance.selecionada()).toBeNull();
  });

  it('should confirm using the selected room when the response has no room details', async () => {
    const fixture = iniciar();
    responder([{ id: 2, nome: 'Sala 02' }]);
    await fixture.whenStable();

    fixture.componentInstance.selecionar('Sala 02');

    await entrarDemo(httpMock);

    const promessa = fixture.componentInstance.confirmarReserva();
    httpMock.expectOne(`${environment.apiUrl}/api/agendamento`).flush({
      id: 1,
      inicio: `${fixture.componentInstance.horaInicio()}:00`,
      fim: '15:00:00',
      status: 'CONFIRMADO',
      solicitante: null,
    });

    expect(await promessa).toContain('Reserva confirmada para Sala 02');

    responder([]);
    await fixture.whenStable();
  });

  it('should ask for login in the assistant when unauthenticated', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();

    const resposta =
      await fixture.componentInstance.processarMensagemAssistente('sala para 4 pessoas');

    expect(resposta.texto).toContain('Faça login');
    expect(httpMock.match(`${environment.apiUrl}/api/agendamento/conversas`).length).toBe(0);
  });

  it('should interpret, suggest rooms and confirm through the conversation', async () => {
    const fixture = iniciar();
    responder([{ id: 2, nome: 'Sala 02' }]);
    await fixture.whenStable();

    await entrarDemo(httpMock);

    const promessa =
      fixture.componentInstance.processarMensagemAssistente('sala para 4 pessoas amanhã às 14h');

    httpMock
      .expectOne(`${environment.apiUrl}/api/agendamento/conversas`)
      .flush({ conversaId: 7, status: 'RECEBENDO_SOLICITACAO' });
    await aguardarMicrotarefas();

    const chamadaMensagem = httpMock.expectOne(
      `${environment.apiUrl}/api/agendamento/conversas/mensagens`,
    );
    expect(chamadaMensagem.request.method).toBe('POST');
    expect(chamadaMensagem.request.body).toEqual({
      conversaId: 7,
      mensagem: 'sala para 4 pessoas amanhã às 14h',
    });
    chamadaMensagem.flush({
      conversaId: 7,
      estado: 'AGUARDANDO_ESCOLHA',
      mensagem: 'Encontrei algumas salas disponíveis. Qual você prefere?',
      sugestoes: [{ salaId: 2, nome: 'Sala 02', capacidade: 4, localizacao: 'Tamboré' }],
      data: '2026-10-20',
      horaInicio: '14:00:00',
      horaFim: '15:00:00',
      qntdPessoas: 4,
    });
    await aguardarMicrotarefas();

    const resposta = await promessa;
    // A interpretação sincroniza o painel e recarrega o mapa.
    responder([{ id: 2, nome: 'Sala 02' }]);

    expect(fixture.componentInstance.data()).toBe('2026-10-20');
    expect(fixture.componentInstance.horaInicio()).toBe('14:00');
    expect(fixture.componentInstance.duracao()).toBe(60);
    expect(fixture.componentInstance.pessoas()).toBe(4);

    const acaoSala = resposta.acoes?.find((item) => item.rotulo === 'Sala 02 · 4 pessoas');
    expect(acaoSala).toBeTruthy();

    const promessaSelecao = acaoSala?.aoClicar?.() as Promise<RespostaAssistente>;
    const chamadaSelecao = httpMock.expectOne(
      `${environment.apiUrl}/api/agendamento/conversas/7/selecionar`,
    );
    expect(chamadaSelecao.request.method).toBe('PATCH');
    expect(chamadaSelecao.request.body).toEqual({ salaId: 2 });
    chamadaSelecao.flush({
      conversaId: 7,
      estado: 'AGUARDANDO_CONFIRMACAO',
      mensagem: 'Você escolheu a sala Sala 02. Deseja confirmar o agendamento?',
      sugestoes: [],
      data: '2026-10-20',
      horaInicio: '14:00:00',
      horaFim: '15:00:00',
      qntdPessoas: 4,
    });

    const respostaSelecao = await promessaSelecao;
    expect(fixture.componentInstance.selecionada()).toBe('Sala 02');

    const acaoConfirmar = respostaSelecao.acoes?.find(
      (item) => item.rotulo === 'Confirmar agendamento',
    );
    expect(acaoConfirmar?.primaria).toBe(true);

    const promessaConfirmacao = acaoConfirmar?.aoClicar?.() as Promise<RespostaAssistente>;
    httpMock
      .expectOne(`${environment.apiUrl}/api/agendamento/conversas/7/confirmar`)
      .flush({
        conversaId: 7,
        estado: 'CONFIRMADO',
        mensagem: 'Agendamento realizado com sucesso!',
        sugestoes: [],
        data: '2026-10-20',
        horaInicio: '14:00:00',
        horaFim: '15:00:00',
        qntdPessoas: 4,
      });
    await aguardarMicrotarefas();

    // A confirmação recarrega o mapa com a sala já ocupada.
    responder([]);
    const respostaConfirmacao = await promessaConfirmacao;

    expect(respostaConfirmacao.texto).toContain('sucesso');
    await fixture.whenStable();
  });

  it('should show a friendly message when the conversation backend fails', async () => {
    const fixture = iniciar();
    responder([]);
    await fixture.whenStable();

    await entrarDemo(httpMock);

    const promessa =
      fixture.componentInstance.processarMensagemAssistente('sala para 4 pessoas');

    httpMock
      .expectOne(`${environment.apiUrl}/api/agendamento/conversas`)
      .flush({ conversaId: 7, status: 'RECEBENDO_SOLICITACAO' });
    await aguardarMicrotarefas();

    httpMock
      .expectOne(`${environment.apiUrl}/api/agendamento/conversas/mensagens`)
      .flush(
        { status: 503, message: 'Não consegui interpretar o pedido agora.' },
        { status: 503, statusText: 'Service Unavailable' },
      );

    const resposta = await promessa;
    expect(resposta.texto).toContain('Não consegui interpretar o pedido agora.');
  });
});
