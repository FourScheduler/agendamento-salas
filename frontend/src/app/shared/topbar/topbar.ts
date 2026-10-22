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
import { mensagemDeErro } from '../../core/http/api-error';
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
  readonly exibirAcoesPortal = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(
        (event) =>
          !/^\/(?:agendamento(?:-admin)?|minhas-reservas)(?:\/|[?#]|$)/.test(
            event.urlAfterRedirects,
          ),
      ),
    ),
    {
      initialValue: !/^\/(?:agendamento(?:-admin)?|minhas-reservas)(?:\/|[?#]|$)/.test(
        this.router.url,
      ),
    },
  );
  readonly exibirLocalizacao = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(
        (event) =>
          /^\/(?:agendamento(?:-admin)?|minhas-reservas)(?:\/|[?#]|$)/.test(
            event.urlAfterRedirects,
          ),
      ),
    ),
    {
      initialValue: /^\/(?:agendamento(?:-admin)?|minhas-reservas)(?:\/|[?#]|$)/.test(
        this.router.url,
      ),
    },
  );

  /** Modal de login compartilhado com o portal (que pode abri-lo sem sessão). */
  readonly modalAberto = this.auth.loginAberto;
  readonly menuPerfilAberto = signal(false);
  readonly emailDigitado = signal('');
  readonly senhaDigitada = signal('');
  readonly entrando = signal(false);
  readonly erroLogin = signal<string | null>(null);

  private readonly campoEmail = viewChild.required<ElementRef<HTMLInputElement>>('campoEmail');

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
    this.emailDigitado.set('');
    this.senhaDigitada.set('');
    this.erroLogin.set(null);
    // Entrar sem destino: o usuário permanece na página após autenticar.
    this.auth.abrirLogin();
    afterNextRender(
      () => {
        const campo = this.campoEmail().nativeElement;
        campo.focus();
        campo.select();
      },
      { injector: this.injector },
    );
  }

  fecharModal(): void {
    this.auth.fecharLogin();
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

  /** Login pelo backend com e-mail e senha; ambos os campos são obrigatórios. */
  async entrar(): Promise<void> {
    const email = this.emailDigitado().trim();
    const senha = this.senhaDigitada();
    if (this.entrando()) {
      return;
    }

    if (!email || !senha) {
      this.erroLogin.set('Informe o e-mail e a senha para entrar.');
      return;
    }

    this.entrando.set(true);
    this.erroLogin.set(null);

    try {
      await this.auth.entrar(email, senha);
      // O login pela topbar permanece na página; segue adiante apenas quando o
      // modal foi aberto pelo acesso "Agendamento de Salas" do portal.
      const destino = this.auth.destinoLogin();
      this.fecharModal();

      if (destino === 'agendamento') {
        await this.router.navigate([
          this.auth.ehAdmin() ? '/agendamento-admin' : '/agendamento',
        ]);
      }
    } catch (erro: unknown) {
      // 401 vem do backend como "E-mail ou senha inválidos."; o resto usa a mensagem padrão.
      this.erroLogin.set(mensagemDeErro(erro));
    } finally {
      this.entrando.set(false);
    }
  }

  sair(): void {
    this.fecharMenuPerfil();
    this.auth.sair();
    // Encerrar a sessão devolve o usuário ao portal; sem login não se entra
    // nas telas de agendamento.
    void this.router.navigate(['/portal']);
  }
}
