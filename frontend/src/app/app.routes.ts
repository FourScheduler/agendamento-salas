import { Routes } from '@angular/router';
import { Agendamento } from './features/agendamento/agendamento';
import { Portal } from './features/portal/portal';

export const routes: Routes = [
  { path: '', redirectTo: 'portal', pathMatch: 'full' },
  { path: 'portal', component: Portal },
  { path: 'agendamento', component: Agendamento },
  { path: '**', redirectTo: 'portal' },
];
