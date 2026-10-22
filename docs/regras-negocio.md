# Regras de negócio

## Busca de salas

A busca recebe data, horário inicial, horário final (ou duração) e quantidade de pessoas.

## Capacidades

| Grupo    | Salas             | Capacidade               |
| -------- | ----------------- | ------------------------ |
| Foco     | Sala Focus        | 1 a 2 pessoas            |
| Tamboré  | Salas 01, 02 e 03 | até 4 pessoas            |
| Comp     | Salas 01 a 04     | 5 pessoas ou mais        |
| Restrito | Arena             | eventos (sem capacidade) |

- Reuniões com mais de 10 pessoas podem integrar salas, conforme disponibilidade.
- A célula da sala na planta mostra só a capacidade máxima (`Até N`); as regras de grupo ficam na
  nota da legenda.
- A Arena é de eventos e não tem capacidade definida: não limita a quantidade de pessoas e não
  aparece nas sugestões do assistente. No mapa do usuário comum ela fica visível como sala restrita
  não clicável (`Reserva somente com o Facilities.`); no modo administrativo é selecionável quando
  livre. Somente o perfil `ADMIN` pode reservá-la — o backend responde `403` para usuário comum.

## Equipamentos

- Reuniões híbridas que precisam de câmera ou de recursos adicionais solicitam o equipamento
  previamente à equipe de Facilities.
- O painel de resumo tem a linha `Equipamentos` com o checkbox
  `Câmera e recursos para reunião híbrida` e a nota de orientação.

## Validações

- A data não pode estar no passado.
- O horário final deve ser posterior ao horário inicial e precisa ficar dentro do mesmo dia.
- A capacidade da sala deve ser igual ou superior à quantidade de pessoas.
- Com sala selecionada, o seletor de pessoas trava na capacidade da sala e mostra
  `Esta sala comporta até N pessoas.`; se a seleção exceder a capacidade, a quantidade é reduzida
  para o máximo da sala.
- Apenas salas disponíveis podem ser exibidas e selecionadas.
- O usuário deve confirmar os dados antes de concluir a reserva.

## Perfil administrativo

A tela `/agendamento-admin` é restrita a usuários com perfil `ADMIN` (guard de rota no frontend e regras no backend). O portal não mostra um acesso separado: com sessão ativa, o acesso **Agendamento de Salas** direciona para a tela correspondente ao perfil (`USER` → `/agendamento`, `ADMIN` → `/agendamento-admin`); sem sessão, o clique abre o login e, depois de autenticar, segue para a mesma tela conforme o perfil.

A tela administrativa usa o mesmo layout da tela comum (planta de salas + painel de resumo), sem assistente. Em relação à tela comum:

- Pode selecionar mais de uma sala por reserva, clicando em cada sala na planta; a capacidade considerada é a soma das salas escolhidas (a Arena, sem capacidade, não limita as pessoas).
- Pode agendar até o dia inteiro: a duração usa um stepper de 30 em 30 minutos do horário inicial até o fim do dia, com atalhos `30 min`, `1 h`, `2 h`, `4 h` e `Dia inteiro` (o limite de 120 minutos vale apenas para `USER`). Ao trocar o horário inicial, uma duração que passaria da meia-noite é reduzida para a última opção válida.
- Pode escolher quem é o solicitante da reserva em outro usuário, pela busca de nome ou e-mail sobre
  `GET /api/usuarios`; por padrão o solicitante é o próprio administrador, que aparece uma única vez,
  como primeiro item da lista com o selo `(eu mesmo)` — buscando o próprio nome ele também é
  encontrado.
- Pode reservar a Arena (sala restrita de eventos); o backend valida o perfil e recusa usuário comum com `403`.
- A reserva fica com o solicitante escolhido como dono e aparece nos **Minhas reservas** dele — não nos do administrador que registrou (o log de auditoria continua gravando quem criou a reserva).

## Sessão e acesso

- As telas de agendamento (`/agendamento` e `/agendamento-admin`) só abrem com sessão ativa; sem login, o guard de rota devolve o usuário ao portal.
- O login (e-mail e senha) pela topbar **permanece na página** em que o usuário está; quem decide o destino é o acesso do portal: com sessão, o clique em **Agendamento de Salas** leva à tela do perfil; sem sessão, abre o login e segue para a tela do perfil após autenticar.
- O botão **Sair** encerra a sessão e redireciona para o portal.
- Em **Minhas reservas**, o botão de voltar segue o perfil: `ADMIN` volta para `/agendamento-admin` e `USER` para `/agendamento`.

## Estado do MVP

Salas e reservas são mockadas. Usuários e autenticação ficam no MySQL local. Nenhuma reserva é registrada no Outlook e não há chamadas ao Microsoft Graph ou a serviços externos de IA.
