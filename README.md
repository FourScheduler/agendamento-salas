# Agendamento de Salas

[![CI](https://github.com/LucasAbreu-94/agendamento-salas/actions/workflows/ci.yml/badge.svg)](https://github.com/LucasAbreu-94/agendamento-salas/actions/workflows/ci.yml)

MVP corporativo de agendamento de salas do Portal. A versão atual é demonstrável com dados mockados, para validação com o gestor, sem integrações externas.

## Estado atual

- Planta das salas com situação (livre/ocupada) consultada na API
- Login pela topbar com e-mail e senha (`POST /auth/login`), permanecendo na página após entrar; quem direciona é o acesso **Agendamento de Salas** do portal, conforme o perfil: `USER` vai para o agendamento comum e `ADMIN` para o administrativo
- Tela administrativa `/agendamento-admin`: várias salas por reserva, duração até o fim do dia via stepper com atalhos, escolha do solicitante e reserva da Arena (sala restrita de eventos, exclusiva de `ADMIN`) — a reserva aparece nos **Minhas reservas** da pessoa escolhida
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

As migrations do Flyway criam o schema e os usuários de demonstração (`admin@teste.com` e `usuario@teste.com`), todos com a senha de demonstração definida no seed.

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

O mock responde em `http://localhost:8080` com a lista de salas para a tela de busca. Ele não implementa `/auth/login` nem `/api/agendamento`: para testar login e confirmação de reserva, use o backend.

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

## Login

1. Na topbar, clique em **Entrar**.
2. Informe o e-mail e a senha da conta e confirme.
3. O frontend chama `POST /auth/login`; o backend emite um JWT e o nome e o perfil vêm de `GET /api/usuarios/me`.

Os usuários criados pelas migrations compartilham a senha de demonstração definida no seed. O portal não tem acesso separado para administradores: com sessão ativa, o acesso **Agendamento de Salas** leva `ADMIN` para `/agendamento-admin` e `USER` para `/agendamento`; sem sessão, o clique abre o login e segue para a tela do perfil após autenticar.

As telas de agendamento só abrem com sessão ativa: sem login, o guard devolve o usuário ao portal. O botão **Sair** encerra a sessão e redireciona para o portal.

## Fluxo do MVP

1. Usuário acessa o Portal e entra com e-mail e senha; o login pela topbar permanece no portal — quem direciona é o acesso **Agendamento de Salas**
2. Seleciona **Agendamento de Salas** — com sessão, direciona para a tela do perfil (`USER` comum, `ADMIN` administrativa); sem sessão, o clique abre o login e segue para a mesma tela após autenticar
3. A tela já exibe a planta: informe data, horário, duração e quantidade de pessoas no painel
4. O sistema mostra as salas livres na planta
5. Usuário escolhe uma sala livre e revisa o resumo; no modo administrativo escolhe várias salas, ajusta a duração com o stepper até o fim do dia e pode reservar a Arena (sala restrita de eventos, exclusiva de `ADMIN`)
6. A reserva é registrada pela API e a tela mostra a confirmação
7. Em **Minhas reservas** (topbar) o usuário vê suas reservas; as reservas que um administrador fez para outra pessoa aparecem nos Minhas reservas dessa pessoa
8. **Sair** encerra a sessão e volta ao portal

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
