import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { tokenInterceptor } from './token.interceptor';
import { AuthService } from './auth.service';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add the Authorization header when logged in', () => {
    auth['iniciarSessao']('tokenabc', 'mock@fourscheduler.local');

    http.get('/api/salas/1').subscribe();

    const chamada = httpMock.expectOne('/api/salas/1');
    expect(chamada.request.headers.get('Authorization')).toBe('Bearer tokenabc');
    chamada.flush({});
  });

  it('should not add the header when logged out', () => {
    http.get('/api/salas/1').subscribe();

    const chamada = httpMock.expectOne('/api/salas/1');
    expect(chamada.request.headers.has('Authorization')).toBe(false);
    chamada.flush({});
  });
});
