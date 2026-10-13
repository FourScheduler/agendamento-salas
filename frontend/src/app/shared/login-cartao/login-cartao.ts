import { Component, input, output, signal } from '@angular/core';
import { CredenciaisLogin } from '../../core/models/api.models';

const EMAIL_MOCK = 'mock@fourscheduler.local';

@Component({
  selector: 'app-login-cartao',
  templateUrl: './login-cartao.html',
  styleUrl: './login-cartao.css',
})
export class LoginCartao {
  readonly rotulo = input('Entre para confirmar');
  readonly ocupado = input(false);
  readonly erro = input<string | null>(null);

  readonly entrar = output<CredenciaisLogin>();

  readonly email = signal(EMAIL_MOCK);
  readonly senha = signal('');

  get podeEntrar(): boolean {
    return this.email().length > 0 && this.senha().length > 0 && !this.ocupado();
  }

  definirEmail(evento: Event): void {
    this.email.set(this.valorDoCampo(evento).trim());
  }

  definirSenha(evento: Event): void {
    this.senha.set(this.valorDoCampo(evento));
  }

  enviar(evento: Event): void {
    evento.preventDefault();

    if (this.podeEntrar) {
      this.entrar.emit({ email: this.email(), senha: this.senha() });
    }
  }

  private valorDoCampo(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }
}
