import { TestBed } from '@angular/core/testing';
import { GuardResult, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { adminGuard } from './admin-guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  function executar(): GuardResult {
    // O retorno síncrono do guard é o que interessa; MaybeAsync cobre Promise/Observable.
    let resultado: unknown;
    TestBed.runInInjectionContext(() => {
      resultado = adminGuard({} as never, {} as never);
    });
    return resultado as GuardResult;
  }

  /** Prepara a sessão de teste e injeta um AuthService que lê o storage novo. */
  function comSessao(sessao: { token?: string; perfil?: string }): void {
    window.localStorage.clear();
    if (sessao.token) {
      window.localStorage.setItem('fourscheduler.usuario', 'Ana');
      window.localStorage.setItem('fourscheduler.token', sessao.token);
    }
    if (sessao.perfil) {
      window.localStorage.setItem('fourscheduler.perfil', sessao.perfil);
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

  it('should redirect to the portal when there is no session', () => {
    comSessao({});

    const destino = executar();

    expect(destino).toBeInstanceOf(UrlTree);
    expect(String(destino)).toContain('/portal');
  });

  it('should redirect a common user to the default booking screen', () => {
    comSessao({ token: 'token-user', perfil: 'USER' });

    const destino = executar();

    expect(destino).toBeInstanceOf(UrlTree);
    expect(String(destino)).toContain('/agendamento');
  });

  it('should allow an admin session', () => {
    comSessao({ token: 'token-admin', perfil: 'ADMIN' });

    expect(executar()).toBe(true);
  });

  it('should redirect a session without a stored profile to the default screen', () => {
    // Sessão persistida de antes da existência do perfil: token presente, perfil desconhecido.
    comSessao({ token: 'token-antigo' });

    const destino = executar();

    expect(destino).toBeInstanceOf(UrlTree);
    expect(String(destino)).toContain('/agendamento');
  });
});
