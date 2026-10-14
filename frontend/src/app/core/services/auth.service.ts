import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/api.models';

const CHAVE_TOKEN = 'foursys.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly token = signal<string | null>(lerToken());

  readonly autenticado = computed(() => this.token() !== null);

  entrar(email: string, senha: string): Observable<void> {
    const requisicao: LoginRequest = { email, password: senha };

    return this.http
      .request('POST', `${this.baseUrl}/auth/login`, {
        body: requisicao,
        responseType: 'text',
      })
      .pipe(
        tap((token) => {
          localStorage.setItem(CHAVE_TOKEN, token);
          this.token.set(token);
        }),
        map(() => undefined),
      );
  }

  sair(): void {
    this.token.set(null);
    localStorage.removeItem(CHAVE_TOKEN);
  }
}

function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}
