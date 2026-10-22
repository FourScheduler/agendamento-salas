import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Lista os cadastrados; o backend exige perfil ADMIN nesse endpoint. */
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/api/usuarios`);
  }
}
