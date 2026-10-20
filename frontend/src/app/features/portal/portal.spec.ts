import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Portal } from './portal';

describe('Portal', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portal],
      providers: [provideRouter([])],
    }).compileComponents();
  });

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

    const agendamento = nomes.indexOf('Agendamento de Salas');
    expect(agendamento).toBeGreaterThan(nomes.indexOf('Portal de Gestão Pessoal'));
    expect(agendamento).toBe(nomes.length - 1);
  });

  it('should link the booking access to the map route', async () => {
    const fixture = TestBed.createComponent(Portal);
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      'a[href="/agendamento"]',
    );
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Agendamento de Salas');
  });
});
