import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Topbar } from './topbar';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

describe('Topbar', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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

  it('should show the sign in button when unauthenticated', () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.topbar__entrar')).toBeTruthy();
    expect(compiled.querySelector('.topbar__usuario')).toBeNull();
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
    await fixture.whenStable();
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

  it('should sign out and show the sign in button again', async () => {
    const fixture = TestBed.createComponent(Topbar);
    const login = TestBed.inject(AuthService).entrar('Kevin Miranda');
    responderDemo();
    await login;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Kevin Miranda');

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__sair')
      ?.click();
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.topbar__entrar')).toBeTruthy();
  });
});
