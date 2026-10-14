import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Topbar } from './topbar';
import { AuthService } from '../../core/auth/auth.service';

describe('Topbar', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

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
    await fixture.whenStable();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>(
      '.login-modal__form',
    );
    formulario?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();

    const auth = TestBed.inject(AuthService);
    expect(auth.usuario()).toBe('Maria Souza');
    expect((fixture.nativeElement as HTMLElement).querySelector('.topbar__usuario')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('.login-modal')).toBeNull();
  });

  it('should close the modal on cancel without authenticating', () => {
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.topbar__entrar')
      ?.click();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.login-modal__cancelar')
      ?.click();
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.login-modal')).toBeNull();
  });

  it('should sign out and show the sign in button again', () => {
    const fixture = TestBed.createComponent(Topbar);
    TestBed.inject(AuthService).entrar('Kevin Miranda');
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
