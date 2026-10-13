import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CredenciaisLogin } from '../models/api.models';

const CHAVE_TOKEN = 'auth_token';
const CHAVE_USUARIO = 'auth_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly token = signal<string | null>(localStorage.getItem(CHAVE_TOKEN));
  readonly usuario = signal<string | null>(localStorage.getItem(CHAVE_USUARIO));
  readonly logado = computed(() => this.token() !== null);

  login(credenciais: CredenciaisLogin): Observable<void> {
    return this.http
      .post(`${this.baseUrl}/auth/login`, {
        email: credenciais.email,
        password: credenciais.senha,
      }, { responseType: 'text' })
      .pipe(
        map((token) => token.trim()),
        tap((token) => this.iniciarSessao(token, credenciais.email)),
        map(() => undefined),
      );
  }

  logout(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    this.token.set(null);
    this.usuario.set(null);
  }

  private iniciarSessao(token: string, email: string): void {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, email);
    this.token.set(token);
    this.usuario.set(email);
  }
}
