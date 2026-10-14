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
  salaId: { id: number };
  data: string;
  horaInicio: string;
  horaFim: string;
  qntdPessoas: number;
  titulo: string;
}

export interface ConfirmacaoAgendamento {
  id: number;
  sala: { id: number; nome: string };
  inicio: string;
  fim: string;
  status: string;
  solicitante: { id: number; nome: string; email: string };
}
