# Contratos de API e de integração

Este documento define os contratos da issue #9: a API REST do MVP e as interfaces de integração (calendário e IA) que serão implementadas em issues futuras. As integrações externas ainda não existem; os contratos existem para que os mocks possam ser substituídos sem alterar o fluxo do frontend.

## Modelo de erro padrão

Toda resposta de erro da API usa o mesmo formato, definido por `dto/ErroResposta` e aplicado por `exception/GlobalExceptionHandler`:

```json
{
  "status": 400,
  "mensagem": "A data não pode estar no passado."
}
```

| Status | Quando ocorre |
|---|---|
| 400 | Validação de negócio ou parâmetro da requisição inválido |
| 404 | Recurso ou rota inexistente |
| 500 | Erro interno inesperado (mensagem genérica, sem detalhes técnicos) |

## Endpoints

### GET /api/salas/disponiveis — implementado

Busca salas mockadas compatíveis com a necessidade.

| Parâmetro | Obrigatório | Formato |
|---|---|---|
| `data` | sim | data ISO (`yyyy-MM-dd`), não pode estar no passado |
| `inicio` | sim | horário ISO (`HH:mm`) |
| `fim` | sim* | horário ISO, posterior ao inicial |
| `duracao` | sim* | minutos (`Integer >= 1`), alternativa a `fim` |
| `pessoas` | sim | `Integer >= 1` |

\* Ao menos um entre `fim` e `duracao` deve ser informado.

Resposta `200`:

```json
[
  { "id": "focus", "nome": "Sala Focus", "local": "Tamboré", "capacidade": 2 }
]
```

Salas com capacidade inferior a `pessoas` são filtradas; a resposta pode ser uma lista vazia.

### GET /api/agendamento/busca/filtro — implementado

Lista agendamentos com filtros opcionais. Exige header `Authorization: Bearer <token>` (obtido em `POST /auth/login`); sem token a resposta é `401`.

| Campo do body | Obrigatório | Observação |
|---|---|---|
| `dataInicio` | não | data ISO (`yyyy-MM-dd`); reserva com `dataAgendamento >= dataInicio` |
| `dataFinal` | não | data ISO; reserva com `dataAgendamento <= dataFinal` |
| `statusAgendamento` | não | um valor do enum, ex.: `CONFIRMADO` |
| `todosUsuarios` | sim | `false` lista **somente as reservas do usuário do token**; `true` lista de todos (somente `ADMIN`) |

Mesmo sendo `GET`, o corpo vai no `body` da requisição (padrão já usado em `GET /api/salas/disponiveis`). Campos nulos são ignorados no filtro.

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

### POST /api/reservas - previsto (#15)

Request:

```json
{
  "salaId": "focus",
  "inicio": "2026-09-30T14:00:00",
  "fim": "2026-09-30T15:00:00",
  "quantidadePessoas": 8,
  "titulo": "Reunião de planejamento"
}
```

Response `201`:

```json
{
  "id": 1,
  "sala": "Sala Focus",
  "inicio": "2026-09-30T14:00:00",
  "fim": "2026-09-30T15:00:00",
  "status": "CONFIRMADA",
  "solicitante": "usuario.logado"
}
```

Validações: sala existente e ativa, capacidade suficiente, data válida, horário inicial anterior ao final, usuário autenticado e ausência de conflito na mesma sala.

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

## Integração de IA - `LlamaClient` (#18)

| Método | Propósito |
|---|---|
| `enviar prompt` | Envia a solicitação em linguagem natural |
| `receber resposta` | Devolve a resposta interpretada |

DTOs: `LlamaRequest`, `LlamaResponse`.

- Timeout, retry controlado e tratamento de indisponibilidade são obrigatórios.
- Ambiente de execução (API própria, servidor local, serviço corporativo): **A definir**.
- Credenciais ficam somente no backend, em variáveis de ambiente.
- O Angular conversa apenas com o Spring Boot; nunca com o modelo diretamente.

## Regras gerais

1. O frontend chama somente endpoints do Spring Boot.
2. Nenhuma integração externa (Graph, Llama ou outro provedor) é implementada sem solicitação explícita.
3. Contratos novos devem ser documentados aqui antes da implementação.
