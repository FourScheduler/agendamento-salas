import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  readonly usuario = input<string | null>(null);

  readonly sair = output<void>();

  readonly iniciais = computed(() => {
    const nome = this.usuario();
    if (!nome) {
      return '';
    }

    const partes = nome.includes('@')
      ? [nome.slice(0, nome.indexOf('@')), nome.slice(nome.indexOf('@') + 1)]
      : nome.trim().split(/\s+/);

    return partes
      .filter((parte) => parte.length > 0)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  });
}
