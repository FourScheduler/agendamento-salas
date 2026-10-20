import { HttpClient, HttpParams } from '@angular/common/http';
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
   * Filtros vão na query string: navegadores não enviam corpo em GET.
   */
  buscarFiltradas(filtro: BuscaReservasRequest): Observable<Reserva[]> {
    let params = new HttpParams().set('todosUsuarios', String(filtro.todosUsuarios ?? false));

    if (filtro.dataInicio) {
      params = params.set('dataInicio', filtro.dataInicio);
    }
    if (filtro.dataFinal) {
      params = params.set('dataFinal', filtro.dataFinal);
    }
    if (filtro.statusAgendamento) {
      params = params.set('statusAgendamento', filtro.statusAgendamento);
    }

    return this.http.get<Reserva[]>(`${this.baseUrl}/api/agendamento/busca/filtro`, { params });
  }

  /** Cancela um agendamento do usuário autenticado (o backend valida a posse). */
  cancelar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/agendamento/cancelar/${id}`);
  }
}
