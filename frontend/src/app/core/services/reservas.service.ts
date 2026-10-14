import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BuscaReservasRequest,
  ConfirmacaoAgendamento,
  CriaAgendamentoRequest,
  Reserva,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  confirmar(request: CriaAgendamentoRequest): Observable<ConfirmacaoAgendamento> {
    return this.http.post<ConfirmacaoAgendamento>(`${this.baseUrl}/api/agendamento`, request);
  }

  /**
   * Lista as reservas do usuário autenticado.
   * Com `todosUsuarios: false` o backend filtra pelo usuário do token (JWT).
   */
  buscarFiltradas(filtro: BuscaReservasRequest): Observable<Reserva[]> {
    return this.http.request<Reserva[]>('GET', `${this.baseUrl}/api/agendamento/busca/filtro`, {
      body: filtro,
      responseType: 'json',
    });
  }
}
