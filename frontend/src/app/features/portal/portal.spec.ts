import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Portal } from './portal';
import { AuthService } from '../../core/services/auth.service';

@Component({ template: '' })
class RotaTeste {}

describe('Portal', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Portal],
      providers: [
        provideRouter([
          { path: 'agendamento', component: RotaTeste },
          { path: 'agendamento-admin', component: RotaTeste },
        ]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  /** Cartão interno do "Agendamento de Salas" (ação, não link externo). */
  function acessoAgendamento(fixture: { nativeElement: HTMLElement }) {
    return Array.from(
      fixture.nativeElement.querySelectorAll<HTMLAnchorElement>('a[role="button"]'),
    ).find((link) => link.textContent?.includes('Agendamento de Salas'));
  }

  function autenticarComo(perfil: 'USER' | 'ADMIN'): void {
    window.localStorage.setItem('fourscheduler.usuario', 'Usuario Teste');
    window.localStorage.setItem('fourscheduler.token', 'token-jwt-123');
    window.localStorage.setItem('fourscheduler.perfil', perfil);
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Portal);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the portal hero', async () => {
    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Portal');
    expect(compiled.textContent).toContain('Foursys');
    expect(compiled.textContent).toContain('Juntos vamos mais longe.');
  });

  it('should render one card per portal app', async () => {
    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    const itens = (fixture.nativeElement as HTMLElement).querySelectorAll('li.portal__app');
    expect(itens.length).toBe(14);
  });

  it('should place the room booking access after the personal management portal', async () => {
    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    const nomes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.portal__nome'),
    ).map((item) => item.textContent?.trim());

    // O selo "Novo" entra no texto do cartão, então a comparação é por contenção.
    const agendamento = nomes.findIndex((nome) => nome?.includes('Agendamento de Salas'));
    const gestaoPessoal = nomes.findIndex((nome) => nome?.includes('Portal de Gestão Pessoal'));
    expect(agendamento).toBeGreaterThan(gestaoPessoal);
    expect(agendamento).toBe(nomes.length - 1);
  });

  it('should render the booking access as an internal portal action', async () => {
    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    const link = acessoAgendamento(fixture);
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Agendamento de Salas');
  });

  it('should show the Novo badge on the room booking access', async () => {
    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    const selo = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'a[role="button"] .portal__selo',
    );
    expect(selo?.textContent?.trim()).toBe('Novo');
  });

  it('should open the login from the booking access when there is no session', async () => {
    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    acessoAgendamento(fixture)?.click();
    fixture.detectChanges();

    const auth = TestBed.inject(AuthService);
    expect(auth.loginAberto()).toBe(true);
    // O destino leva o usuário à tela do perfil depois de autenticar.
    expect(auth.destinoLogin()).toBe('agendamento');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should take a regular user to the common booking screen', async () => {
    autenticarComo('USER');

    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    acessoAgendamento(fixture)?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/agendamento');
  });

  it('should take an administrator to the admin booking screen', async () => {
    autenticarComo('ADMIN');

    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    acessoAgendamento(fixture)?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/agendamento-admin');
  });

  it('should never show a separate administrative access, even for admins', async () => {
    window.localStorage.setItem('fourscheduler.usuario', 'Administrador Principal');
    window.localStorage.setItem('fourscheduler.token', 'token-admin');
    window.localStorage.setItem('fourscheduler.perfil', 'ADMIN');

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Portal],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    const itens = (fixture.nativeElement as HTMLElement).querySelectorAll('li.portal__app');
    expect(itens.length).toBe(14);

    const nomes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.portal__nome'),
    ).map((item) => item.textContent?.trim());

    // O administrador entra pelo mesmo acesso do portal e é redirecionado após o login.
    expect(nomes.some((nome) => nome?.includes('Agendamento administrativo'))).toBe(false);
  });
});
