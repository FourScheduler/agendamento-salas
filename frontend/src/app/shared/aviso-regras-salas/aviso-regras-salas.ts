import { afterNextRender, Component, ElementRef, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-aviso-regras-salas',
  templateUrl: './aviso-regras-salas.html',
  styleUrl: './aviso-regras-salas.css',
})
export class AvisoRegrasSalas {
  readonly fechado = output<void>();
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly regras = [
    { titulo: 'Cadeira', icone: 'cadeira', texto: 'Ajuste a altura e encaixe corretamente embaixo da mesa.' },
    { titulo: 'Cadeiras emprestadas', icone: 'cadeiras-emprestadas', texto: 'Devolva as cadeiras emprestadas ao local de origem após o uso.' },
    { titulo: 'Controle', icone: 'controle', texto: 'Guarde-os nos suportes disponíveis. Não os deixe sobre a mesa.' },
    { titulo: 'Lixo', icone: 'lixo', texto: 'Descarte somente papéis nas lixeiras. Proibido jogar resíduos orgânicos.' },
    { titulo: 'Cabo HDMI', icone: 'hdmi', texto: 'Após o uso, guarde o cabo HDMI na caixa de cabos.' },
    { titulo: 'Ar-condicionado', icone: 'ar-condicionado', texto: 'Desligue ao sair.' },
    { titulo: 'Televisão', icone: 'televisao', texto: 'Desligue após o uso.' },
    { titulo: 'Proibido comer', icone: 'proibido-comer', texto: 'Não é permitido comer nas salas de reunião (exceto em eventos, com aviso prévio à equipe de Facilities).' },
  ];

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }
}
