import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfirmacaoAgendamento, CriaAgendamentoRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  confirmar(request: CriaAgendamentoRequest): Observable<ConfirmacaoAgendamento> {
    return this.http.post<ConfirmacaoAgendamento>(`${this.baseUrl}/api/agendamento`, request);
  }
}
