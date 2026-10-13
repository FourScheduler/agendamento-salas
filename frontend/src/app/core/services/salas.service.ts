import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BuscaSalasRequest, Sala } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SalasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  buscarDisponiveis(request: BuscaSalasRequest): Observable<Sala[]> {
    const params = new HttpParams()
      .set('data', request.data)
      .set('inicio', request.horaInicio)
      .set('fim', request.horaFim)
      .set('pessoas', request.qntdPessoas);

    return this.http.get<Sala[]>(`${this.baseUrl}/api/salas/disponiveis`, { params });
  }
}
