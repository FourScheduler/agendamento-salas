import { TestBed } from '@angular/core/testing';
import { LoginCartao } from './login-cartao';
import { CredenciaisLogin } from '../../core/models/api.models';

describe('LoginCartao', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginCartao],
    }).compileComponents();
  });

  function montar() {
    const fixture = TestBed.createComponent(LoginCartao);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LoginCartao);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with the mock email and an empty password', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const email = compiled.querySelector<HTMLInputElement>('#login-email');
    const senha = compiled.querySelector<HTMLInputElement>('#login-senha');

    expect(email?.value).toBe('mock@fourscheduler.local');
    expect(senha?.value).toBe('');
    expect(compiled.querySelector<HTMLButtonElement>('.login__entrar')?.disabled).toBe(true);
    expect(compiled.textContent).toContain('Use a conta mock para demonstração.');
  });

  it('should emit the credentials on submit', async () => {
    const fixture = montar();
    await fixture.whenStable();

    let credenciais: CredenciaisLogin | null = null;
    fixture.componentInstance.entrar.subscribe((valor) => (credenciais = valor));

    const compiled = fixture.nativeElement as HTMLElement;
    const senha = compiled.querySelector<HTMLInputElement>('#login-senha');
    senha!.value = 'mock123';
    senha!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const botao = compiled.querySelector<HTMLButtonElement>('.login__entrar');
    expect(botao?.disabled).toBe(false);
    botao?.click();

    expect(credenciais).toEqual({ email: 'mock@fourscheduler.local', senha: 'mock123' });
  });

  it('should show the error message and the busy label', async () => {
    const fixture = montar();
    await fixture.whenStable();

    const senha = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#login-senha',
    );
    senha!.value = 'mock123';
    senha!.dispatchEvent(new Event('input'));

    fixture.componentRef.setInput('erro', 'Usuário inexistente ou senha inválida.');
    fixture.componentRef.setInput('ocupado', true);
    fixture.componentRef.setInput('rotulo', 'Entre para ver seus agendamentos');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Usuário inexistente ou senha inválida.');
    expect(compiled.textContent).toContain('Entrando...');
    expect(compiled.querySelector<HTMLButtonElement>('.login__entrar')?.disabled).toBe(true);
  });
});
