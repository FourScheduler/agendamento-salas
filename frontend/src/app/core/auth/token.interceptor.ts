import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const tokenInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const token = inject(AuthService).token();

  if (!token) {
    return proximo(requisicao);
  }

  return proximo(
    requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
