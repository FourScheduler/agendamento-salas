const MINUTOS_NO_DIA = 24 * 60;

export function hojeIso(): string {
  const agora = new Date();
  return paraIso(agora);
}

export function paraIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function proximaHoraCheia(): string {
  const agora = new Date();
  const hora = agora.getMinutes() > 0 ? agora.getHours() + 1 : agora.getHours();
  const limitada = Math.min(hora, 23);
  return `${String(limitada).padStart(2, '0')}:00`;
}

export function paraMinutos(hora: string): number | null {
  const partes = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!partes) {
    return null;
  }

  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);
  if (horas > 23 || minutos > 59) {
    return null;
  }

  return horas * 60 + minutos;
}

export function paraHora(minutos: number): string {
  const hora = String(Math.floor(minutos / 60)).padStart(2, '0');
  const minuto = String(minutos % 60).padStart(2, '0');
  return `${hora}:${minuto}`;
}

export function fimDeJornada(inicio: string, duracao: number): boolean {
  const parcial = paraMinutos(inicio);
  if (parcial === null) {
    return true;
  }

  return parcial + duracao >= MINUTOS_NO_DIA;
}

export function diaSemana(iso: string): string {
  const data = deIso(iso);
  if (!data) {
    return '';
  }

  return capitalizar(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(data));
}

export function dataExtenso(iso: string): string {
  const data = deIso(iso);
  if (!data) {
    return '';
  }

  return capitalizar(
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(data),
  );
}

export function dataCurta(iso: string): string {
  const data = deIso(iso);
  if (!data) {
    return '';
  }

  const partes = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
    .format(data)
    .replace(/\./g, '')
    .replace(/\s*de\s*/, ' ');

  return `${partes}, ${diaSemana(iso).toLowerCase()}`;
}

function deIso(iso: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!partes) {
    return null;
  }

  return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function normalizarNome(nome: string): string {
  return nome.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
