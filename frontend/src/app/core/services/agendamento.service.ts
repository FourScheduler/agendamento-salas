import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgendamentoResumo, ConfirmacaoAgendamento, CriarAgendamentoRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  confirmar(requisicao: CriarAgendamentoRequest): Observable<ConfirmacaoAgendamento> {
    return this.http.post<ConfirmacaoAgendamento>(
      `${this.baseUrl}/api/agendamento`,
      requisicao,
    );
  }

  listar(): Observable<AgendamentoResumo[]> {
    return this.http.get<AgendamentoResumo[]>(`${this.baseUrl}/api/agendamento/meus`);
  }
}
