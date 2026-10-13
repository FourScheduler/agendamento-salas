import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Topbar } from './shared/topbar/topbar';
import { USUARIO_MOCK } from './core/data/usuario-mock';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Topbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly usuario = USUARIO_MOCK;
}
