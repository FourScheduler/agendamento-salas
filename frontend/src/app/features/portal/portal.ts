import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface Aplicativo {
  readonly nome: string;
  readonly icone: string;
  readonly href?: string;
  readonly rota?: string;
  /** Exibe a etiqueta "Novo" ao lado do nome do acesso. */
  readonly novo?: boolean;
}

@Component({
  selector: 'app-portal',
  templateUrl: './portal.html',
  styleUrl: './portal.css',
})
export class Portal {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
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
    {
      nome: 'Agendamento de Salas',
      icone: 'apps/agendamento.svg',
      rota: '/agendamento',
      novo: true,
    },
  ];

  /**
   * Acesso ao agendamento: com sessão segue direto para a tela do perfil
   * (USER → comum, ADMIN → administrativa); sem sessão abre o login e, depois
   * de autenticar, segue para a mesma tela conforme o perfil.
   */
  async abrirAgendamento(): Promise<void> {
    if (!this.auth.autenticado()) {
      this.auth.abrirLogin('agendamento');
      return;
    }

    await this.router.navigate([this.rotaDoAgendamento()]);
  }

  private rotaDoAgendamento(): string {
    return this.auth.ehAdmin() ? '/agendamento-admin' : '/agendamento';
  }
}
