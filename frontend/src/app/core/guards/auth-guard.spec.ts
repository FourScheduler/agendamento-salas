import { TestBed } from '@angular/core/testing';
import { GuardResult, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  function executar(): GuardResult {
    // O retorno síncrono do guard é o que interessa; MaybeAsync cobre Promise/Observable.
    let resultado: unknown;
    TestBed.runInInjectionContext(() => {
      resultado = authGuard({} as never, {} as never);
    });
    return resultado as GuardResult;
  }

  /** Prepara a sessão de teste e injeta um AuthService que lê o storage novo. */
  function comSessao(token?: string): void {
    window.localStorage.clear();
    if (token) {
      window.localStorage.setItem('fourscheduler.usuario', 'Ana');
      window.localStorage.setItem('fourscheduler.token', token);
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(AuthService);
  }

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should allow navigation when there is an active session', () => {
    comSessao('token-valido');

    expect(executar()).toBe(true);
    expect(TestBed.inject(AuthService).autenticado()).toBe(true);
  });

  it('should redirect to the portal when there is no session', () => {
    comSessao();

    const destino = executar();

    expect(destino).toBeInstanceOf(UrlTree);
    expect(String(destino)).toContain('/portal');
    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
  });
});
