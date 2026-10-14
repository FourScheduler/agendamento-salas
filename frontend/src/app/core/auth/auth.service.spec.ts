import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should start unauthenticated when there is no saved session', () => {
    expect(service.autenticado()).toBe(false);
    expect(service.usuario()).toBeNull();
  });

  it('should authenticate and persist the name', () => {
    service.entrar('  Kevin Miranda  ');

    expect(service.autenticado()).toBe(true);
    expect(service.usuario()).toBe('Kevin Miranda');
    expect(window.localStorage.getItem('fourscheduler.usuario')).toBe('Kevin Miranda');
  });

  it('should ignore blank names', () => {
    service.entrar('   ');

    expect(service.autenticado()).toBe(false);
  });

  it('should sign out and clear storage', () => {
    service.entrar('Kevin Miranda');
    service.sair();

    expect(service.autenticado()).toBe(false);
    expect(window.localStorage.getItem('fourscheduler.usuario')).toBeNull();
  });

  it('should restore the saved session on a new instance', () => {
    service.entrar('Kevin Miranda');

    const outraInstancia = new AuthService();
    expect(outraInstancia.usuario()).toBe('Kevin Miranda');
  });
});
