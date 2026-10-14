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
  }

  entrar(): void {
    const nome = this.nomeDigitado().trim();
    if (!nome) {
      return;
    }

    this.auth.entrar(nome);
    this.fecharModal();
  }

  sair(): void {
    this.auth.sair();
  }
}
