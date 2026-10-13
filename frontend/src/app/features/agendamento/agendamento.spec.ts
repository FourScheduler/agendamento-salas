import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Agendamento } from './agendamento';

describe('Agendamento', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Agendamento],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
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

  it('should render one button per room', async () => {
    const fixture = iniciar();
    responder([{ id: 3, nome: 'Sala Comp 02' }]);
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
});
