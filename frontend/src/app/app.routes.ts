import { Routes } from '@angular/router';
import { Agendamento } from './features/agendamento/agendamento';
import { MeusAgendamentos } from './features/meus-agendamentos/meus-agendamentos';
import { Portal } from './features/portal/portal';

export const routes: Routes = [
  { path: '', redirectTo: 'portal', pathMatch: 'full' },
  { path: 'portal', component: Portal },
  { path: 'agendamento', component: Agendamento },
  { path: 'meus-agendamentos', component: MeusAgendamentos },
  { path: '**', redirectTo: 'portal' },
];
