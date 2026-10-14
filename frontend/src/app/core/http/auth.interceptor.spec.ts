import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const url = `${environment.apiUrl}/api/agendamento/meus`;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should send the Bearer token when there is a stored token', () => {
    localStorage.setItem('foursys.token', 'token-abc');

    http.get(url).subscribe();

    const chamada = httpMock.expectOne(url);
    expect(chamada.request.headers.get('Authorization')).toBe('Bearer token-abc');
    chamada.flush([]);
  });

  it('should not send the Authorization header when there is no token', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.token()).toBeNull();

    http.get(url).subscribe();

    const chamada = httpMock.expectOne(url);
    expect(chamada.request.headers.has('Authorization')).toBe(false);
    chamada.flush([]);
  });
});
