export type EstadoSala = 'disponivel' | 'ocupada' | 'indisponivel';

export interface SalaPlanta {
  id: number;
  nome: string;
  /** Capacidade em pessoas; nula na Arena, que é de eventos e não limita as pessoas. */
  capacidade: number | null;
  localizacao: string;
  area: string;
  estado: EstadoSala;
  /** Sala restrita (Arena): reservável apenas pelo perfil ADMIN. */
  restrito: boolean;
}

interface SalaBase {
  id: number;
  nome: string;
  capacidade: number | null;
  area: string;
  restrito?: boolean;
}

const LOCALIZACAO = 'Tamboré';

/**
 * Espelho das migrations Flyway: ids, nomes e capacidades do banco.
 * O layout visual usa `area`; a disponibilidade vem da API por id.
 */
const SALAS_BASE: SalaBase[] = [
  { id: 1, nome: 'Sala 01', capacidade: 5, area: 'sala01' },
  { id: 2, nome: 'Sala 02', capacidade: 5, area: 'sala02' },
  { id: 3, nome: 'Sala 03', capacidade: 5, area: 'sala03' },
  { id: 4, nome: 'Sala Focus', capacidade: 2, area: 'focus' },
  { id: 5, nome: 'Componivel 01', capacidade: 8, area: 'comp01' },
  { id: 6, nome: 'Componivel 02', capacidade: 8, area: 'comp02' },
  { id: 7, nome: 'Componivel 03', capacidade: 8, area: 'comp03' },
  { id: 8, nome: 'Componivel 04', capacidade: 8, area: 'comp04' },
  { id: 9, nome: 'Arena', capacidade: null, area: 'arena', restrito: true },
  { id: 10, nome: 'Reunião Diretoria', capacidade: 4, area: 'diretoria' },
  { id: 11, nome: 'Cabine 01', capacidade: 4, area: 'cabine01' },
  { id: 12, nome: 'Cabine 02', capacidade: 4, area: 'cabine02' },
  { id: 13, nome: 'Cabine 03', capacidade: 1, area: 'cabine03' },
  { id: 14, nome: 'Cabine 04', capacidade: 1, area: 'cabine04' },
  { id: 15, nome: 'Cabine 05', capacidade: 1, area: 'cabine05' },
  { id: 16, nome: 'Cabine 06', capacidade: 1, area: 'cabine06' },
  { id: 17, nome: 'Cabine 07', capacidade: 1, area: 'cabine07' },
];

/** Cabines ocupam a faixa estreita da ala esquerda, com grade própria na planta. */
export function ehCabine(sala: { area: string }): boolean {
  return sala.area.startsWith('cabine');
}

export function resolverEstados(disponiveis: Array<{ id: number }>): SalaPlanta[] {
  const livres = new Set(disponiveis.map((sala) => sala.id));

  return SALAS_BASE.map((sala) => ({
    ...sala,
    localizacao: LOCALIZACAO,
    estado: livres.has(sala.id) ? 'disponivel' : 'ocupada',
    restrito: sala.restrito ?? false,
  }));
}
