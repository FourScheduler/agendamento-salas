import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const CHAVE_USUARIO = 'fourscheduler.usuario';
const CHAVE_TOKEN = 'fourscheduler.token';

/**
 * Sessão da aplicação. Enquanto o login for mockado, o token vem do endpoint
 * de demonstração do backend (/auth/demo). No futuro, o SSO do portal fornece
 * a sessão; os consumidores não mudam.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly usuarioInterno = signal<string | null>(lerValor(CHAVE_USUARIO));
  private readonly tokenInterno = signal<string | null>(lerValor(CHAVE_TOKEN));

  readonly usuario = this.usuarioInterno.asReadonly();
  readonly token = this.tokenInterno.asReadonly();
  readonly autenticado = computed(() => this.tokenInterno() !== null);

  async entrar(nome: string): Promise<void> {
    const limpo = nome.trim();
    if (!limpo) {
      return;
    }

    const token = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/demo`, {}, { responseType: 'text' }),
    );

    this.usuarioInterno.set(limpo);
    this.tokenInterno.set(token);
    salvarValor(CHAVE_USUARIO, limpo);
    salvarValor(CHAVE_TOKEN, token);
  }

  sair(): void {
    this.usuarioInterno.set(null);
    this.tokenInterno.set(null);
    salvarValor(CHAVE_USUARIO, null);
    salvarValor(CHAVE_TOKEN, null);
  }
}

function lerValor(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function salvarValor(chave: string, valor: string | null): void {
  try {
    if (valor === null) {
      window.localStorage.removeItem(chave);
    } else {
      window.localStorage.setItem(chave, valor);
    }
  } catch {
    // localStorage indisponível: a sessão vale só na memória.
  }
}
