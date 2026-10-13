import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BuscaSalasRequest, Sala } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SalasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  buscarDisponiveis(request: BuscaSalasRequest): Observable<Sala[]> {
    return this.http.request<Sala[]>('GET', `${this.baseUrl}/api/salas/disponiveis`, {
      body: request,
      responseType: 'json',
    });
  }
}
