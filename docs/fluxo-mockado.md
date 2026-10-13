# Fluxo mockado do MVP

1. O usuário abre a home mockada do Portal (`/portal`) e clica em **Agendamento de Salas**, o último
   acesso da grade, depois de **Portal de Gestão Pessoal**.
2. A tela do agendamento já é o mapa: ele informa data, horário, duração e quantidade de pessoas no
   painel de resumo.
3. A API retorna as salas compatíveis com a necessidade.
4. O usuário escolhe uma sala livre na planta e revisa o resumo. O seletor de pessoas respeita a
   capacidade da sala escolhida e a linha de equipamentos deixa o pedido à equipe de Facilities.
5. A confirmação fica disponível após o login e, nesta etapa, gera apenas uma mensagem visual de
   sucesso.

Esse fluxo serve para demonstração e não cria eventos reais em calendários corporativos.
