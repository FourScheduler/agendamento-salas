import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, ErroResposta } from '../models/api.models';

const MENSAGENS_PADRAO: Record<number, string> = {
  0: 'Não foi possível conectar ao servidor.',
  400: 'Não foi possível processar a solicitação.',
  401: 'Faça login para continuar.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  409: 'A operação conflita com um registro existente.',
  500: 'Erro interno inesperado. Tente novamente.',
};

export function paraApiError(erro: unknown): ApiError {
  if (erro instanceof HttpErrorResponse) {
    const corpo = erro.error;
    if (ehErroResposta(corpo)) {
      return { status: corpo.status, message: corpo.message };
    }
    return { status: erro.status, message: mensagemDeStatus(erro.status) };
  }

  return { status: 0, message: MENSAGENS_PADRAO[0] };
}

export const apiErrorInterceptor: HttpInterceptorFn = (requisicao, proximo) =>
  proximo(requisicao).pipe(catchError((erro) => throwError(() => paraApiError(erro))));

function ehErroResposta(corpo: unknown): corpo is ErroResposta {
  if (typeof corpo !== 'object' || corpo === null) {
    return false;
  }

  const candidato = corpo as Partial<ErroResposta>;
  return typeof candidato.message === 'string' && typeof candidato.status === 'number';
}

function mensagemDeStatus(status: number): string {
  return MENSAGENS_PADRAO[status] ?? MENSAGENS_PADRAO[500];
}

export function mensagemDeErro(erro: unknown): string {
  if (erro && typeof erro === 'object' && 'message' in erro) {
    const mensagem = (erro as ApiError).message;
    if (typeof mensagem === 'string' && mensagem.length > 0) {
      return mensagem;
    }
  }

  return MENSAGENS_PADRAO[500];
}
