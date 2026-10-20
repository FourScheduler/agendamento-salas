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
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { USUARIO_MOCK } from '../../core/data/usuario-mock';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  host: {
    '(document:click)': 'fecharMenuPerfilAoClicarFora($event)',
  },
})
export class Topbar {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly usuario = this.auth.usuario;
  readonly autenticado = this.auth.autenticado;
  readonly nomePadrao = USUARIO_MOCK;
  readonly exibirAcoesPortal = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => !/^\/(?:agendamento|minhas-reservas)(?:\/|[?#]|$)/.test(event.urlAfterRedirects)),
    ),
    {
      initialValue: !/^\/(?:agendamento|minhas-reservas)(?:\/|[?#]|$)/.test(this.router.url),
    },
  );
  readonly exibirLocalizacao = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => /^\/(?:agendamento|minhas-reservas)(?:\/|[?#]|$)/.test(event.urlAfterRedirects)),
    ),
    {
      initialValue: /^\/(?:agendamento|minhas-reservas)(?:\/|[?#]|$)/.test(this.router.url),
    },
  );

  readonly modalAberto = signal(false);
  readonly menuPerfilAberto = signal(false);
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

  alternarMenuPerfil(): void {
    this.menuPerfilAberto.update((aberto) => !aberto);
  }

  fecharMenuPerfil(): void {
    this.menuPerfilAberto.set(false);
  }

  fecharMenuPerfilAoClicarFora(event: MouseEvent): void {
    if (!this.menuPerfilAberto()) {
      return;
    }

    const perfil = this.hostElement.nativeElement.querySelector('.topbar__perfil');
    if (!perfil || !event.composedPath().includes(perfil)) {
      this.fecharMenuPerfil();
    }
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
    this.fecharMenuPerfil();
    this.auth.sair();
  }
}
