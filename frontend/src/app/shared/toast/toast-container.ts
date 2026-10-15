import { Component, inject, computed, signal } from '@angular/core';
import { ToastService, Toast } from './toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  private readonly toastService = inject(ToastService);

  readonly toasts = computed(() => this.toastService.toasts());
  readonly pausar = signal(false);

  remover(id: number): void {
    this.toastService.remover(id);
  }

  icone(tipo: Toast['tipo']): string {
    switch (tipo) {
      case 'sucesso':
        return 'M10 16.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM6.5 10l2.5 2.5 4-4';
      case 'erro':
        return 'M10 16.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM10 5.5v5M10 13.5v.5';
      case 'aviso':
        return 'M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM10 6v4M10 12.5v.5';
      default:
        return 'M10 16.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM10 5.5v5M10 13.5v.5';
    }
  }
}