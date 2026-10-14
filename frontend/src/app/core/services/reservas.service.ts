import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CriaReservaRequest, Reserva } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  confirmar(request: CriaReservaRequest): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.baseUrl}/api/reservas`, request);
  }
}
