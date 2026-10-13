import { TestBed } from '@angular/core/testing';
import { MapaSalas } from './mapa-salas';
import { resolverEstados } from '../../core/data/mapa-mock';

describe('MapaSalas', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaSalas],
    }).compileComponents();
  });

  function montar(disponiveis: string[], selecionada: string | null = null) {
    const fixture = TestBed.createComponent(MapaSalas);
    fixture.componentRef.setInput('salas', resolverEstados(disponiveis));
    fixture.componentRef.setInput('data', '2026-06-18');
    fixture.componentRef.setInput('horaInicio', '14:00');
    fixture.componentRef.setInput('selecionada', selecionada);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MapaSalas);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the eight rooms and the legend', () => {
    const fixture = montar(['Sala Comp 02']);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('button.sala').length).toBe(8);
    expect(compiled.querySelectorAll('.legenda__itens li').length).toBe(5);
    expect(compiled.querySelector('app-lista-salas')).toBeTruthy();
    expect(compiled.textContent).toContain('Layout ilustrativo');
    expect(compiled.textContent).toContain('Focus: 1 a 2 pessoas');
    expect(compiled.textContent).toContain('Time do suporte');
  });

  it('should disable occupied and unavailable rooms', () => {
    const fixture = montar(['Sala Comp 02']);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.sala--ocupada').length).toBe(5);
    expect(compiled.querySelectorAll('.sala--indisponivel').length).toBe(2);
    expect(compiled.querySelectorAll('.sala:disabled').length).toBe(7);
  });

  it('should emit the selected room', () => {
    const fixture = montar(['Sala Comp 02']);
    let escolhida = '';

    fixture.componentInstance.selecionar.subscribe((nome) => (escolhida = nome));
    const compilado = fixture.nativeElement as HTMLElement;
    const disponivel = Array.from(
      compilado.querySelectorAll<HTMLButtonElement>('button.sala'),
    ).filter((sala) => !sala.disabled);
    expect(disponivel.length).toBe(1);

    disponivel[0].click();

    expect(escolhida).toBe('Sala Comp 02');
  });

  it('should render the floor plan areas of the reference drawing', () => {
    const fixture = montar(['Sala Comp 02']);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.faixa--margem')).toBeTruthy();
    expect(compiled.querySelector('.faixa--corredor')).toBeTruthy();
    expect(compiled.querySelector('.faixa--janelas')).toBeTruthy();
    expect(compiled.querySelector('.faixa--rodape')).toBeTruthy();
    expect(compiled.querySelectorAll('.faixa[aria-hidden="true"]').length).toBe(5);
    expect(compiled.querySelectorAll('.estrutural').length).toBe(2);
    expect(compiled.querySelector('.sala[style*="focus"]')).toBeTruthy();
  });

  it('should keep the auditorium restricted with capacity and booking tooltip', () => {
    const fixture = montar(['Sala Comp 02']);
    const compiled = fixture.nativeElement as HTMLElement;
    const auditorio = compiled.querySelector('.sala--restrita');

    expect(auditorio).toBeTruthy();
    expect(auditorio?.querySelector('.sala__capacidade')?.textContent).toContain('A definir');
    expect(auditorio?.textContent).toContain('somente com um responsável');
    expect(auditorio?.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Reserve com a equipe de Facilities',
    );
    expect(auditorio?.tagName).toBe('DIV');
  });

  it('should show the empty state when every room is taken', () => {
    const fixture = montar([]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-vazio')).toBeTruthy();
    expect(compiled.querySelector('app-lista-salas')).toBeNull();
  });

  it('should show the error state with retry', () => {
    const fixture = TestBed.createComponent(MapaSalas);
    fixture.componentRef.setInput('salas', []);
    fixture.componentRef.setInput('erro', 'Falha de rede.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-erro')).toBeTruthy();
    expect(compiled.textContent).toContain('Falha de rede.');
  });
});
