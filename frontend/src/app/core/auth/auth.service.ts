import { Injectable, computed, signal } from '@angular/core';

const CHAVE_USUARIO = 'fourscheduler.usuario';

/**
 * Sessão mockada da aplicação. No futuro, esta classe vira a costura do SSO do
 * portal: o método `entrar` deixa de aceitar nome digitado e passa a ler a
 * sessão já autenticada pelo portal oficial; os consumidores não mudam.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioInterno = signal<string | null>(lerUsuarioSalvo());

  readonly usuario = this.usuarioInterno.asReadonly();
  readonly autenticado = computed(() => this.usuarioInterno() !== null);

  entrar(nome: string): void {
    const limpo = nome.trim();
    if (!limpo) {
      return;
    }

    this.usuarioInterno.set(limpo);
    salvarUsuario(limpo);
  }

  sair(): void {
    this.usuarioInterno.set(null);
    salvarUsuario(null);
  }
}

function lerUsuarioSalvo(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_USUARIO);
  } catch {
    return null;
  }
}

function salvarUsuario(valor: string | null): void {
  try {
    if (valor === null) {
      window.localStorage.removeItem(CHAVE_USUARIO);
    } else {
      window.localStorage.setItem(CHAVE_USUARIO, valor);
    }
  } catch {
    // localStorage indisponível: a sessão vale só na memória.
  }
}
