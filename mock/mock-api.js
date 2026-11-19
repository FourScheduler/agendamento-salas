const http = require('http');

const salas = [
  { id: 4, nome: 'Sala Focus', disponivel: true, capacidade: 2, localizacao: 'Tamboré' },
  { id: 6, nome: 'Sala Comp 02', disponivel: true, capacidade: 8, localizacao: 'Tamboré' },
  { id: 8, nome: 'Sala Comp 04', disponivel: true, capacidade: 8, localizacao: 'Tamboré' },
  { id: 1, nome: 'Sala 01', disponivel: true, capacidade: 5, localizacao: 'Tamboré' },
  { id: 2, nome: 'Sala 02', disponivel: true, capacidade: 5, localizacao: 'Tamboré' },
  { id: 3, nome: 'Sala 03', disponivel: true, capacidade: 5, localizacao: 'Tamboré' },
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
  const url = new URL(requisicao.url, 'http://localhost:8080');
  const pessoas = Number(url.searchParams.get('qntdPessoas') ?? 1);
  resposta.end(JSON.stringify(salas.filter((sala) => sala.capacidade >= pessoas)));
});

servidor.listen(8080, () => console.log('mock api em 8080'));
