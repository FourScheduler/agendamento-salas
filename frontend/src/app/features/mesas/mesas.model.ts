export type EstadoMesa = 'free' | 'fixed';

export interface Mesa {
  readonly numero: number;
  readonly nome: string;
  readonly cadeira: 'topo' | 'base' | null;
}

export interface CelulaMapa {
  readonly chave: string;
  readonly mesa: Mesa | null;
}

export const ROTULOS_ESTADO: Record<EstadoMesa, string> = {
  free: 'Livre',
  fixed: 'Fixa',
};

export const NOMES_MESAS: Record<number, string> = {
  1: 'Hudson Silva', 2: 'Reginaldo Mazakina', 3: 'Cibele Porto', 4: 'Leandro Devesa',
  5: 'Felipe Freitas', 6: 'Felipe Gampietro', 7: 'Nilson Brito', 8: 'Flavio Lobo',
  9: 'Daniel Ponciano', 10: 'Mario Herrera', 11: 'Marketing', 12: 'Marketing',
  13: 'Alinne', 14: 'Ellen Vitória', 15: 'Paula', 16: 'Danilo Gaspar',
  17: 'Kevin Miranda', 18: 'Lucas Correia', 19: 'Bruno Gonçalves', 20: 'Nicolas Galvão',
  21: 'Alan Leão', 22: 'Iury Ferreira', 23: 'Lucas Souza', 24: 'Lucas Ferreira',
  25: 'João Victor Bigardi', 26: 'Guilherme Ferrari', 27: 'Gabriel Ferragute', 28: 'Arthur Agostinho',
  29: 'Luis Felipe Oliveira', 30: 'Victor Scopim', 31: 'Kauã Queiroz', 32: 'Henrique Vasconcelos',
  33: 'Rafael Silva', 34: 'Carlos Bispo', 35: 'Ana Paula', 36: 'Leandro Bido',
  37: 'Bianca Rodrigues', 38: 'Daniel Santana', 39: 'Lucas Abreú', 40: 'Ivan Goulart',
  41: 'Victor Ponciano', 42: 'Matheus Okada', 43: 'Rafael Papa', 44: 'TI',
  45: 'TI', 46: 'Livre', 47: 'Rafael Vasconcelos', 48: 'Felipe Rocha',
  49: 'Lucas Amaral', 50: 'Marcelo Lallo', 51: 'Felipe Veiga', 52: 'Pablo Bezerra',
  53: 'Livre', 54: 'Livre', 55: 'Livre', 56: 'Matheus Medeiros',
  57: 'Pierre Blaese', 58: 'Livre', 59: 'Livre', 60: 'Olga Morato',
  61: 'Fabiana de Meo', 62: 'Livre', 63: 'Marcos Marcelino', 64: 'Gernando Costa',
  65: 'Tatiane Cassimiro', 66: 'Reservado', 67: 'Fernando Trevisan', 68: 'Rodrigo Braiani',
  69: 'Ronaldo Pedroso', 70: 'Italo Fabiano', 71: 'Claudia Sato', 72: 'Bruno Amaral',
  73: 'Alessandra Rocha', 74: 'Leandro Germano', 75: 'Paulo Bello', 76: 'Adão Silva',
  77: 'Livre', 78: 'Livre', 79: 'Marcio Cavaliere', 80: 'Livre',
  81: 'Luciana Cavalcante', 82: 'Livre', 83: 'Livre', 84: 'Livre',
  85: 'Livre', 86: 'Livre', 87: 'Giselly', 88: 'Maurício Figueiredo',
  89: 'Fabiano Luiz', 90: 'Felipe Carneiro', 91: 'Diogo Cunha', 92: 'Gilberto Vieira',
  93: 'Derich Rosário', 94: 'Reservado', 95: 'Tiago Farias', 96: 'Livre',
  97: 'Livre', 98: 'Felipe Gimenez', 99: 'Luana Aguiar', 100: 'Shirley Bsrbosa',
  101: 'Rafaela Melo', 102: 'Vivian Marques', 103: 'Recrutamento RH', 104: 'Valdenir Ferreira',
  105: 'Livre', 106: 'Livre', 107: 'Livre', 108: 'Rafaella Belli',
  109: 'Isabella Melo', 110: 'Leonardo Cavalcante', 111: 'Laura Figueira', 112: 'Gustavo Henrique',
  113: 'Adrielly Rissi', 114: 'Caroline Zupo', 115: 'Katlen Delgado',
};

export const MESAS_LIVRES = new Set([
  44, 45, 46, 53, 54, 55, 58, 59, 62, 77, 78, 80, 82, 83, 84, 85, 86, 96, 97, 105, 106, 107,
]);
