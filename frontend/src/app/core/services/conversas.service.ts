import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IniciarConversa, OrquestradorResposta } from '../models/api.models';

/**
 * Fluxo de conversa do assistente de agendamento.
 * O backend interpreta a mensagem (IA), pergunta o que faltar,
 * sugere salas e confirma a reserva quando o usuário escolhe.
 */
@Injectable({ providedIn: 'root' })
export class ConversasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/agendamento/conversas`;

  iniciar(): Observable<IniciarConversa> {
    return this.http.post<IniciarConversa>(this.baseUrl, null);
  }

  enviarMensagem(conversaId: number, mensagem: string): Observable<OrquestradorResposta> {
    return this.http.post<OrquestradorResposta>(`${this.baseUrl}/mensagens`, {
      conversaId,
      mensagem,
    });
  }

  selecionarSala(conversaId: number, salaId: number): Observable<OrquestradorResposta> {
    return this.http.patch<OrquestradorResposta>(`${this.baseUrl}/${conversaId}/selecionar`, {
      salaId,
    });
  }

  confirmar(conversaId: number): Observable<OrquestradorResposta> {
    return this.http.post<OrquestradorResposta>(`${this.baseUrl}/${conversaId}/confirmar`, null);
  }
}
