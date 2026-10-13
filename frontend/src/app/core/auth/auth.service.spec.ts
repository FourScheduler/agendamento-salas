import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be logged out initially', () => {
    expect(service.logado()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.usuario()).toBeNull();
  });

  it('should store the token and user on login', () => {
    let logado = false;
    service.login({ email: 'mock@fourscheduler.local', senha: 'mock123' }).subscribe({
      next: () => (logado = true),
    });

    const chamada = httpMock.expectOne(`${service['baseUrl']}/auth/login`);
    expect(chamada.request.method).toBe('POST');
    expect(chamada.request.body).toEqual({
      email: 'mock@fourscheduler.local',
      password: 'mock123',
    });
    chamada.flush('  token.jwt.aqui  ');

    expect(logado).toBe(true);
    expect(service.logado()).toBe(true);
    expect(service.token()).toBe('token.jwt.aqui');
    expect(service.usuario()).toBe('mock@fourscheduler.local');
    expect(localStorage.getItem('auth_token')).toBe('token.jwt.aqui');
  });

  it('should clear the session on logout', () => {
    service['iniciarSessao']('tokenqualquer', 'mock@fourscheduler.local');
    expect(service.logado()).toBe(true);

    service.logout();

    expect(service.logado()).toBe(false);
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
