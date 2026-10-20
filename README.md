# Agendamento de Salas

[![CI](https://github.com/LucasAbreu-94/agendamento-salas/actions/workflows/ci.yml/badge.svg)](https://github.com/LucasAbreu-94/agendamento-salas/actions/workflows/ci.yml)

MVP corporativo de agendamento de salas do Portal. A versão atual é demonstrável com dados mockados, para validação com o gestor, sem integrações externas.

## Estado atual

- Planta das salas com situação (livre/ocupada) consultada na API
- Login de demonstração pela topbar: nome digitado, token emitido pelo backend sem senha
- Confirmação de reserva pelo backend real via `POST /api/agendamento`
- Tela **Minhas reservas** com reservas futuras e passadas do usuário
- Nenhuma reserva é criada no Outlook; não há chamadas ao Microsoft Graph ou a serviços de IA

Integrações com Microsoft Graph, Outlook, Microsoft Entra ID e provedores de IA são futuras e não serão implementadas sem solicitação explícita (ver [AGENTS.md](AGENTS.md)).

## Estrutura

```text
agendamento-salas/
├── backend/    # API REST - Java 21, Spring Boot 4.1, Maven
├── frontend/   # Portal - Angular 21, TypeScript, componentes standalone
├── mock/       # API falsa em Node para rodar o frontend sem backend
├── docs/       # Arquitetura, regras de negócio, fluxo e padrão Git
└── AGENTS.md   # Instruções do projeto
```

## Pré-requisitos

- JDK 21+
- Node.js 22+ e npm
- MySQL (apenas para o backend; o mock da API não precisa)

## Como rodar (Windows)

### Backend (http://localhost:8080)

```powershell
cd backend
copy .env.example .env   # preencha DB_USERNAME, DB_PASSWORD e JWT_SECRET
.\mvnw.cmd spring-boot:run
```

As migrations do Flyway criam o schema e o usuário de demonstração `usuario@teste.com`. O profile `dev` é o padrão e já habilita o login demo (`app.auth.demo-enabled`).

### Frontend (http://localhost:4200)

```powershell
cd frontend
npm.cmd start
```

O frontend consome somente a API do backend em `http://localhost:8080`.

### Mock da API (sem backend e sem MySQL)

```powershell
node mock\mock-api.js
```

O mock responde em `http://localhost:8080` com a lista de salas para a tela de busca. Ele não implementa `/auth/demo` nem `/api/agendamento`: para testar login e confirmação de reserva, use o backend.

## Como testar

```powershell
# Backend (sempre com clean: compilados antigos de outra máquina conflitam)
cd backend
.\mvnw.cmd clean test

# Frontend
cd frontend
npm.cmd test -- --watch=false
npm.cmd run build
```

## Login de demonstração

1. Na topbar, clique em **Entrar**.
2. Digite seu nome e confirme.
3. O frontend chama `POST /auth/demo` e o backend emite um JWT do usuário do seed, sem senha.

O fluxo com e-mail e senha (`POST /auth/login`) continua disponível no backend para o futuro.

## Fluxo do MVP

1. Usuário acessa o Portal
2. Seleciona **Agendamento de Salas**
3. A tela já exibe a planta: informe data, horário, duração e quantidade de pessoas no painel
4. O sistema mostra as salas livres na planta
5. Usuário escolhe uma sala livre e revisa o resumo
6. A confirmação exige o login de demonstração
7. A reserva é registrada pela API e a tela mostra a confirmação
8. Em **Minhas reservas** (topbar) o usuário vê suas reservas

## Documentação

| Documento | Conteúdo |
|---|---|
| [AGENTS.md](AGENTS.md) | Instruções, regras gerais e identidade visual do projeto |
| [docs/arquitetura.md](docs/arquitetura.md) | Estado atual e evolução prevista |
| [docs/contratos-api.md](docs/contratos-api.md) | Contratos JSON das APIs |
| [docs/fluxo-mockado.md](docs/fluxo-mockado.md) | Fluxo de demonstração |
| [docs/regras-negocio.md](docs/regras-negocio.md) | Regras e validações da busca |
| [docs/padrao-git.md](docs/padrao-git.md) | Branches, Conventional Commits, PRs e versionamento |

## Versionamento

Git Flow (`main` / `develop` / `feature/*`), Conventional Commits e Semantic Versioning - detalhes em [docs/padrao-git.md](docs/padrao-git.md).
