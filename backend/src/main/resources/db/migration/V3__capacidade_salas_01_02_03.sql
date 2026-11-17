UPDATE salas
SET capacidade = 5
WHERE nome IN ('Sala 01', 'Sala 02', 'Sala 03')
  AND localizacao = 'Tamboré';
