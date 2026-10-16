import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Topbar } from './topbar';
import { AuthService } from '../../core/services/auth.service';
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
          { path: 'minhas-reservas', component: RotaTeste },
          { path: 'portal', component: RotaTeste },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
  });

  function responderDemo(token = 'token-jwt-123') {
    httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush(token);
  }

  function aguardarMicrotarefas(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function responderMe(nome = 'Usuario Teste Um') {
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush({
      id: 3,
      nome,
      email: 'usuario@teste.com',
    });
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
    expect(compiled.querySelector('.topbar__acoes')).toBeTruthy();
  });

  it('should open the login modal and authenticate with the typed name', async () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    const botaoEntrar = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.topbar__entrar',
    );
    botaoEntrar?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const modal = (fixture.nativeElement as HTMLElement).querySelector('.login-modal');
    expect(modal).toBeTruthy();

    const campo = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#login-nome',
    );
    expect(campo?.value).toBe('Kevin Miranda');

    if (campo) {
      campo.value = 'Maria Souza';
      campo.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>(
      '.login-modal__form',
    );
    formulario?.dispatchEvent(new Event('submit'));
    responderDemo();
    // O perfil falha neste cenário: o nome digitado é quem deve aparecer.
    await aguardarMicrotarefas();
    httpMock.expectOne(`${environment.apiUrl}/api/usuarios/me`).flush('erro', {
      status: 500,
      statusText: 'Internal Server Error',
    });
    await fixture.whenStable();
    await aguardarMicrotarefas();
    fixture.detectChanges();

    const auth = TestBed.inject(AuthService);
    expect(auth.usuario()).toBe('Maria Souza');
    expect(auth.token()).toBe('token-jwt-123');
    expect((fixture.nativeElement as HTMLElement).querySelector('.topbar__usuario')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('.login-modal')).toBeNull();
  });

  it('should keep the modal open and show an error when the demo login fails', async () => {
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
    httpMock.expectOne(`${environment.apiUrl}/auth/demo`).flush('erro', {
      status: 404,
      statusText: 'Not Found',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.login-modal')).toBeTruthy();
    expect(compiled.textContent).toContain('Não foi possível entrar agora');
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
    const login = TestBed.inject(AuthService).entrar('Kevin Miranda');
    responderDemo();
    await aguardarMicrotarefas();
    responderMe('Kevin Miranda');
    await login;
    fixture.detectChanges();

    const perfil = fixture.nativeElement as HTMLElement;
    expect(perfil.querySelector('.topbar__nome')).toBeNull();
    perfil.querySelector<HTMLButtonElement>('.topbar__avatar')?.click();
    fixture.detectChanges();
    expect(perfil.querySelector('.topbar__menu-perfil')?.textContent).toContain('Kevin Miranda');

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(perfil.querySelector('.topbar__menu-perfil')).toBeNull();

    perfil.querySelector<HTMLButtonElement>('.topbar__avatar')?.click();
    fixture.detectChanges();
    perfil.querySelector<HTMLButtonElement>('.topbar__menu-perfil-sair')?.click();
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.topbar__entrar')).toBeTruthy();
  });
});
