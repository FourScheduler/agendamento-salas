import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function aguardarMicrotarefas(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Responde o POST /auth/login com o token de teste. */
function responderLogin(httpMock: HttpTestingController, token = 'token-jwt-123') {
  const chamada = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
  expect(chamada.request.method).toBe('POST');
  chamada.flush(token);
}

/** Responde o GET /api/usuarios/me com o perfil informado. */
function responderPerfil(
  httpMock: HttpTestingController,
  perfil: Record<string, unknown> = {
    id: 3,
    nome: 'Usuario Teste Um',
    email: 'usuario@teste.com',
    perfilUsuario: 'USER',
  },
) {
  httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush(perfil);
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
  });

  it('should start unauthenticated when there is no saved session', () => {
    expect(service.autenticado()).toBe(false);
    expect(service.usuario()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.perfil()).toBeNull();
    expect(service.ehAdmin()).toBe(false);
  });

  it('should authenticate with email and password and persist the session', async () => {
    const promessa = service.entrar(' usuario@teste.com ', '123456');

    const login = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(login.request.body).toEqual({ email: 'usuario@teste.com', password: '123456' });
    login.flush('token-jwt-123');

    await aguardarMicrotarefas();
    responderPerfil(httpMock, {
      id: 3,
      nome: 'Usuario Teste Um',
      email: 'usuario@teste.com',
      perfilUsuario: 'USER',
    });

    await promessa;

    expect(service.autenticado()).toBe(true);
    expect(service.usuario()).toBe('Usuario Teste Um');
    expect(service.token()).toBe('token-jwt-123');
    expect(service.perfil()).toBe('USER');
    expect(window.localStorage.getItem('fourscheduler.usuario')).toBe('Usuario Teste Um');
    expect(window.localStorage.getItem('fourscheduler.token')).toBe('token-jwt-123');
  });

  it('should store the ADMIN profile after a successful login', async () => {
    const promessa = service.entrar('admin@teste.com', '123456');

    responderLogin(httpMock, 'token-admin');
    await aguardarMicrotarefas();
    responderPerfil(httpMock, {
      id: 1,
      nome: 'Administrador Principal',
      email: 'admin@teste.com',
      perfilUsuario: 'ADMIN',
    });

    await promessa;

    expect(service.usuario()).toBe('Administrador Principal');
    expect(service.perfil()).toBe('ADMIN');
    expect(service.ehAdmin()).toBe(true);
    expect(window.localStorage.getItem('fourscheduler.perfil')).toBe('ADMIN');
  });

  it('should fall back to the typed email when the profile cannot be loaded', async () => {
    const promessa = service.entrar('usuario@teste.com', '123456');

    responderLogin(httpMock);
    await aguardarMicrotarefas();
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush('erro', {
      status: 500,
      statusText: 'Internal Server Error',
    });

    await promessa;

    expect(service.autenticado()).toBe(true);
    expect(service.usuario()).toBe('usuario@teste.com');
    // Sem perfil vindo do backend, a sessão não pode se passar por admin.
    expect(service.ehAdmin()).toBe(false);
    expect(service.token()).toBe('token-jwt-123');
  });

  it('should default to the USER profile when the backend does not send one', async () => {
    const promessa = service.entrar('usuario@teste.com', '123456');

    responderLogin(httpMock, 'token-jwt');
    await aguardarMicrotarefas();
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush({
      id: 3,
      nome: 'Usuario Teste Um',
      email: 'usuario@teste.com',
    });

    await promessa;

    expect(service.perfil()).toBe('USER');
    expect(service.ehAdmin()).toBe(false);
  });

  it('should keep the session untouched when the backend rejects the credentials', async () => {
    const promessa = service.entrar('usuario@teste.com', 'senha-errada');

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(
      { status: 401, message: 'E-mail ou senha inválidos.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(promessa).rejects.toThrow();

    expect(service.autenticado()).toBe(false);
    expect(window.localStorage.getItem('fourscheduler.token')).toBeNull();
  });

  it('should ignore blank email or password', async () => {
    await service.entrar('   ', 'senha');
    await service.entrar('admin@teste.com', '');

    expect(service.autenticado()).toBe(false);
    httpMock.expectNone(`${environment.apiUrl}/auth/login`);
  });

  it('should sign out and clear storage', async () => {
    const promessa = service.entrar('usuario@teste.com', '123456');
    responderLogin(httpMock);
    await aguardarMicrotarefas();
    responderPerfil(httpMock);
    await promessa;

    service.sair();

    expect(service.autenticado()).toBe(false);
    expect(service.perfil()).toBeNull();
    expect(window.localStorage.getItem('fourscheduler.usuario')).toBeNull();
    expect(window.localStorage.getItem('fourscheduler.token')).toBeNull();
    expect(window.localStorage.getItem('fourscheduler.perfil')).toBeNull();
  });

  it('should restore the saved session from storage', () => {
    window.localStorage.setItem('fourscheduler.usuario', 'Ana');
    window.localStorage.setItem('fourscheduler.token', 'token-antigo');
    window.localStorage.setItem('fourscheduler.perfil', 'ADMIN');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const novaSessao = TestBed.inject(AuthService);

    expect(novaSessao.usuario()).toBe('Ana');
    expect(novaSessao.token()).toBe('token-antigo');
    expect(novaSessao.autenticado()).toBe(true);
    expect(novaSessao.ehAdmin()).toBe(true);
  });

  it('should ignore a corrupted saved profile', () => {
    window.localStorage.setItem('fourscheduler.usuario', 'Ana');
    window.localStorage.setItem('fourscheduler.token', 'token-antigo');
    window.localStorage.setItem('fourscheduler.perfil', 'QUALQUER');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const novaSessao = TestBed.inject(AuthService);

    expect(novaSessao.perfil()).toBeNull();
    expect(novaSessao.ehAdmin()).toBe(false);
  });
});
