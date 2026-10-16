import { Routes } from '@angular/router';
import { Agendamento } from './features/agendamento/agendamento';
import { Mesas } from './features/mesas/mesas';
import { MinhasReservas } from './features/reservas/minhas-reservas';
import { Portal } from './features/portal/portal';

export const routes: Routes = [
  { path: '', redirectTo: 'portal', pathMatch: 'full' },
  { path: 'portal', component: Portal },
  { path: 'agendamento', component: Agendamento },
  { path: 'mesas', component: Mesas },
  { path: 'minhas-reservas', component: MinhasReservas },
  { path: '**', redirectTo: 'portal' },
];
