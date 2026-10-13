# Fluxo mockado do MVP

1. O usuário abre a home mockada do Portal (`/portal`) e clica em **Agendamento de Salas**, o último
   acesso da grade, depois de **Portal de Gestão Pessoal**.
2. A tela do agendamento já é o mapa: ele informa data, horário, duração e quantidade de pessoas no
   painel de resumo.
3. A API retorna as salas compatíveis com a necessidade.
4. O usuário escolhe uma sala livre na planta e revisa o resumo. O seletor de pessoas respeita a
   capacidade da sala escolhida e a linha de equipamentos deixa o pedido à equipe de Facilities.
5. A confirmação fica disponível após o login. Ao concluir, a reserva é gravada no banco local e a
   tela mostra a confirmação com sala, horário e quantidade de pessoas.
6. Se a confirmação falhar (por exemplo, sala ocupada por outra pessoa), a tela mostra **Reserva não
   confirmada** com o motivo, a opção de tentar novamente e o atalho para **Meus Agendamentos**.
7. A tela **Meus Agendamentos** lista as reservas do usuário logado com data, horário, sala e status.
   É acessível a partir das telas de agendamento (confirmação e reserva não confirmada) ou pela URL
   `/meus-agendamentos`. Sem login, a tela exibe o cartão de acesso da conta mock.
8. A barra superior não tem menu: mostra `Portal | CCH`, os ícones de sino e relógio, o avatar do
   usuário e o botão `Sair`, que remove a sessão local.

Esse fluxo serve para demonstração e não cria eventos reais em calendários corporativos.
