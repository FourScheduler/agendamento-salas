import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { USUARIO_MOCK } from '../../core/data/usuario-mock';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  readonly usuario = this.auth.usuario;
  readonly autenticado = this.auth.autenticado;
  readonly nomePadrao = USUARIO_MOCK;

  readonly modalAberto = signal(false);
  readonly nomeDigitado = signal(USUARIO_MOCK);
  readonly entrando = signal(false);
  readonly erroLogin = signal<string | null>(null);

  private readonly campoNome = viewChild.required<ElementRef<HTMLInputElement>>('campoNome');

  readonly iniciais = computed(() => {
    const nome = this.usuario();
    if (!nome) {
      return '';
    }

    return nome
      .trim()
      .split(/\s+/)
      .filter((parte) => parte.length > 0)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  });

  abrirModal(): void {
    this.nomeDigitado.set(this.usuario() ?? this.nomePadrao);
    this.erroLogin.set(null);
    this.modalAberto.set(true);
    afterNextRender(
      () => {
        const campo = this.campoNome().nativeElement;
        campo.focus();
        campo.select();
      },
      { injector: this.injector },
    );
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.erroLogin.set(null);
  }

  async entrar(): Promise<void> {
    const nome = this.nomeDigitado().trim();
    if (!nome || this.entrando()) {
      return;
    }

    this.entrando.set(true);
    this.erroLogin.set(null);

    try {
      await this.auth.entrar(nome);
      this.fecharModal();
    } catch {
      this.erroLogin.set('Não foi possível entrar agora. Tente novamente.');
    } finally {
      this.entrando.set(false);
    }
  }

  sair(): void {
    this.auth.sair();
  }
}
