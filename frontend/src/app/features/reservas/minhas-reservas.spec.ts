import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { MinhasReservas } from './minhas-reservas';
import { Reserva } from '../../core/models/api.models';
import { apiErrorInterceptor } from '../../core/http/api-error';
import { authInterceptor } from '../../core/http/auth-interceptor';
import { ToastService } from '../../shared/toast/toast';
import { environment } from '../../../environments/environment';

/** Rota usada apenas para o teste do botão de voltar. */
@Component({ template: '' })
class TelaAgendamentoStub {}

describe('MinhasReservas', () => {
  let httpMock: HttpTestingController;

  const urlBusca = `${environment.apiUrl}/api/agendamento/busca/filtro`;
  const urlBase = `${environment.apiUrl}/api/agendamento/cancelar`;

  /** A busca agora vai com query params; casamos pela URL base. */
  function esperarBusca() {
    return httpMock.expectOne((requisicao) => requisicao.url === urlBusca);
  }

  const reservaFutura: Reserva = {
    id: 77,
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
        provideRouter([{ path: 'agendamento', component: TelaAgendamentoStub }]),
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
    esperarBusca().flush([]);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should search only the authenticated user reservations on init', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();

    const chamada = esperarBusca();
    expect(chamada.request.method).toBe('GET');
    expect(chamada.request.params.get('todosUsuarios')).toBe('false');
    expect(chamada.request.body).toBeNull();
    chamada.flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Sala Focus');
    expect(compilado.textContent).toContain('Tamboré');
    expect(compilado.querySelector('.minhas-reservas__cabecalho .eyebrow')).toBeNull();
    expect(compilado.textContent).toContain('Confirmada');
  });

  it('should show time, people and location in a single meta line', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush([{ ...reservaFutura, qntdPessoas: 1 }]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('09:00 às 10:00');
    expect(compilado.textContent).toContain('1 pessoa · Tamboré');

    // O bloco antigo de dados com rótulos em caixa alta foi removido.
    expect(compilado.querySelector('.minhas-reservas__dados')).toBeFalsy();
  });

  it('should show a reservation when the API uses sala instead of salaId', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();

    const { salaId, ...reservaSemSalaId } = reservaFutura;
    esperarBusca().flush([{ ...reservaSemSalaId, sala: salaId }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sala Focus');
  });

  it('should not ask the user to log in', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('.minhas-reservas__login')).toBeFalsy();
    expect(compilado.querySelector('input[type="password"]')).toBeFalsy();
  });

  it('should render only future reservations by default and switch to past ones', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura, reservaPassada]);
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

  it('should number future reservations in chronological order', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();

    // A API devolve fora de ordem; a tela deve ordenar e numerar 1º, 2º...
    esperarBusca().flush([
      { ...reservaFutura, dataAgendamento: '2099-11-05', titulo: 'Segunda reunião' },
      { ...reservaFutura, dataAgendamento: '2099-10-20', titulo: 'Primeira reunião' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    const cartoes = compilado.querySelectorAll('.minhas-reservas__cartao');
    expect(cartoes.length).toBe(2);

    const seloPrimeira = cartoes[0].querySelector('.minhas-reservas__ordem');
    const seloSegunda = cartoes[1].querySelector('.minhas-reservas__ordem');
    expect(seloPrimeira?.textContent?.trim()).toBe('1º');
    expect(seloSegunda?.textContent?.trim()).toBe('2º');
    expect(seloPrimeira?.getAttribute('aria-label')).toBe('Reserva de número 1');

    const textos = [...cartoes].map((cartao) => cartao.textContent ?? '');
    expect(textos[0]).toContain('Primeira reunião');
    expect(textos[1]).toContain('Segunda reunião');
  });

  it('should not number past reservations', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    esperarBusca().flush([reservaPassada, { ...reservaPassada, dataAgendamento: '2019-05-10' }]);
    await fixture.whenStable();

    componente.trocarFiltro('passadas');
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelectorAll('.minhas-reservas__cartao').length).toBe(2);
    expect(compilado.querySelector('.minhas-reservas__ordem')).toBeNull();
  });

  it('should show the status beside the room name and keep the cancel action alone', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    const nomeLinha = compilado.querySelector('.minhas-reservas__nomeLinha');
    expect(nomeLinha?.querySelector('.minhas-reservas__sala')?.textContent).toContain('Sala Focus');
    expect(nomeLinha?.querySelector('.minhas-reservas__status')?.textContent?.trim()).toBe(
      'Confirmada',
    );

    // O selo de status saiu da coluna de ações; ali ficam só os botões.
    const acoes = compilado.querySelector('.minhas-reservas__acoes');
    expect(acoes?.querySelector('.minhas-reservas__status')).toBeNull();
    expect(acoes?.querySelectorAll('button').length).toBe(1);
    expect(acoes?.querySelector('.minhas-reservas__acao--cancelar')).toBeTruthy();
  });

  it('should ask for confirmation before cancelling and then call the cancel endpoint', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    const botaoCancelar = compilado.querySelector<HTMLButtonElement>(
      '.minhas-reservas__acao--cancelar',
    );
    expect(botaoCancelar).toBeTruthy();

    // Sem confirmação ainda não há chamada de cancelamento.
    botaoCancelar?.click();
    fixture.detectChanges();
    expect(compilado.querySelector('.minhas-reservas__confirmacao')).toBeTruthy();

    const botaoConfirmar = compilado.querySelector<HTMLButtonElement>(
      '.minhas-reservas__acao--perigo',
    );
    botaoConfirmar?.click();
    fixture.detectChanges();

    const chamadaCancelamento = httpMock.expectOne(
      (requisicao) => requisicao.url === `${urlBase}/77` && requisicao.method === 'DELETE',
    );
    chamadaCancelamento.flush(null);
    await fixture.whenStable();

    expect(TestBed.inject(ToastService).toasts()[0].titulo).toBe('Reserva cancelada');

    // A lista é recarregada depois do cancelamento.
    esperarBusca().flush([]);
    await fixture.whenStable();
  });

  it('should keep the reservation and close the confirmation when the user gives up', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    compilado.querySelector<HTMLButtonElement>('.minhas-reservas__acao--cancelar')?.click();
    fixture.detectChanges();

    compilado.querySelector<HTMLButtonElement>('.minhas-reservas__acao--manter')?.click();
    fixture.detectChanges();

    expect(compilado.querySelector('.minhas-reservas__confirmacao')).toBeNull();
    expect(compilado.querySelector('.minhas-reservas__acao--cancelar')).toBeTruthy();
    httpMock.expectNone((requisicao) => requisicao.url === `${urlBase}/77`);
  });

  it('should show an error toast and keep the list when the cancel fails', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    compilado.querySelector<HTMLButtonElement>('.minhas-reservas__acao--cancelar')?.click();
    fixture.detectChanges();
    compilado.querySelector<HTMLButtonElement>('.minhas-reservas__acao--perigo')?.click();
    fixture.detectChanges();

    httpMock
      .expectOne((requisicao) => requisicao.url === `${urlBase}/77`)
      .flush(
        { status: 403, message: 'Você não pode cancelar esta reserva.' },
        { status: 403, statusText: 'Forbidden' },
      );
    await fixture.whenStable();

    const toast = TestBed.inject(ToastService).toasts()[0];
    expect(toast.titulo).toBe('Não foi possível cancelar');
    expect(toast.mensagem).toBe('Você não pode cancelar esta reserva.');
    expect(compilado.querySelector('.minhas-reservas__confirmacao')).toBeNull();
  });
  it('should send the status filter to the backend and keep only that status', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    componente.trocarStatus({ target: { value: 'CANCELADO' } } as unknown as Event);
    await fixture.whenStable();

    const chamada = esperarBusca();
    expect(chamada.request.params.get('statusAgendamento')).toBe('CANCELADO');
    expect(chamada.request.params.get('dataInicio')).toBeNull();
    chamada.flush([{ ...reservaFutura, id: 88, status: 'CANCELADO', titulo: 'Reunião cancelada' }]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Reunião cancelada');
    expect(compilado.textContent).toContain('Cancelada');
  });

  it('should send the custom period to the backend and take it over the future/past selector', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    esperarBusca().flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    componente.trocarData('inicio', { target: { value: '2026-11-01' } } as unknown as Event);
    await fixture.whenStable();

    const chamada = esperarBusca();
    expect(chamada.request.params.get('dataInicio')).toBe('2026-11-01');
    expect(chamada.request.params.get('dataFinal')).toBeNull();
    // Uma reserva passada volta porque o backend é quem recorta por data.
    chamada.flush([reservaPassada]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.textContent).toContain('Reunião encerrada');

    // O seletor Futuras/Passadas recua enquanto o período estiver preenchido.
    const botoes = compilado.querySelectorAll<HTMLButtonElement>('.minhas-reservas__filtro');
    expect(botoes[0].disabled).toBe(true);
    expect(botoes[1].disabled).toBe(true);

    // E a numeração não aparece no período personalizado.
    expect(compilado.querySelector('.minhas-reservas__ordem')).toBeNull();
  });

  it('should keep the cancel button for future reservations inside a custom period', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    esperarBusca().flush([]);
    await fixture.whenStable();

    componente.trocarData('inicio', { target: { value: '2099-01-01' } } as unknown as Event);
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    // Sem numeral, mas com o botão: cancelar depende da data, não da numeração.
    expect(compilado.querySelector('.minhas-reservas__ordem')).toBeNull();
    expect(compilado.querySelector('.minhas-reservas__acao--cancelar')).toBeTruthy();
  });

  it('should not search while the initial date is after the final one', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    esperarBusca().flush([]);
    await fixture.whenStable();

    componente.trocarData('inicio', { target: { value: '2026-12-31' } } as unknown as Event);
    await fixture.whenStable();
    esperarBusca().flush([]);
    await fixture.whenStable();

    componente.trocarData('fim', { target: { value: '2026-01-01' } } as unknown as Event);
    fixture.detectChanges();

    expect(componente.periodoInvalido()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'A data inicial não pode ser posterior à data final.',
    );
    // Nenhuma nova chamada depois do período inválido.
    httpMock.expectNone((requisicao) => requisicao.url === urlBusca);
  });

  it('should clear the filters and search again without parameters', async () => {
    const fixture = criarFixture();
    const componente = fixture.componentInstance;
    await fixture.whenStable();
    esperarBusca().flush([]);
    await fixture.whenStable();

    componente.trocarStatus({ target: { value: 'CONFIRMADO' } } as unknown as Event);
    await fixture.whenStable();
    esperarBusca().flush([reservaFutura]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('.minhas-reservas__limpar')).toBeTruthy();

    componente.limparFiltros();
    await fixture.whenStable();

    const chamada = esperarBusca();
    expect(chamada.request.params.get('statusAgendamento')).toBeNull();
    expect(chamada.request.params.get('dataInicio')).toBeNull();
    expect(chamada.request.params.get('dataFinal')).toBeNull();
    chamada.flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compilado.querySelector('.minhas-reservas__limpar')).toBeNull();
  });

  it('should show the empty state when the API returns items that are not reservations', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca()
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
    esperarBusca().flush([]);
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
    esperarBusca().flush(
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

  it('should show a button that goes back to the scheduling page', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const compilado = fixture.nativeElement as HTMLElement;
    const botao = compilado.querySelector<HTMLButtonElement>('.minhas-reservas__voltar');
    expect(botao).toBeTruthy();
    expect(botao?.textContent).toContain('Voltar');

    botao?.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/agendamento');
  });

  it('should show a friendly message when the session is not authenticated', async () => {
    const fixture = criarFixture();
    await fixture.whenStable();
    esperarBusca().flush(
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
