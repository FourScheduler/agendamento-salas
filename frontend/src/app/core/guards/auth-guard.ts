import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * As telas de agendamento só abrem com sessão ativa: sem login, o usuário
 * volta ao portal, onde pode entrar com e-mail e senha.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.autenticado() ? true : router.createUrlTree(['/portal']);
};
