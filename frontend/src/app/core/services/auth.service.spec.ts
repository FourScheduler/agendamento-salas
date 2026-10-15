import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function aguardarMicrotarefas(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
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
  });

  it('should authenticate through the demo endpoint and persist session', async () => {
    const promessa = service.entrar('  Kevin Miranda  ');

    const chamada = httpMock.expectOne(`${environment.apiUrl}/auth/demo`);
    expect(chamada.request.method).toBe('POST');
    chamada.flush('token-jwt-123');

    await aguardarMicrotarefas();
    const perfil = httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`);
    perfil.flush({ id: 3, nome: 'Kevin Miranda (backend)', email: 'usuario@teste.com' });

    await promessa;

    expect(service.autenticado()).toBe(true);
    expect(service.usuario()).toBe('Kevin Miranda (backend)');
    expect(service.token()).toBe('token-jwt-123');
    expect(window.localStorage.getItem('fourscheduler.usuario')).toBe('Kevin Miranda (backend)');
    expect(window.localStorage.getItem('fourscheduler.token')).toBe('token-jwt-123');
  });

  it('should fall back to the typed name when the profile cannot be loaded', async () => {
    const promessa = service.entrar(' Kevin Miranda  ');

    httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush('token-jwt-123');

    await aguardarMicrotarefas();
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush('erro', {
      status: 500,
      statusText: 'Internal Server Error',
    });

    await promessa;

    expect(service.autenticado()).toBe(true);
    expect(service.usuario()).toBe('Kevin Miranda');
    expect(service.token()).toBe('token-jwt-123');
  });

  it('should not authenticate when the demo endpoint fails', async () => {
    const promessa = service.entrar('Kevin Miranda');

    httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush('erro', {
      status: 404,
      statusText: 'Not Found',
    });

    await expect(promessa).rejects.toThrow();

    expect(service.autenticado()).toBe(false);
    expect(window.localStorage.getItem('fourscheduler.token')).toBeNull();
  });

  it('should ignore blank names', async () => {
    await service.entrar('   ');

    expect(service.autenticado()).toBe(false);
  });

  it('should sign out and clear storage', async () => {
    const promessa = service.entrar('Kevin Miranda');
    httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush('token-jwt-123');
    await aguardarMicrotarefas();
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush({
      id: 3,
      nome: 'Kevin Miranda',
      email: 'usuario@teste.com',
    });
    await promessa;

    service.sair();

    expect(service.autenticado()).toBe(false);
    expect(window.localStorage.getItem('fourscheduler.usuario')).toBeNull();
    expect(window.localStorage.getItem('fourscheduler.token')).toBeNull();
  });

  it('should restore the saved session from storage', () => {
    window.localStorage.setItem('fourscheduler.usuario', 'Ana');
    window.localStorage.setItem('fourscheduler.token', 'token-antigo');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const novaSessao = TestBed.inject(AuthService);

    expect(novaSessao.usuario()).toBe('Ana');
    expect(novaSessao.token()).toBe('token-antigo');
    expect(novaSessao.autenticado()).toBe(true);
  });
});
