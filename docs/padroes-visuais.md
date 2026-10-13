# Padrões visuais do Portal

Referência extraída da página inicial oficial (`https://portal.app.foursys.com/`, salva em
`Portal Foursys.mhtml`) e do design do mapa de agendamento no Figma.

Todo componente novo do frontend deve seguir esta lista. Se algo aqui entrar em conflito com o
`AGENTS.md` da raiz, este documento passa a valer e o `AGENTS.md` é atualizado.

## 1. Cores

| Token           | Valor     | Uso                                               |
| --------------- | --------- | ------------------------------------------------- |
| `--navy`        | `#222239` | Barra superior, títulos fortes, texto de destaque |
| `--orange`      | `#ff5315` | Ações principais, links ativos, marca             |
| `--orange-400`  | `#ff892e` | Detalhes, avatar do usuário, borda de seleção     |
| `--orange-soft` | `#fde6da` | Fundo suave de ícone ou destaque                  |
| `--gray-50`     | `#f3f3f3` | Borda de painel flutuante                         |
| `--gray-100`    | `#eeeeee` | Divisórias internas                               |
| `--gray-150`    | `#d6d6d6` | Borda padrão                                      |
| `--gray-200`    | `#bbbbbb` | Borda de avatar e de controles                    |
| `--gray-300`    | `#9d9d9d` | Texto desabilitado                                |
| `--gray-500`    | `#6f6f6f` | Texto secundário                                  |
| `--gray-800`    | `#1e1e1e` | Texto principal                                   |
| `--disabled`    | `#f2f2f2` | Fundo de elemento desabilitado                    |
| `--page-bg`     | `#f7f8fa` | Fundo das telas                                   |
| `--green`       | `#30d158` | Ponto de disponibilidade                          |
| `--green-text`  | `#09a743` | Texto de confirmação                              |
| `--green-soft`  | `#dcf6e4` | Fundo de sala disponível (planta e lista)         |
| `--green-line`  | `#a9e6c0` | Borda de sala disponível                          |
| `--red-soft`    | `#fde3e3` | Fundo de sala ocupada                             |
| `--red-line`    | `#f7c3c3` | Borda de sala ocupada e indisponível              |

Regras:

- Fundo de tela é claro, nunca branco puro nem escuro.
- Cartões são brancos sobre o fundo claro, com borda de 1px.
- Laranja é usado com moderação: marca, ação principal e seleção. Nunca em texto corrido.
- Azul-marinho só aparece na barra superior e em títulos.

## 2. Tipografia

- Fonte base: `Nunito, sans-serif` (`html, body`), carregada pelo `index.html`.
- Fallback obrigatório: `sans-serif`, para funcionar sem internet.
- Título da página: `1.75rem`, peso 700, cor `--navy`.
- Subtítulo: `0.9375rem`, cor `--gray-500`.
- Rótulo de campo: `0.6875rem`, peso 700, caixa alta, `letter-spacing 0.1em`.
- Texto de cartão: `0.875rem` a `1rem`.
- Nada abaixo de `0.75rem`.

## 3. Barra superior

Padrão do portal (extraído do bundle oficial):

- Fundo `--navy`, `padding: 0 30px`, `height: 6vh` com `min-height: 50px` (a barra cresce em telas altas).
- À esquerda: símbolo laranja + texto `Portal` em branco, `1.25rem`, peso 600, com divisória branca de 2px
  (`border-right` e `padding-right: 1.25rem`) separando do menu.
- O símbolo é a imagem `public/logo-portal.png` (`<img>` decorativo, `alt=""`, com `height: 23px` e
  largura automática).
- Abaixo de `900px` o texto `Portal` e a divisória somem, deixando só o símbolo (mesma regra do portal).
- O favicon da aba é o mesmo `4SYS.ico` do portal (`/4SYS.ico`, ícone quadrado de 256x256 com o
  símbolo laranja), servido como `public/favicon.ico`. O logo horizontal nunca vira favicon: o
  navegador desenha o ícone em 16x16 quadrado e a imagem estica.
- Item de menu: `0.75rem` (12px), peso 700, `padding: 0.875rem 1.125rem`, com ícone de calendário,
  rótulo `Agendamento de Salas` e selo `Novo` em laranja, texto branco.
- Hover do item colore o texto em `--orange-400`; o item ativo fica com texto `--orange` e
  `border-bottom: 2px solid var(--orange)`, igual ao portal. O item fica ativo só na rota
  `agendamento`; a rota inicial (`''`) abre a home mockada do portal (`portal`).
- À direita: nome do usuário + avatar circular de 2rem, fundo branco, borda 1px `--gray-200`,
  texto `--navy` com as iniciais. O nome some até `700px`.
- Ícones da barra são brancos. Fundo transparente nos botões de ícone.

## 4. Estrutura de página

- Container centralizado, largura máxima de 1500px, `padding: 2rem clamp(1.5rem, 4vw, 4rem) 4rem`.
- Breakpoints do portal: `599px`, `700px`, `900px`, `1200px` e `1800px`. Este projeto usa `700px`
  (topbar e lista de salas) e `900px` (colunas do agendamento).
- Cabeçalho no topo: sobretítulo laranja em caixa alta (`TAMBORÉ`), título, subtítulo.
- Áreas de conteúdo em grid simples, com gap de 2.5rem; a coluna do resumo tem 360px.
- Em telas estreitas, as colunas empilham em uma única coluna.

## 5. Superfícies e cartões

- `border: 1px solid var(--gray-150)` ou mais clara, `border-radius: 8px` a `10px`,
  fundo `#ffffff`.
- Espaçamento interno entre 1rem e 1.5rem.
- Sombra só em hover de item interativo, nunca em cartão estático.
- Cabeçalho de cartão separado por linha divisória, não por sombra.

## 6. Botões

- Ação primária: fundo `--orange`, texto branco, altura mínima de 44px, raio de 8px, peso 600.
- Hover escurece levemente; desabilitado usa opacidade 0.55 e cursor `not-allowed`.
- Botão secundário: fundo branco, borda `--gray-150`, texto `--gray-800`.
- Ícone de seta dentro do botão fica à direita do rótulo.

## 7. Campos de formulário

- Rótulo acima, campo abaixo, gap de 0.375rem.
- Altura mínima de 44px, borda 1px `--gray-150`, raio de 8px, fundo branco.
- Foco com borda `--orange` e anel de foco visível (`:focus-visible`).
- Erro em texto pequeno, cor de erro, sempre com `role="alert"`.

## 8. Estados de carregamento, vazio e erro

Todo bloco que depende de API precisa dos quatro estados:

- Carregando: mensagem centralizada com indicador pulsante, `role="status"`.
- Sucesso com dados: renderiza o conteúdo.
- Vazio: ícone, título, mensagem de orientação e ação opcional.
- Erro: `role="alert"`, título, mensagem vinda da API e botão `Tentar novamente`.

Nunca deixe a área em branco enquanto a chamada acontece.

## 9. Selos e etiquetas

- Selo `Novo`: fundo `--orange`, texto branco, `0.6875rem`, peso 700, raio total.
- Situação de sala: texto curto com ícone. Disponível com fundo `--green-soft` e borda `--green-line`,
  ocupada com fundo `--red-soft`, indisponível com hachura diagonal em vermelho claro, selecionada com
  borda `--orange-400` e marca de confirmação, restrito com fundo `--disabled` e borda tracejada.
- A legenda de estados e as amostras de cor (`legenda__itens`, `legenda__nota` e `amostra`) ficam em
  `styles.css` como padrão global, junto com as demais classes compartilhadas.

## 10. Acessibilidade

- Todo campo tem `<label>` associado por `for` ou `id`.
- Botões e links são `<button>` ou `<a>` reais, com `type` explícito.
- Áreas de status usam `role="status"` e erros usam `role="alert"`.
- Foco visível em todos os elementos interativos.
- Ícones decorativos têm `aria-hidden="true"`.

## 11. Restrições

- Não exibir o texto `CCH`.
- Não carregar SDKs de IA, Graph ou Outlook no frontend.
- Não usar cores fora desta tabela sem registrar o token aqui primeiro.
- Nenhuma tela nova começa sem passar por esta lista.

## 12. Planta do escritório

A planta (`mapa-salas.css`) é um `grid` de CSS com proporção fixa `aspect-ratio: 2490 / 1091`,
com a disposição espelhada do desenho de referência do escritório:

- Colunas, da esquerda para a direita: corredor lateral, Sala 01, Sala 02, Sala 03, corredor central
  na vertical, Sala Comp 01 com Sala Comp 02, Sala Comp 03 com Sala Comp 04 e faixa de janelas.
- Linhas, de cima para baixo: faixa de circulação, fileira de salas (o Auditório acompanha as duas
  primeiras fileiras), Sala de servidores à esquerda com o Time do suporte ao lado, fileira de baixo
  com a Sala Focus à esquerda e as Comp 03 e Comp 04 à direita, faixa de mesas.
- A Sala de servidores e o Time do suporte não são reserváveis: fundo `--page-bg`, borda tracejada e
  rótulo em caixa alta. Não entram na legenda de estados.
- O Auditório é uma sala restrita (`<div class="sala sala--restrita">`, não é `<button>`): fundo
  `--disabled`, borda tracejada, capacidade `A definir`, selo `Agendamento somente com um
responsável` e dica acessível com `Reserve com a equipe de Facilities`. É o quinto estado da legenda,
  `Restrito`, e só passa a ser reservável quando existir usuário admin (issue de login).
- A dica (`.dica` e `.dica__caixa`) é um padrão global de `styles.css`, aberta no hover e no
  `:focus-visible`, com `role="tooltip"` e `aria-describedby`.
- Áreas estáticas (circulação, mesas e janelas) usam texto curto em caixa alta, `0.5625rem`, peso 700
  e cor `--muted-soft`; as verticais usam `writing-mode: vertical-rl`.
- Cada sala é um `<button>` posicionado por `grid-area`, com os estados da seção 9.
- A célula da sala mostra só o nome e a capacidade máxima no formato curto `Até N` (Focus 2, Salas 01
  a 03 com 4, Comp 01 a 04 com 8). As regras de grupo ficam fora da planta, na nota
  `legenda__regras` do rodapé do cartão.
- Em telas estreitas a planta mantém `min-width: 640px` e o corpo do cartão ganha rolagem
  horizontal. A rolagem fica só na `.planta__rolagem`, para a lista de baixo não acompanhar o
  arraste.
- Abaixo de `700px` a lista de salas (`app-lista-salas`) aparece sob a planta e vira o principal
  caminho de seleção: uma linha por sala com nome, capacidade, amostra e estado. Acima desse
  breakpoint a lista fica com `display: none` e a planta continua sendo usada.
- A lista reusa as amostras globais (`.amostra`) e os mesmos estados da planta, com seleção
  espelhada nos dois lugares.

## 13. Painel de resumo

- Seletor de pessoas em stepper `-` / `+`. Com sala selecionada o `+` trava na capacidade da sala
  (classe `naCapacidade`) e a linha `resumo__limite` mostra `Esta sala comporta até N pessoas.`
- Equipamentos: linha com checkbox (`linha--check`), rótulo `Equipamentos` e valor
  `Câmera e recursos para reunião híbrida`, seguida da nota
  `Solicite o equipamento previamente à equipe de Facilities.`
- O estado de equipamentos é local, no signal `equipamentos` do `Agendamento`, e entra no contrato de
  reserva quando a confirmação for implementada.

## 14. Home do portal (mock)

- Rota `portal`, inicial da aplicação (`''` → `portal`) e destino do catch-all. O acesso
  `Agendamento de Salas` leva para `/agendamento`.
- Hero: `Portal ` em `--orange`, `Foursys` em `--navy`, ambos `1.25rem` peso 700, frase
  `Juntos vamos mais longe.`, faixa cinza `#f8f8f9` com raio de 42px atrás do bloco e ilustração
  `public/apps/hero-home.svg` à direita.
- Grade de apps: caixa de 8rem, ícone de 2.25rem, nome de 13px peso 600 em `--navy`, hover com
  sombra suave e `transform: scale(1.05)`.
- 14 acessos: os 13 do portal oficial mais `Agendamento de Salas`, colocado logo depois de
  `Portal de Gestão Pessoal`. Ícones oficiais em `public/apps/`; o do agendamento é um calendário SVG
  criado para o projeto.
- Rodapé com `* Esses links só podem ser acessados pela VPN.` e a versão `V.6.5.4`.
- Os links oficiais abrem em nova aba (`target="_blank"` e `rel="noopener noreferrer"`).
