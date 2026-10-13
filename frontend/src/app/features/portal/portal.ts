import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Aplicativo {
  readonly nome: string;
  readonly icone: string;
  readonly href?: string;
  readonly rota?: string;
}

@Component({
  selector: 'app-portal',
  imports: [RouterLink],
  templateUrl: './portal.html',
  styleUrl: './portal.css',
})
export class Portal {
  readonly aplicativos: Aplicativo[] = [
    {
      nome: 'Portal de Gestão da Qualidade',
      icone: 'apps/qualidade.png',
      href: 'https://apps1.qualiex.com/Docs/Documents?folder=XH6OS9XX5TA25KD',
    },
    {
      nome: 'Onboarding',
      icone: 'apps/onboarding.svg',
      href: 'https://foursys.sharepoint.com/sites/Onboarding',
    },
    {
      nome: 'GLPI - Serviços de TI',
      icone: 'apps/glpi-ti.svg',
      href: 'https://glpi.csc4u.com.br/',
    },
    { nome: 'GLPI*', icone: 'apps/glpi.png', href: 'https://glpi.app.foursys.com/' },
    { nome: 'E-mail', icone: 'apps/email.png', href: 'http://webmail.foursys.com.br/' },
    { nome: 'Temporário', icone: 'apps/temporario.png', href: 'file://10.1.255.249/temporario/' },
    { nome: 'Fourmakers', icone: 'apps/fourmakers.png', href: 'https://app.fourmakers.io/foursys' },
    {
      nome: 'Playground IA',
      icone: 'apps/playground-ia.png',
      href: 'https://show-room-5jffjdvadq-rj.a.run.app/',
    },
    { nome: 'Nexus', icone: 'apps/nexus.svg', href: 'https://nexus.f4homolog.com.br/' },
    {
      nome: 'Academy',
      icone: 'apps/academy.png',
      href: 'https://academy.app.foursys.com/?redirect=0',
    },
    { nome: 'CRM', icone: 'apps/crm.png', href: 'https://crm.foursys.com/' },
    {
      nome: 'Recrutamento*',
      icone: 'apps/recrutamento.png',
      href: 'https://srs.app.foursys.com/srs/index.php?m=settings',
    },
    {
      nome: 'Portal de Gestão Pessoal',
      icone: 'apps/gestao-pessoal.svg',
      href: 'https://login.lg.com.br/login/bwg_foursys',
    },
    { nome: 'Agendamento de Salas', icone: 'apps/agendamento.svg', rota: '/agendamento' },
  ];
}
