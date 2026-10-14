import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Anexa o token do login em toda chamada autenticada ao backend. */
export const authInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const ehLogin = requisicao.url.startsWith(`${environment.apiUrl}/auth`);
  if (!token || ehLogin) {
    return proximo(requisicao);
  }

  return proximo(
    requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
