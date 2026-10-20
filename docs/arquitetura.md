# Arquitetura

## Estado atual

O sistema é um MVP sem integrações externas com o Microsoft Graph. As salas e reservas são simuladas para apresentar o fluxo completo. A busca de salas já possui endpoint mockado (`GET /api/salas/disponiveis`).

Usuários e autenticação usam MySQL local com Spring Security e JWT. Os testes do backend rodam com H2 em memória (`backend/src/test/resources/application-test.yaml`), sem exigir um banco de verdade.

A interpretação em linguagem natural (Ollama local) está integrada ao assistente do agendamento: o front abre a conversa em `/api/agendamento/conversas` e envia as mensagens por lá; o backend conversa com o modelo e devolve as sugestões de sala. O modelo roda no Ollama da máquina de desenvolvimento (`ollama.url`/`ollama.model`).

## Fluxo técnico

```text
Angular (localhost:4200) -> Spring Boot (localhost:8080) -> serviços mockados
                                                |
                                                +-> MySQL (usuários)
```

No futuro, apenas o backend poderá integrar IA e Microsoft Graph. O frontend continuará consumindo endpoints próprios da API.

## Segurança

- `POST /auth/login`, `POST /auth/demo`, `GET /api/salas/disponiveis`, `GET /api/salas/ocupacoes` e `GET /api/salas/{id}` são públicos.
- `POST /api/usuarios` e `POST /api/salas/admin/criar` exigem perfil `ADMIN`.
- Qualquer outra rota (incluindo `/api/ollama/**` e `/api/agendamento/**`) exige token JWT válido.
- Sem token ou com token inválido a resposta é `401`; sem perfil adequado é `403`, ambos no modelo de erro padrão.
- O `JwtAuthenticationFilter` não autenta requisições com token inválido; a requisição segue a cadeia e cai no `401`.
- Recursos por usuário (conversas, reservas) são resolvidos pelo **token**, não pelo corpo da requisição: o backend compara o dono do recurso com o usuário autenticado e responde `403` em caso de acesso alheio.
- Após o login de demonstração, o frontend busca o nome real do usuário em `GET /api/usuarios/me`; se falhar, mantém o nome digitado no login.

## Estrutura do backend

`backend/src/main/java/br/com/foursys/agendamento_salas` é organizado por responsabilidade:

| Pacote | Responsabilidade |
|---|---|
| `controller` | HTTP, sem regra de negócio |
| `service` | regras de negócio |
| `domain` | entidades e registros do domínio |
| `repository` | acesso a dados (Spring Data JPA) |
| `dto` | payloads de entrada e saída das APIs |
| `exception` | exceções de negócio e `GlobalExceptionHandler` |
| `integration` | contratos de integração (calendário e IA), em issues futuras |
| `config`, `security` | configuração e segurança |

Erros seguem o modelo padrão de `docs/contratos-api.md`.

## Profiles

| Profile | Uso |
|---|---|
| `dev` | padrão em `spring-boot:run`; SQL e logs de debug |
| `prod` | produção; logs reduzidos |
| `test` | testes automatizados; H2 em memória |

Os testes ativam o profile com `@ActiveProfiles("test")`. Novas classes de teste precisam do mesmo annotation.

O profile Maven `coverage` gera o relatório JaCoCo e valida cobertura mínima de 90% das linhas:

```powershell
cd backend
.\mvnw.cmd -Pcoverage test
```

O relatório HTML fica em `backend/target/site/jacoco/index.html`.

## Estrutura do frontend

`frontend/src/app` segue `core/`, `shared/` e `features/` (ver `frontend/AGENTS.md`). A base atual cria a feature `features/agendamento` com rota padrão. Os ambientes ficam em `frontend/src/environments`, com troca via `fileReplacements` na build de produção.

## Evolução prevista

Os contratos dos serviços, definidos em `docs/contratos-api.md`, devem permitir a troca gradual de dados mockados por Microsoft Graph, sem modificar o fluxo de telas ou regras de negócio do frontend.
