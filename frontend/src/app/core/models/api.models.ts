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

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

export interface CriarAgendamentoRequest {
  salaId: { id: number };
  data: string;
  horaInicio: string;
  horaFim: string;
  qntdPessoas: number;
  titulo: string | null;
}

export interface ConfirmacaoAgendamento {
  id: number;
  sala: Sala;
  inicio: string;
  fim: string;
  status: string;
  solicitante: {
    id: number;
    email: string;
    nome: string | null;
    perfilUsuario: string;
  };
}

export interface UsuarioResumo {
  id: number;
  email: string;
  nome: string | null;
  perfilUsuario: string;
}

export interface AgendamentoResumo {
  salaId: Sala;
  dataAgendamento: string;
  dataCriacao: string;
  horaInicio: string;
  horaFim: string;
  qntdPessoas: number;
  titulo: string | null;
  usuarioIdSolicitante: UsuarioResumo | null;
  status: string;
}
