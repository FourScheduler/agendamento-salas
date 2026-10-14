import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const token = inject(AuthService).token();

  if (!token || requisicao.url.startsWith(`${environment.apiUrl}/auth/`)) {
    return proximo(requisicao);
  }

  return proximo(requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
