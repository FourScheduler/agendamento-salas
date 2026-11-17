import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CalendarioData } from './calendario-data';

@Component({
  imports: [CalendarioData],
  template: `
    <app-calendario-data
      data="2026-11-16"
      minima="2026-11-16"
      (dataSelecionada)="selecionada = $event"
    >
      <input type="date" readonly value="2026-11-16" />
    </app-calendario-data>
  `,
})
class HostCalendarioData {
  selecionada = '';
}

describe('CalendarioData', () => {
  it('bloqueia datas anteriores ao mínimo e permite selecionar datas futuras sem limite máximo', () => {
    const fixture = TestBed.createComponent(HostCalendarioData);
    fixture.detectChanges();

    const calendario = fixture.nativeElement.querySelector('app-calendario-data') as HTMLElement;
    const dialogo = calendario.querySelector('dialog') as HTMLDialogElement;
    dialogo.showModal = vi.fn(() => dialogo.setAttribute('open', ''));
    dialogo.close = vi.fn(() => dialogo.removeAttribute('open'));
    calendario
      .querySelector('input')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(dialogo.open).toBe(true);

    const data = (valor: string) =>
      dialogo.querySelector(`[aria-label="${valor}"]`) as HTMLButtonElement;
    expect(data('15/11/2026').disabled).toBe(true);
    expect(data('16/11/2026').disabled).toBe(false);
    expect(data('21/11/2026').disabled).toBe(true);
    expect(data('22/11/2026').disabled).toBe(true);

    const entrada = calendario.querySelector('input') as HTMLInputElement;
    entrada.value = '2026-11-21';
    entrada.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(entrada.value).toBe('2026-11-16');

    for (let mes = 0; mes < 13; mes += 1) {
      (dialogo.querySelector('[aria-label="Próximo mês"]') as HTMLButtonElement).click();
      fixture.detectChanges();
    }

    expect(data('31/12/2027').disabled).toBe(false);
    data('31/12/2027').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selecionada).toBe('2027-12-31');
    expect(dialogo.open).toBe(false);
  });
});
