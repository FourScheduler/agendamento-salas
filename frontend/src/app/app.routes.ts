import { Routes } from '@angular/router';
import { Agendamento } from './features/agendamento/agendamento';
import { AgendamentoAdmin } from './features/agendamento-admin/agendamento-admin';
import { MinhasReservas } from './features/reservas/minhas-reservas';
import { Portal } from './features/portal/portal';
import { adminGuard } from './core/guards/admin-guard';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'portal', pathMatch: 'full' },
  { path: 'portal', component: Portal },
  { path: 'agendamento', component: Agendamento, canActivate: [authGuard] },
  {
    path: 'agendamento-admin',
    component: AgendamentoAdmin,
    canActivate: [authGuard, adminGuard],
  },
  { path: 'minhas-reservas', component: MinhasReservas },
  { path: '**', redirectTo: 'portal' },
];
