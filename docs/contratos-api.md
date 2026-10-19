# Contratos de API e de integração

Este documento define os contratos da issue #9: a API REST do MVP e as interfaces de integração (calendário e IA) que serão implementadas em issues futuras. As integrações externas ainda não existem; os contratos existem para que os mocks possam ser substituídos sem alterar o fluxo do frontend.

## Modelo de erro padrão

Toda resposta de erro da API usa o mesmo formato, definido por `dto/response/ErrorResponse` e aplicado por `exception/GlobalExceptionHandler` (inclusive nos handlers de segurança):

```json
{
  "status": 400,
  "message": "A data não pode estar no passado.",
  "timestamp": "2026-10-14T22:30:00"
}
```

| Status | Quando ocorre |
|---|---|
| 400 | Validação de negócio ou Bean Validation reprovada |
| 401 | Token ausente ou inválido (inclui tentativa de acesso sem sessão) |
| 403 | Usuário autenticado sem permissão (perfil ou dono do recurso) |
| 404 | Recurso ou rota inexistente |
| 409 | Conflito de negócio (ex.: e-mail já cadastrado, horário ocupado) |
| 500 | Erro interno inesperado (mensagem genérica, sem detalhes técnicos) |
| 503 | Serviço de interpretação de IA indisponível |

## Autenticação e perfil

### POST /auth/login — implementado

Body `{ "email": "...", "password": "..." }`. Resposta `200` com o token JWT como texto puro (`text/plain`).

### POST /auth/demo — implementado (MVP apenas)

Emite token do usuário de teste (`usuario@teste.com`) sem senha, quando `app.auth.demo-enabled=true`. Resposta `200` com o token como texto puro; se desabilitado, `404`. Será removido quando o SSO do portal entrar.

### GET /api/usuarios/me — implementado

Exige `Authorization: Bearer <token>`. Devolve o perfil do próprio usuário autenticado (o dono vem do token, não do corpo):

```json
{ "id": 3, "email": "usuario@teste.com", "nome": "Usuario Teste", "perfilUsuario": "USER" }
```

Consumido pelo frontend logo após o login de demonstração para exibir o nome real; em caso de falha o login segue com o nome digitado.

## Endpoints

### GET /api/salas/disponiveis — implementado

Busca salas mockadas compatíveis com a necessidade. Os filtros vão na **query string** (navegadores não enviam corpo em GET):

| Parâmetro | Obrigatório | Formato |
|---|---|---|
| `data` | sim | data ISO (`yyyy-MM-dd`), não pode estar no passado |
| `horaInicio` | sim | horário ISO (`HH:mm`) |
| `horaFim` | não* | horário ISO, posterior ao inicial |
| `qntdPessoas` | sim | `Integer >= 1` |

\* `horaFim` é obrigatório na prática: sem ele o backend responde `400` pedindo o horário final.

Exemplo: `GET /api/salas/disponiveis?data=2026-10-20&horaInicio=14:00&horaFim=15:00&qntdPessoas=4`

Resposta `200`:

```json
[
  { "id": "focus", "nome": "Sala Focus", "local": "Tamboré", "capacidade": 2 }
]
```

Salas com capacidade inferior a `pessoas` são filtradas; a resposta pode ser uma lista vazia.

### GET /api/agendamento/busca/filtro — implementado

Lista agendamentos com filtros opcionais na **query string** (navegadores não enviam corpo em GET). Exige header `Authorization: Bearer <token>` (obtido em `POST /auth/login`); sem token a resposta é `401`.

| Parâmetro | Obrigatório | Observação |
|---|---|---|
| `dataInicio` | não | data ISO (`yyyy-MM-dd`); reserva com `dataAgendamento >= dataInicio` |
| `dataFinal` | não | data ISO; reserva com `dataAgendamento <= dataFinal` |
| `statusAgendamento` | não | um valor do enum, ex.: `CONFIRMADO` |
| `todosUsuarios` | não (padrão `false`) | `false` lista **somente as reservas do usuário do token**; `true` lista de todos (somente `ADMIN`) |

Exemplo: `GET /api/agendamento/busca/filtro?todosUsuarios=false&dataInicio=2026-10-01`

Existe também `GET /api/agendamento/busca?todosUsuarios=false`, sem os filtros de data/status, com o mesmo comportamento de posse.

Consumido pela página `/minhas-reservas` do frontend, sempre com `todosUsuarios: false`.

Resposta `200` (lista pode ser vazia):

```json
[
  {
    "salaId": { "id": 1, "nome": "Sala Focus", "capacidade": 2, "localizacao": "Tamboré", "disponivel": true },
    "dataAgendamento": "2026-10-20",
    "dataCriacao": "2026-10-14T10:15:00",
    "horaInicio": "09:00:00",
    "horaFim": "10:00:00",
    "qntdPessoas": 2,
    "titulo": "Reunião de alinhamento",
    "usuarioIdSolicitante": null,
    "status": "CONFIRMADO"
  }
]
```

### POST /api/agendamento — implementado

Exige autenticação. Request (`CriarAgendamentoRequest`, com Bean Validation nos campos obrigatórios):

```json
{
  "salaId": [{ "id": 2 }],
  "data": "2026-10-20",
  "horaInicio": "14:00",
  "horaFim": "15:00",
  "qntdPessoas": 4,
  "titulo": "Reunião de planejamento"
}
```

Cada sala gera uma reserva independente, vinculada ao mesmo usuário, horário e título. Para uma reunião integrada, a capacidade é a soma das capacidades das salas selecionadas; a confirmação é atômica: se uma sala for inválida, indisponível ou tiver conflito, nenhuma reserva é criada. Salas repetidas e lista vazia são rejeitadas. A resposta conserva os campos da reserva principal por compatibilidade e inclui todos os registros criados:

```json
{
  "id": 42,
  "sala": { "id": 2, "nome": "Sala 02", "capacidade": 4, "localizacao": "Tamboré", "disponivel": true },
  "inicio": "14:00",
  "fim": "15:00",
  "status": "CONFIRMADO",
  "solicitante": null,
  "agendamentos": [
    { "id": 42, "sala": { "id": 2, "nome": "Sala 02", "capacidade": 4, "localizacao": "Tamboré", "disponivel": true } }
  ]
}
```

Validações: todas as salas existem e estão disponíveis, capacidade total suficiente, data não passada, quantidade de pessoas ≥ 1 e ausência de conflito em cada sala. A criação usa lock pessimista nas salas em ordem crescente de ID para evitar double booking e reduzir deadlocks; o solicitante vem do usuário autenticado. O log de auditoria é gravado individualmente para cada reserva criada.

### Cancelamento de reserva — previsto

Escopo e contrato: **A definir**.

### Interpretação em linguagem natural - previsto (#19)

Entrada do tipo `{"solicitacao": "Quero uma sala amanhã às 14h para 8 pessoas"}` convertida na estrutura `AgendamentoIntent`:

| Campo | Observação |
|---|---|
| `data` | pode ser nulo |
| `horarioInicial` | pode ser nulo |
| `horarioFinal` | pode ser nulo |
| `duracao` | pode ser nula |
| `quantidadePessoas` | pode ser nula |
| `localizacao` | pode ser nula |
| `recursos` | pode ser nulo |
| `objetivo` | pode ser nulo |

Campos não informados permanecem nulos e nunca são inventados; solicitações incompletas geram pergunta de complementação. Contrato exato da requisição HTTP: **A definir** (#19).

## Integração de calendário - `CalendarProvider` (#17)

Interface em `integration/` para desacoplar o domínio do provedor de calendário:

| Método | Propósito |
|---|---|
| `buscarDisponibilidade()` | Consulta horários livres |
| `criarEvento()` | Cria o evento da reserva |
| `consultarEvento()` | Consulta evento existente |
| `cancelarEvento()` | Somente se o cancelamento entrar no escopo |

DTOs: `CalendarAvailabilityRequest`, `CalendarAvailabilityResponse`, `CalendarEventRequest`, `CalendarEventResponse`.

- Provedor concreto (tecnologia, autenticação, consistência entre banco e calendário): **A definir**.
- **Microsoft Graph não pode ser usado no MVP** (ver `AGENTS.md`).

## Assistente de IA — Ollama (integrado ao produto)

O backend contém o cliente do Ollama (`integration`/`OllamaService`) e o orquestrador de conversa (`/api/agendamento/conversas/**`), e o assistente do agendamento os usa de verdade. Todos os endpoints exigem token JWT; conversas e ações são resolvidas pelo dono do token (tentar acessar conversa de outro usuário responde `403`).

| Método | Propósito |
|---|---|
| `POST /api/agendamento/conversas` | Abre uma conversa nova → `201 {conversaId, status}` |
| `POST /api/agendamento/conversas/mensagens` | Interpreta a mensagem do usuário e devolve a etapa atual → `200 OrquestradorAgendamentoResponse` |
| `PATCH /api/agendamento/conversas/{id}/selecionar` | Registra a sala escolhida (`{salaId}`) → `200 OrquestradorAgendamentoResponse` |
| `POST /api/agendamento/conversas/{id}/confirmar` | Cria a reserva → `201 OrquestradorAgendamentoResponse` |

`OrquestradorAgendamentoResponse`:

```json
{
  "conversaId": 4,
  "estado": "AGUARDANDO_ESCOLHA",
  "mensagem": "Encontrei algumas salas disponíveis. Qual você prefere?",
  "sugestoes": [
    { "salaId": 2, "nome": "Sala 02", "capacidade": 4, "localizacao": "Tamboré" }
  ],
  "data": "2026-10-16",
  "horaInicio": "14:00:00",
  "horaFim": null,
  "qntdPessoas": 6
}
```

- `estado` percorre `RECEBENDO_SOLICITACAO` → `AGUARDANDO_INFORMACAO` (falta dado, ex.: horário de término) → `AGUARDANDO_ESCOLHA` (mostra `sugestoes`) → `AGUARDANDO_CONFIRMACAO` → `CONFIRMADO`.
- `data`, `horaInicio`, `horaFim` e `qntdPessoas` podem vir `null` conforme o que já foi interpretado; o front os usa para sincronizar o painel de resumo com o chat.
- Falha na interpretação (Ollama indisponível) responde `503` com mensagem amigável; timeout, retry controlado e tratamento de indisponibilidade são obrigatórios.
- O modelo roda no Ollama local (`ollama.url`/`ollama.model` no `application.yaml`); credenciais e chaves ficam somente no backend, em variáveis de ambiente.
- O Angular conversa apenas com o Spring Boot; nunca com o modelo diretamente.

## Regras gerais

1. O frontend chama somente endpoints do Spring Boot.
2. Nenhuma integração externa (Graph, Llama ou outro provedor) é implementada sem solicitação explícita.
3. Contratos novos devem ser documentados aqui antes da implementação.
