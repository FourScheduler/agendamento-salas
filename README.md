# Agendamento de Salas

[![CI](https://github.com/LucasAbreu-94/agendamento-salas/actions/workflows/ci.yml/badge.svg)](https://github.com/LucasAbreu-94/agendamento-salas/actions/workflows/ci.yml)

MVP corporativo de agendamento de salas do Portal. A primeira versão é **demonstrável com dados mockados**, para validação com o gestor — sem integrações externas.

## Status

**Fase 1 — MVP mockado**

- Busca de salas com dados mockados (data, horário, duração e quantidade de pessoas)
- Exibição das salas disponíveis, escolha e confirmação com retorno visual
- Nenhuma reserva é criada no Outlook e não há chamadas ao Microsoft Graph ou a serviços de IA

Integrações com Microsoft Graph, Outlook, Microsoft Entra ID e provedores de IA são **futuras** e não serão implementadas sem solicitação explícita (ver [AGENTS.md](AGENTS.md)).

## Estrutura

```text
agendamento-salas/
├── backend/    # API REST — Java 21, Spring Boot 4.1, Maven
├── frontend/   # Portal — Angular 21, TypeScript, componentes standalone
├── docs/       # Arquitetura, regras de negócio, fluxo e padrão Git
└── AGENTS.md   # Instruções do projeto
```

## Pré-requisitos

- JDK 21+
- Node.js 22+ e npm

## Como rodar (Windows)

```powershell
# Backend (http://localhost:8080)
cd backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run

# Frontend (http://localhost:4200)
cd frontend
npm.cmd start
npm.cmd test
npm.cmd run build
```

O frontend consome somente a API do backend.

### Mock da API (sem backend)

Para rodar so o frontend, sem subir o Spring nem o MySQL:

```powershell
node mock\mock-api.js
```

O mock responde em `http://localhost:8080` com a lista de salas e ja atende o frontend na porta 4200.

## Fluxo do MVP

1. Usuário acessa o Portal
2. Seleciona **Agendamento de Salas**
3. Informa data, horário, duração e quantidade de pessoas
4. O sistema apresenta salas mockadas disponíveis
5. Usuário escolhe a sala, revisa os dados e confirma
6. Exibição de confirmação visual (sem criação de evento no Outlook)

## Documentação

| Documento | Conteúdo |
|---|---|
| [AGENTS.md](AGENTS.md) | Instruções, regras gerais e identidade visual do projeto |
| [docs/arquitetura.md](docs/arquitetura.md) | Estado atual e evolução prevista |
| [docs/fluxo-mockado.md](docs/fluxo-mockado.md) | Fluxo de demonstração |
| [docs/regras-negocio.md](docs/regras-negocio.md) | Regras e validações da busca |
| [docs/padrao-git.md](docs/padrao-git.md) | Branches, Conventional Commits, PRs e versionamento |

## Versionamento

Git Flow (`main` / `develop` / `feature/*`), Conventional Commits e Semantic Versioning — detalhes em [docs/padrao-git.md](docs/padrao-git.md).
