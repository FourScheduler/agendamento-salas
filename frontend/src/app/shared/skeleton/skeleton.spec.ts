import { TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Skeleton],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Skeleton);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a hidden block with the given sizes', async () => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.componentRef.setInput('largura', '12rem');
    fixture.componentRef.setInput('altura', '2rem');
    fixture.componentRef.setInput('raio', '8px');
    fixture.detectChanges();
    await fixture.whenStable();

    const bloco = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.esqueleto');
    expect(bloco).toBeTruthy();
    expect(bloco?.getAttribute('aria-hidden')).toBe('true');
    expect(bloco?.style.width).toBe('12rem');
    expect(bloco?.style.height).toBe('2rem');
    expect(bloco?.style.borderRadius).toBe('8px');
  });

  it('should fall back to the default block size', () => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.detectChanges();

    const bloco = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.esqueleto');
    expect(bloco?.style.width).toBe('100%');
    expect(bloco?.style.height).toBe('1rem');
  });
});
