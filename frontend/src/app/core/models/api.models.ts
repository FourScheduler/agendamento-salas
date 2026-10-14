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

export interface LoginRequest {
  email: string;
  password: string;
}

export type StatusReserva =
  | 'RECEBENDO_SOLICITACAO'
  | 'INTERPRETANDO'
  | 'AGUARDANDO_INFORMACAO'
  | 'CONSULTANDO_DISPONIBILIDADE'
  | 'AGUARDANDO_ESCOLHA'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'RESERVANDO'
  | 'CONFIRMADO'
  | 'CANCELADO'
  | 'ERRO';

export interface ReservaSala {
  id: number;
  nome: string;
  capacidade: number;
  localizacao: string;
}

export interface Reserva {
  salaId: ReservaSala;
  dataAgendamento: string;
  dataCriacao: string;
  horaInicio: string;
  horaFim: string;
  qntdPessoas: number;
  titulo: string | null;
  status: StatusReserva;
}

export interface BuscaReservasRequest {
  dataInicio: string | null;
  dataFinal: string | null;
  statusAgendamento: StatusReserva | null;
  todosUsuarios: boolean;
}
