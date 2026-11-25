# Fluxo mockado do MVP

1. O usuário abre a home mockada do Portal (`/portal`) e clica em **Agendamento de Salas**, o último
   acesso da grade, depois de **Portal de Gestão Pessoal**.
2. A tela do agendamento já é o mapa: ele informa data, horário, duração e quantidade de pessoas no
   painel de resumo.
3. A API retorna as salas compatíveis com a necessidade.
4. O usuário escolhe uma sala livre na planta e revisa o resumo. O seletor de pessoas respeita a
   capacidade da sala escolhida e a linha de equipamentos permite solicitar recursos para reunião
   híbrida; a orientação para solicitar previamente à equipe de Facilities aparece somente quando
   essa opção está marcada.
5. Ao confirmar uma sala selecionada, o sucesso aparece em um pop-up (toast), sem mensagem de
   sucesso dentro do resumo da reserva. Sem token ou com token inválido, um pop-up vermelho
   solicita novo login e nenhuma reserva é confirmada.

Esse fluxo serve para demonstração e não cria eventos reais em calendários corporativos.
