import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, PerfilUsuario } from '../models/api.models';

const CHAVE_USUARIO = 'fourscheduler.usuario';
const CHAVE_TOKEN = 'fourscheduler.token';
const CHAVE_PERFIL = 'fourscheduler.perfil';
const CHAVE_SESSAO = 'fourscheduler.sessao';
const CHAVE_AVISO = 'fourscheduler.avisoRegrasFechado';

/**
 * Sessão da aplicação. O login usa e-mail e senha (`POST /auth/login`); o nome
 * e o perfil vêm de /api/usuarios/me, que é a fonte de verdade — se o perfil
 * não puder ser carregado, o login segue com o e-mail digitado e sem perfil
 * de admin. No futuro, o SSO do portal fornece a sessão; os consumidores não
 * mudam.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly usuarioInterno = signal<string | null>(lerValor(CHAVE_USUARIO));
  private readonly tokenInterno = signal<string | null>(lerValor(CHAVE_TOKEN));
  private readonly perfilInterno = signal<PerfilUsuario | null>(lerPerfil(CHAVE_PERFIL));
  // Sessões já abertas antes desta versão recebem um identificador na primeira leitura.
  private idSessao = this.tokenInterno() ? lerValor(CHAVE_SESSAO) ?? novaSessao() : null;
  private readonly sessaoDoAvisoFechado = signal(lerValor(CHAVE_AVISO, 'sessionStorage'));

  readonly usuario = this.usuarioInterno.asReadonly();
  readonly token = this.tokenInterno.asReadonly();
  readonly perfil = this.perfilInterno.asReadonly();
  readonly autenticado = computed(() => this.tokenInterno() !== null);
  readonly ehAdmin = computed(() => this.perfilInterno() === 'ADMIN');
  readonly exibirAvisoRegras = computed(
    () => this.autenticado() && this.perfil() === 'USER' && this.sessaoDoAvisoFechado() !== this.idSessao,
  );

  fecharAvisoRegras(): void {
    this.registrarAvisoFechado(this.idSessao);
  }

  private registrarAvisoFechado(sessao: string | null): void {
    this.sessaoDoAvisoFechado.set(sessao);
    salvarValor(CHAVE_AVISO, sessao, 'sessionStorage');
  }

  /** Modal de login aberto, seja pela topbar ou pelo portal sem sessão. */
  readonly loginAberto = signal(false);
  /**
   * Destino pretendido quando o login foi aberto por um acesso do portal
   * ('agendamento'); nulo quando o usuário clicou apenas em Entrar e deve
   * permanecer na página após autenticar.
   */
  readonly destinoLogin = signal<'agendamento' | null>(null);

  /** Abre o modal de login; um destino direciona a tela do perfil após entrar. */
  abrirLogin(destino: 'agendamento' | null = null): void {
    this.destinoLogin.set(destino);
    this.loginAberto.set(true);
  }

  fecharLogin(): void {
    this.loginAberto.set(false);
    this.destinoLogin.set(null);
  }

  /** Entra com e-mail e senha; falha de credencial responde 401 do backend. */
  async entrar(email: string, senha: string): Promise<void> {
    const emailLimpo = email.trim();
    if (!emailLimpo || !senha) {
      return;
    }

    const credenciais: LoginRequest = { email: emailLimpo, password: senha };
    const token = await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/login`, credenciais, {
        responseType: 'text',
      }),
    );

    // Sessão primeiro: o interceptor anexa o token à chamada do perfil.
    this.idSessao = novaSessao();
    this.registrarAvisoFechado(null);
    this.guardarToken(token);
    await this.carregarPerfil(emailLimpo);
  }

  sair(): void {
    this.idSessao = null;
    this.registrarAvisoFechado(null);
    salvarValor(CHAVE_SESSAO, null);
    this.usuarioInterno.set(null);
    this.tokenInterno.set(null);
    this.perfilInterno.set(null);
    salvarValor(CHAVE_USUARIO, null);
    salvarValor(CHAVE_TOKEN, null);
    salvarValor(CHAVE_PERFIL, null);
  }

  private guardarToken(token: string): void {
    this.tokenInterno.set(token);
    salvarValor(CHAVE_TOKEN, token);
  }

  private async carregarPerfil(nomeAlternativo: string): Promise<void> {
    try {
      const perfil = await firstValueFrom(
        this.http.get<{ nome: string | null; perfilUsuario?: PerfilUsuario }>(
          `${environment.apiUrl}/api/usuarios/me`,
        ),
      );

      this.usuarioInterno.set(perfil.nome?.trim() || nomeAlternativo);
      this.perfilInterno.set(perfil.perfilUsuario ?? 'USER');
      salvarValor(CHAVE_USUARIO, this.usuarioInterno());
      salvarValor(CHAVE_PERFIL, this.perfilInterno());
    } catch {
      // Perfil indisponível: o login segue com o e-mail digitado, sem perfil de admin.
      this.usuarioInterno.set(nomeAlternativo);
      this.perfilInterno.set(null);
      salvarValor(CHAVE_USUARIO, nomeAlternativo);
      salvarValor(CHAVE_PERFIL, null);
    }
  }
}

// Identifica o login no navegador sem gravar a credencial no aviso.
function novaSessao(): string {
  const id = crypto.getRandomValues(new Uint32Array(4)).join('-');
  salvarValor(CHAVE_SESSAO, id);
  return id;
}

type Armazenamento = 'localStorage' | 'sessionStorage';

function lerValor(chave: string, armazenamento: Armazenamento = 'localStorage'): string | null {
  try {
    return window[armazenamento].getItem(chave);
  } catch {
    return null;
  }
}

/** Lê o perfil salvo; valores desconhecidos caem como sessão sem perfil. */
function lerPerfil(chave: string): PerfilUsuario | null {
  const valor = lerValor(chave);
  return valor === 'ADMIN' || valor === 'USER' ? valor : null;
}

function salvarValor(
  chave: string,
  valor: string | null,
  armazenamento: Armazenamento = 'localStorage',
): void {
  try {
    if (valor === null) {
      window[armazenamento].removeItem(chave);
    } else {
      window[armazenamento].setItem(chave, valor);
    }
  } catch {
    // Armazenamento indisponível: a sessão vale só na memória.
  }
}
