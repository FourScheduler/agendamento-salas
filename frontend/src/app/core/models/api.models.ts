export interface ErroResposta {
  status: number;
  message: string;
  timestamp: string;
}

export interface ApiError {
  status: number;
  message: string;
}

export interface Sala {
  id: number;
  nome: string;
  disponivel: boolean;
  capacidade: number;
  localizacao: string;
}

export interface BuscaSalasRequest {
  data: string;
  horaInicio: string;
  horaFim: string;
  qntdPessoas: number;
}

export interface CriaReservaRequest {
  salaId: number;
  sala: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  quantidadePessoas: number;
  solicitante: string;
  titulo: string;
}

export interface Reserva {
  id: number;
  sala: string;
  inicio: string;
  fim: string;
  status: 'CONFIRMADA';
  solicitante: string;
}
