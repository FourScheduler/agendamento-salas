import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BuscaSalasRequest, OcupacaoSala, Sala } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SalasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  buscarDisponiveis(request: BuscaSalasRequest): Observable<Sala[]> {
    // Filtros vão na query string: navegadores não enviam corpo em GET.
    const params = new HttpParams()
      .set('data', request.data)
      .set('horaInicio', request.horaInicio)
      .set('horaFim', request.horaFim)
      .set('qntdPessoas', request.qntdPessoas);

    return this.http.get<Sala[]>(`${this.baseUrl}/api/salas/disponiveis`, { params });
  }

  /** Ocupações confirmadas do dia, usadas pela planta para indicar a próxima folga. */
  buscarOcupacoes(data: string): Observable<OcupacaoSala[]> {
    return this.http.get<OcupacaoSala[]>(`${this.baseUrl}/api/salas/ocupacoes`, {
      params: new HttpParams().set('data', data),
    });
  }
}
