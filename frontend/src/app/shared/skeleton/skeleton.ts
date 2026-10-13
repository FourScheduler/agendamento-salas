import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: `
    <span
      class="esqueleto"
      [style.width]="largura()"
      [style.height]="altura()"
      [style.border-radius]="raio()"
      aria-hidden="true"
    ></span>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .esqueleto {
        display: block;
        background: linear-gradient(
          90deg,
          var(--surface) 25%,
          #f7f8fa 50%,
          var(--surface) 75%
        );
        background-size: 200% 100%;
        animation: esqueleto-brilho 1.4s ease infinite;
      }

      @keyframes esqueleto-brilho {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .esqueleto {
          animation: none;
        }
      }
    `,
  ],
})
export class Skeleton {
  readonly largura = input('100%');
  readonly altura = input('1rem');
  readonly raio = input('6px');
}
