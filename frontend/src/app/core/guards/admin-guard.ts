import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Restringe a rota a sessões com perfil ADMIN. Sem sessão volta ao portal
 * (é preciso entrar primeiro); com perfil comum, redireciona para o
 * agendamento padrão.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return router.createUrlTree(['/portal']);
  }

  return auth.ehAdmin() ? true : router.createUrlTree(['/agendamento']);
};
