import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Topbar } from './shared/topbar/topbar';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Topbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly auth = inject(AuthService);

  readonly usuario = this.auth.usuario;

  sair(): void {
    this.auth.logout();
  }
}
