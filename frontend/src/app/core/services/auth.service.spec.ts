import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/auth/login`;

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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated when there is no stored token', () => {
    expect(service.autenticado()).toBe(false);
  });

  it('should store the token returned by the backend', () => {
    service.entrar('usuario@teste.com', 'senha').subscribe();

    const chamada = httpMock.expectOne(url);
    expect(chamada.request.method).toBe('POST');
    chamada.flush('token-abc');

    expect(service.token()).toBe('token-abc');
    expect(service.autenticado()).toBe(true);
    expect(localStorage.getItem('foursys.token')).toBe('token-abc');
  });

  it('should remove the token on logout', () => {
    localStorage.setItem('foursys.token', 'token-antigo');
    const serviceComToken = TestBed.inject(AuthService);

    serviceComToken.sair();

    expect(serviceComToken.token()).toBeNull();
    expect(localStorage.getItem('foursys.token')).toBeNull();
  });
});
