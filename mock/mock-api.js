const http = require('http');

const salas = [
  { id: 1, nome: 'Sala Focus', disponivel: true, capacidade: 2, localizacao: 'Tamboré' },
  { id: 3, nome: 'Sala Comp 02', disponivel: true, capacidade: 8, localizacao: 'Tamboré' },
  { id: 5, nome: 'Sala Comp 04', disponivel: true, capacidade: 8, localizacao: 'Tamboré' },
  { id: 7, nome: 'Sala 02', disponivel: true, capacidade: 4, localizacao: 'Tamboré' },
];

const cabecalhos = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

const servidor = http.createServer((requisicao, resposta) => {
  if (requisicao.method === 'OPTIONS') {
    resposta.writeHead(204, cabecalhos);
    resposta.end();
    return;
  }

  resposta.writeHead(200, cabecalhos);
  resposta.end(JSON.stringify(salas));
});

servidor.listen(8080, () => console.log('mock api em 8080'));
