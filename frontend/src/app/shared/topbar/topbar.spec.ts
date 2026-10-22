import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Topbar } from './topbar';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorInterceptor } from '../../core/http/api-error';
import { authInterceptor } from '../../core/http/auth-interceptor';
import { environment } from '../../../environments/environment';

@Component({ template: '' })
class RotaTeste {}

describe('Topbar', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        provideRouter([
          { path: 'agendamento', component: RotaTeste },
          { path: 'agendamento-admin', component: RotaTeste },
          { path: 'minhas-reservas', component: RotaTeste },
          { path: 'portal', component: RotaTeste },
        ]),
        provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
  });

  function responderLogin(token = 'token-jwt-123') {
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(token);
  }

  function aguardarMicrotarefas(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function responderMe(nome = 'Usuario Teste Um', perfilUsuario = 'USER') {
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush({
      id: 3,
      nome,
      email: 'usuario@teste.com',
      perfilUsuario,
    });
  }

  /** Preenche e-mail e senha no modal de login e dispara o envio. */
  function preencherCredenciais(
    fixture: { nativeElement: HTMLElement },
    email: string,
    senha: string,
  ) {
    const campoEmail = fixture.nativeElement.querySelector<HTMLInputElement>('#login-email');
    if (campoEmail) {
      campoEmail.value = email;
      campoEmail.dispatchEvent(new Event('input'));
    }
    const campoSenha = fixture.nativeElement.querySelector<HTMLInputElement>('#login-senha');
    if (campoSenha) {
      campoSenha.value = senha;
      campoSenha.dispatchEvent(new Event('input'));
    }
  }

  it('should show the sign in button when unauthenticated', () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.topbar__entrar')).toBeTruthy();
    expect(compiled.querySelector('.topbar__usuario')).toBeNull();
  });

  it('should show Tamboré beside the brand on booking and reservations routes', async () => {
    const fixture = TestBed.createComponent(Topbar);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/minhas-reservas');
    fixture.detectChanges();
    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.topbar__localizacao')?.textContent?.trim()).toBe('Tamboré');
    expect(compiled.querySelector('.topbar__reservas')?.textContent).toContain('Minhas reservas');
    expect(compiled.querySelector('.topbar__acoes')).toBeNull();

    await router.navigateByUrl('/agendamento');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.topbar__localizacao')?.textContent?.trim()).toBe('Tamboré');
    expect(compiled.querySelector('.topbar__reservas')?.textContent).toContain('Minhas reservas');

    await router.navigateByUrl('/portal');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.topbar__localizacao')).toBeNull();
    expect(compiled.querySelector('.topbar__reservas')).toBeNull();
    expect(compiled.querySelector('.topbar__item')).toBeNull();
    expect(compiled.querySelector('.topbar__nome')).toBeNull();
    expect(compiled.textContent).not.toContain('Minhas reservas');
    // Sem sessão não há sino nem relógio na topbar do portal.
    expect(compiled.querySelector('.topbar__acoes')).toBeNull();
  });

  it('should show the portal bell and clock only after signing in', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/portal');
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.topbar__acoes'),
    ).toBeNull();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    preencherCredenciais(fixture, 'usuario@teste.com', '123456');
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLFormElement>('.login-modal__form')
      ?.dispatchEvent(new Event('submit'));

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush('token-jwt-123');
    await aguardarMicrotarefas();
    responderMe('Usuario Teste Um');
    await fixture.whenStable();
    await aguardarMicrotarefas();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.topbar__acoes')).toBeTruthy();
    expect(compiled.querySelector('.topbar__notificacoes')).toBeTruthy();
    expect(compiled.querySelector('.topbar__entrar')).toBeNull();
  });

  it('should open the login modal with email and password fields', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.login-modal')).toBeTruthy();
    expect(compiled.querySelector('#login-email')).toBeTruthy();
    expect(compiled.querySelector('#login-senha')).toBeTruthy();
    // O campo de nome da demonstração saiu do modal.
    expect(compiled.querySelector('#login-nome')).toBeNull();
  });

  it('should ask for both credentials when the form is submitted empty', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>(
      '.login-modal__form',
    );
    formulario?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Informe o e-mail e a');
    expect(httpMock.match(`${environment.apiUrl}/auth/login`).length).toBe(0);
    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
  });

  it('should authenticate with the typed email and password', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const email = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#login-email',
    );
    if (email) {
      email.value = ' usuario@teste.com ';
      email.dispatchEvent(new Event('input'));
    }
    const senha = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#login-senha',
    );
    if (senha) {
      senha.value = '123456';
      senha.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>(
      '.login-modal__form',
    );
    formulario?.dispatchEvent(new Event('submit'));

    const chamadaLogin = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    // O AuthService trima o e-mail antes de enviar.
    expect(chamadaLogin.request.body).toEqual({
      email: 'usuario@teste.com',
      password: '123456',
    });
    chamadaLogin.flush('token-jwt-123');

    await aguardarMicrotarefas();
    responderMe('Usuario Teste Um');
    await fixture.whenStable();
    await aguardarMicrotarefas();
    fixture.detectChanges();

    const auth = TestBed.inject(AuthService);
    expect(auth.usuario()).toBe('Usuario Teste Um');
    expect(auth.token()).toBe('token-jwt-123');
    expect((fixture.nativeElement as HTMLElement).querySelector('.topbar__usuario')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('.login-modal')).toBeNull();
    // Entrar pela topbar não redireciona: o usuário permanece na página.
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should stay on the page when an administrator logs in from the topbar', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    preencherCredenciais(fixture, 'admin@teste.com', '123456');
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLFormElement>('.login-modal__form')
      ?.dispatchEvent(new Event('submit'));

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush('token-admin');
    await aguardarMicrotarefas();
    responderMe('Administrador Principal', 'ADMIN');
    await fixture.whenStable();
    await aguardarMicrotarefas();

    expect(TestBed.inject(AuthService).ehAdmin()).toBe(true);
    // Sem destino, o login não navega: quem decide é o clique no portal.
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should go to the profile booking screen when login was opened from the portal access', async () => {
    const fixture = TestBed.createComponent(Topbar);
    // Portal sem sessão: o acesso "Agendamento de Salas" abre o login com destino.
    TestBed.inject(AuthService).abrirLogin('agendamento');
    fixture.detectChanges();
    await fixture.whenStable();

    preencherCredenciais(fixture, 'admin@teste.com', '123456');
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLFormElement>('.login-modal__form')
      ?.dispatchEvent(new Event('submit'));

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush('token-admin');
    await aguardarMicrotarefas();
    responderMe('Administrador Principal', 'ADMIN');
    await fixture.whenStable();
    await aguardarMicrotarefas();

    // O administrador segue para a tela administrativa de agendamento.
    expect(TestBed.inject(Router).url).toBe('/agendamento-admin');
  });

  it('should keep the modal open and show the backend message when the login fails', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const email = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#login-email',
    );
    if (email) {
      email.value = 'admin@teste.com';
      email.dispatchEvent(new Event('input'));
    }
    const senha = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#login-senha',
    );
    if (senha) {
      senha.value = 'senha-errada';
      senha.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>(
      '.login-modal__form',
    );
    formulario?.dispatchEvent(new Event('submit'));
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(
      { status: 401, message: 'E-mail ou senha inválidos.' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.login-modal')).toBeTruthy();
    expect(compiled.textContent).toContain('E-mail ou senha inválidos.');
    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
  });

  it('should close the modal on cancel without authenticating', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.login-modal__cancelar')
      ?.click();
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.login-modal')).toBeNull();
  });

  it('should close the profile menu on outside click and sign out', async () => {
    const fixture = TestBed.createComponent(Topbar);
    const login = TestBed.inject(AuthService).entrar('usuario@teste.com', '123456');
    responderLogin();
    await aguardarMicrotarefas();
    responderMe('Usuario Teste Um');
    await login;
    fixture.detectChanges();

    const perfil = fixture.nativeElement as HTMLElement;
    expect(perfil.querySelector('.topbar__nome')).toBeNull();
    perfil.querySelector<HTMLButtonElement>('.topbar__avatar')?.click();
    fixture.detectChanges();
    expect(perfil.querySelector('.topbar__menu-perfil')?.textContent).toContain('Usuario Teste Um');

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(perfil.querySelector('.topbar__menu-perfil')).toBeNull();

    perfil.querySelector<HTMLButtonElement>('.topbar__avatar')?.click();
    fixture.detectChanges();
    perfil.querySelector<HTMLButtonElement>('.topbar__menu-perfil-sair')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.topbar__entrar')).toBeTruthy();
    // Ao sair, a sessão acaba e o usuário volta ao portal.
    expect(TestBed.inject(Router).url).toBe('/portal');
  });
});
