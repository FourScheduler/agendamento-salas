import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro, paraApiError } from './api-error';

describe('api-error', () => {
  it('should map the backend error payload', () => {
    const httpErro = new HttpErrorResponse({
      error: { status: 400, message: 'Informe o horário inicial da reserva.' },
      status: 400,
      statusText: 'Bad Request',
    });

    expect(paraApiError(httpErro)).toEqual({
      status: 400,
      message: 'Informe o horário inicial da reserva.',
    });
  });

  it('should fallback when the body has no error payload', () => {
    const httpErro = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });

    expect(paraApiError(httpErro)).toEqual({
      status: 500,
      message: 'Erro interno inesperado. Tente novamente.',
    });
  });

  it('should map a JSON error payload received as text', () => {
    // Endpoints com responseType 'text' (ex.: /auth/login) trazem o corpo como string.
    const httpErro = new HttpErrorResponse({
      error: '{"status":401,"message":"E-mail ou senha inválidos."}',
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(paraApiError(httpErro)).toEqual({
      status: 401,
      message: 'E-mail ou senha inválidos.',
    });
  });

  it('should fallback when the text body is not valid JSON', () => {
    const httpErro = new HttpErrorResponse({
      error: 'não é json',
      status: 502,
      statusText: 'Bad Gateway',
    });

    expect(paraApiError(httpErro)).toEqual({
      status: 502,
      message: 'Erro interno inesperado. Tente novamente.',
    });
  });

  it('should describe a network failure', () => {
    const httpErro = new HttpErrorResponse({ status: 0 });

    expect(paraApiError(httpErro)).toEqual({
      status: 0,
      message: 'Não foi possível conectar ao servidor.',
    });
  });

  it('should fallback for unknown errors', () => {
    expect(paraApiError('algo inesperado')).toEqual({
      status: 0,
      message: 'Não foi possível conectar ao servidor.',
    });
  });

  it('should read the message from a normalized error', () => {
    expect(mensagemDeErro({ status: 404, message: 'Sala não encontrada.' })).toBe(
      'Sala não encontrada.',
    );
  });

  it('should fallback for messages without a message', () => {
    expect(mensagemDeErro({ status: 500 })).toBe('Erro interno inesperado. Tente novamente.');
  });
});
