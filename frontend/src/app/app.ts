import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Topbar } from './shared/topbar/topbar';
import { ToastContainer } from './shared/toast/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Topbar, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
