import { Routes } from '@angular/router';
import { Agendamento } from './features/agendamento/agendamento';
import { MinhasReservas } from './features/reservas/minhas-reservas';
import { Portal } from './features/portal/portal';

export const routes: Routes = [
  { path: '', redirectTo: 'portal', pathMatch: 'full' },
  { path: 'portal', component: Portal },
  { path: 'agendamento', component: Agendamento },
  { path: 'minhas-reservas', component: MinhasReservas },
  { path: '**', redirectTo: 'portal' },
];
