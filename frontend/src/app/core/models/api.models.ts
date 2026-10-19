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

export interface CriaAgendamentoRequest {
  salaId: { id: number }[];
  data: string;
  horaInicio: string;
  horaFim: string;
  qntdPessoas: number;
  titulo: string;
}

export interface ConfirmacaoAgendamento {
  id: number;
  sala?: { id: number; nome: string };
  agendamentos?: { id: number; sala: { id: number; nome: string } }[];
  inicio: string;
  fim: string;
  status: string;
  solicitante: { id: number; nome: string; email: string };
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
  /** Compatibilidade temporária com respostas que usam `sala` em vez de `salaId`. */
  sala?: ReservaSala;
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

export interface SugestaoSala {
  salaId: number;
  nome: string;
  capacidade: number;
  localizacao: string;
}

export interface IniciarConversa {
  conversaId: number;
  status: StatusReserva;
}

/** Resposta de cada etapa da conversa do assistente (orquestrador do backend). */
export interface OrquestradorResposta {
  conversaId: number;
  estado: StatusReserva;
  mensagem: string;
  sugestoes: SugestaoSala[];
  /** Estado interpretado da conversa; nulo enquanto o valor ainda não foi informado. */
  data: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  qntdPessoas: number | null;
}
