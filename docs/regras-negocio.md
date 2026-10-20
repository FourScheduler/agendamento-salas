# Regras de negócio

## Busca de salas

A busca recebe data, horário inicial, horário final (ou duração) e quantidade de pessoas.

## Capacidades

| Grupo    | Salas             | Capacidade        |
| -------- | ----------------- | ----------------- |
| Foco     | Sala Focus        | 1 a 2 pessoas     |
| Tamboré  | Salas 01, 02 e 03 | até 4 pessoas     |
| Comp     | Salas 01 a 04     | 5 pessoas ou mais |
| Restrito | Auditório         | a definir         |

- Reuniões com mais de 10 pessoas podem integrar salas, conforme disponibilidade.
- A célula da sala na planta mostra só a capacidade máxima (`Até N`); as regras de grupo ficam na
  nota da legenda.

## Equipamentos

- Reuniões híbridas que precisam de câmera ou de recursos adicionais solicitam o equipamento
  previamente à equipe de Facilities.
- O painel de resumo tem a linha `Equipamentos` com o checkbox
  `Câmera e recursos para reunião híbrida` e a nota de orientação.

## Validações

- A data não pode estar no passado.
- O horário final deve ser posterior ao horário inicial.
- A capacidade da sala deve ser igual ou superior à quantidade de pessoas.
- Com sala selecionada, o seletor de pessoas trava na capacidade da sala e mostra
  `Esta sala comporta até N pessoas.`; se a seleção exceder a capacidade, a quantidade é reduzida
  para o máximo da sala.
- Apenas salas disponíveis podem ser exibidas e selecionadas.
- O usuário deve confirmar os dados antes de concluir a reserva.

## Estado do MVP

Salas e reservas são mockadas. Usuários e autenticação ficam no MySQL local. Nenhuma reserva é registrada no Outlook e não há chamadas ao Microsoft Graph ou a serviços externos de IA.
