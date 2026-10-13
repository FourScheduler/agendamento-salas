# Agendamento de Salas — Instruções do projeto

## Visão geral

Este repositório contém o MVP de um sistema corporativo de agendamento de salas. A primeira versão será demonstrável, com dados mockados, para validação com o gestor.

Integrações com Microsoft Graph, Outlook, Microsoft Entra ID e provedores de IA (Gemini, OpenAI ou Azure OpenAI) são futuras. Não implemente nenhuma delas sem solicitação explícita.

## Estrutura e tecnologias

- `backend/`: API REST com Java 21, Spring Boot 4.1 e Maven.
- `frontend/`: aplicação Angular 21 com TypeScript, CSS e componentes standalone.
- `docs/`: arquitetura, regras de negócio e fluxo do MVP.

Durante o desenvolvimento, Angular roda em `http://localhost:4200` e Spring Boot em `http://localhost:8080`. O frontend deve chamar somente a API do backend; credenciais e chaves, quando existirem, pertencem exclusivamente ao backend.

Leia os documentos relevantes em `docs/` antes de implementar uma tarefa.

## Variáveis de ambiente

O backend lê banco e autenticação de um arquivo `backend/.env`, que não é versionado. Consulte `backend/.env.example` para a lista de variáveis. Nunca versione valores reais.

## Regras gerais

- Banco de dados MySQL e Spring Security estão autorizados para usuários e autenticação; Microsoft Graph e APIs de IA continuam proibidos sem pedido explícito.
- Não alterar tecnologias, versões ou adicionar dependências sem necessidade clara.
- Não expor ou versionar senhas, tokens, chaves ou outras credenciais.
- Manter alterações pequenas, focadas e compatíveis com o comportamento existente.
- Priorizar legibilidade, nomes claros e responsabilidades bem separadas; evitar duplicação e abstrações prematuras.
- Execute os testes ou builds relacionados à alteração e informe o resultado.

## Fluxo do MVP

1. Usuário abre a home mockada do Portal (`/portal`) e clica em **Agendamento de Salas**, o acesso logo depois de **Portal de Gestão Pessoal**.
2. A tela do agendamento já é o mapa: ele informa data, horário, duração e quantidade de pessoas no painel de resumo.
3. O sistema apresenta a planta com as salas mockadas e a situação de cada uma.
4. O usuário escolhe uma sala livre e revisa o resumo da reserva; o seletor de pessoas respeita a capacidade da sala.
5. A confirmação fica disponível após o login. Nesta etapa, nenhuma reserva é criada no Outlook.

## Salas mockadas

- Sala Focus (Tamboré): 1 a 2 pessoas
- Sala Comp 01 (Tamboré): 8 pessoas
- Sala Comp 02 (Tamboré): 8 pessoas
- Sala Comp 03 (Tamboré): 8 pessoas
- Sala Comp 04 (Tamboré): 8 pessoas
- Sala 01 (Tamboré): 4 pessoas
- Sala 02 (Tamboré): 4 pessoas
- Sala 03 (Tamboré): 4 pessoas

Regras de grupo: Focus para 1 a 2 pessoas, Salas 01 a 03 até 4, Comp a partir de 5. Reuniões com mais de 10 pessoas integram salas, conforme disponibilidade. Equipamentos de reunião híbrida são solicitados à equipe de Facilities.

## Identidade visual

- Os padrões obrigatórios de todas as telas estão em `docs/padroes-visuais.md`, com os tokens extraídos do portal oficial (`portal.app.foursys.com`).
- Barra superior `#222239`, símbolo laranja à esquerda e texto `Portal` com divisória branca.
- Ações principais em laranja `#ff5315`; detalhes, ícones de estado e avatar em `#ff892e`.
- Fundo das telas `#f7f8fa`, cartões brancos com borda de 1px, fonte `Nunito`.
- Não exibir o texto `CCH`.
- Interface corporativa, limpa, minimalista e responsiva.
- O acesso se chama **Agendamento de Salas**, usa ícone de calendário e exibe a etiqueta `Novo`.

## Comandos

No Windows:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run

cd ..\frontend
npm.cmd start
npm.cmd test
npm.cmd run build
```
