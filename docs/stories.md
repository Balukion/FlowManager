# FlowManager — User Stories

111 stories organizadas por módulo.
Cada story define o comportamento esperado — base para os testes do Dia 3.

---

## Autenticação

```
1.  Como visitante, quero criar uma conta com nome, email e senha,
    para acessar o FlowManager.

2.  Como visitante, quero confirmar meu email clicando no link enviado,
    para ativar minha conta.

3.  Como visitante, quero fazer login com email e senha,
    para acessar minha conta.

4.  Como visitante, quero solicitar recuperação de senha,
    para conseguir acessar minha conta caso esqueça a senha.

5.  Como visitante, quero redefinir minha senha através do link recebido,
    para recuperar o acesso à conta.

6.  Como usuário autenticado, quero que minha sessão seja renovada
    automaticamente, para não precisar fazer login novamente a cada 15 minutos.

7.  Como usuário autenticado, quero fazer logout,
    para encerrar minha sessão com segurança.
```

---

## Perfil

```
8.  Como usuário autenticado, quero visualizar meu perfil,
    para ver minhas informações cadastradas.

9.  Como usuário autenticado, quero editar meu nome,
    para manter meu perfil atualizado.

10. Como usuário autenticado, quero fazer upload de uma foto de perfil,
    para personalizar minha identidade visual no sistema.

11. Como usuário autenticado, quero remover minha foto de perfil,
    para voltar ao avatar padrão gerado automaticamente.

12. Como usuário autenticado, quero alterar minha senha,
    para manter minha conta segura.

13. Como usuário autenticado, quero definir meu fuso horário,
    para que prazos e notificações apareçam no horário correto.
```

---

## Workspaces

```
14. Como usuário autenticado, quero criar um workspace com nome,
    descrição, cor e logo, para organizar meus projetos num ambiente próprio.

15. Como usuário autenticado, quero visualizar todos os workspaces
    que participo, para acessar rapidamente qualquer um deles.

16. Como super admin, quero editar o nome, descrição, cor e logo
    do workspace, para manter as informações atualizadas.

17. Como super admin, quero transferir o título de super admin
    para outro admin, para delegar a propriedade do workspace.

18. Como super admin, quero deletar o workspace,
    para encerrar um ambiente que não é mais necessário.

19. Como super admin ou admin, quero convidar uma pessoa por email
    escolhendo o papel dela, para expandir o time do workspace.

20. Como super admin ou admin, quero visualizar todos os membros
    do workspace com seus papéis, para gerenciar a equipe.

21. Como super admin ou admin, quero promover um membro para admin,
    para dar mais responsabilidades a ele.

22. Como super admin, quero rebaixar um admin para membro,
    para ajustar as permissões quando necessário.

23. Como super admin, quero remover qualquer membro do workspace,
    para controlar quem tem acesso ao ambiente.

24. Como super admin ou admin, quero ver o status dos convites enviados,
    para saber quem aceitou e quem ainda não respondeu.

25. Como visitante, quero aceitar um convite de workspace pelo link recebido,
    para entrar no time sem precisar ser adicionado manualmente.

26. Como visitante, quero recusar um convite de workspace,
    para informar que não vou participar.
```

---

## Projetos

```
27. Como super admin ou admin, quero criar um projeto com nome,
    descrição, cor e prazo, para organizar tarefas relacionadas.

28. Como membro do workspace, quero visualizar todos os projetos
    ativos do workspace, para ter visão geral do que está em andamento.

29. Como super admin ou admin, quero editar o nome, descrição, cor,
    prazo e responsável de um projeto, para manter as informações atualizadas.

30. Como super admin ou admin, quero arquivar um projeto,
    para removê-lo da listagem principal sem deletar permanentemente.

31. Como membro do workspace, quero visualizar projetos arquivados,
    para consultar o histórico de projetos encerrados.

32. Como super admin ou admin, quero desarquivar um projeto,
    para reativá-lo quando necessário.

33. Como super admin, quero deletar permanentemente um projeto,
    para remover um projeto que não tem mais utilidade.
```

---

## Tarefas

```
34. Como super admin ou admin, quero criar uma tarefa com título,
    descrição, prioridade e prazo opcional dentro de um projeto,
    para registrar um entregável a ser realizado.

35. Como membro do workspace, quero visualizar todas as tarefas
    de um projeto, para acompanhar o andamento do trabalho.

36. Como membro do workspace, quero visualizar os detalhes
    de uma tarefa específica, para entender o que precisa ser feito.

37. Como super admin ou admin, quero editar o título, descrição,
    prioridade, prazo e responsável de uma tarefa,
    para manter as informações atualizadas.

38. Como super admin ou admin, quero reordenar as tarefas
    dentro de um projeto, para organizar por relevância.

39. Como super admin ou admin, quero mover uma tarefa para outro projeto,
    para reorganizar o trabalho quando necessário.

40. Como super admin ou admin, quero atribuir uma tarefa diretamente
    a um membro, para definir o responsável principal.

41. Como super admin ou admin, quero alterar manualmente o status
    de uma tarefa, para refletir situações que os passos não cobrem.

42. Como sistema, quero marcar uma tarefa como concluída automaticamente
    quando todos os passos forem concluídos, para manter o status atualizado.

43. Como sistema, quero reverter o status de uma tarefa para em progresso
    quando um passo for reaberto, desde que o status não tenha sido
    definido manualmente.

44. Como super admin ou admin, quero adicionar labels a uma tarefa,
    para categorizá-la e facilitar a filtragem.

45. Como super admin ou admin, quero remover labels de uma tarefa,
    para manter a categorização atualizada.

46. Como membro do workspace, quero seguir uma tarefa como watcher,
    para receber notificações sobre mudanças sem estar atribuído.

47. Como membro do workspace, quero parar de seguir uma tarefa,
    para deixar de receber notificações sobre ela.

48. Como super admin ou admin, quero deletar uma tarefa,
    para remover entregáveis que não são mais necessários.
```

---

## Passos

```
49. Como super admin ou admin, quero criar um passo dentro de uma tarefa
    com título, descrição e prazo opcional, para subdividir o trabalho.

50. Como super admin ou admin, quero atribuir um passo a um ou mais membros,
    para definir quem é responsável por cada etapa.

51. Como membro atribuído, quero visualizar todos os passos atribuídos a mim,
    para saber exatamente o que preciso fazer.

52. Como membro atribuído, quero marcar um passo como em progresso,
    para sinalizar que comecei a trabalhar nele.

53. Como membro atribuído, quero marcar um passo como concluído,
    para sinalizar que terminei minha parte.

54. Como super admin ou admin, quero reabrir um passo concluído,
    para revisitar uma etapa que precisa ser refeita.

55. Como super admin ou admin, quero reordenar os passos de uma tarefa,
    para ajustar a sequência de execução.

56. Como super admin ou admin, quero editar o título, descrição e prazo
    de um passo, para manter as informações atualizadas.

57. Como super admin ou admin, quero remover um membro de um passo,
    para ajustar as atribuições quando necessário.

58. Como super admin ou admin, quero deletar um passo,
    para remover etapas que não são mais necessárias.

59. Como sistema, quero impedir que um passo seja criado ou editado
    com prazo posterior ao prazo da tarefa, para garantir consistência.

60. Como super admin ou admin, quero ser alertado quando alterar o prazo
    de uma tarefa para uma data anterior ao prazo de algum passo,
    para poder ajustar os prazos dos passos afetados.
```

---

## Comentários

```
61. Como membro do workspace, quero adicionar um comentário em uma tarefa,
    para comunicar informações relevantes no contexto do trabalho.

62. Como membro do workspace, quero responder a um comentário existente,
    para manter conversas organizadas em threads.

63. Como membro do workspace, quero mencionar outro membro com @nome
    num comentário, para chamar a atenção de alguém específico.

64. Como autor do comentário, quero editar meu próprio comentário,
    para corrigir informações ou atualizar o conteúdo.

65. Como membro do workspace, quero visualizar quando um comentário
    foi editado, para saber que o conteúdo foi alterado após a publicação.

66. Como autor do comentário, quero deletar meu próprio comentário,
    para remover informações que não são mais relevantes.

67. Como super admin ou admin, quero deletar qualquer comentário,
    para moderar o conteúdo quando necessário.

68. Como membro do workspace, quero ver uma mensagem no lugar de
    comentários deletados, para entender o contexto da thread.
```

---

## Labels

```
69. Como super admin ou admin, quero criar uma label com nome e cor,
    para categorizar tarefas de forma visual.

70. Como membro do workspace, quero visualizar todas as labels disponíveis,
    para saber quais categorias existem.

71. Como super admin ou admin, quero editar o nome e a cor de uma label,
    para manter a categorização atualizada.

72. Como super admin ou admin, quero deletar uma label do workspace,
    para remover categorias que não são mais utilizadas.

73. Como super admin ou admin, quero adicionar uma ou mais labels a uma tarefa,
    para categorizá-la visualmente.

74. Como super admin ou admin, quero remover uma label de uma tarefa,
    para atualizar a categorização.

75. Como membro do workspace, quero filtrar tarefas por label,
    para encontrar rapidamente tarefas de uma categoria específica.
```

---

## Convites

```
76. Como super admin ou admin, quero convidar uma pessoa por email
    escolhendo o papel dela, para expandir o time.

77. Como super admin ou admin, quero visualizar todos os convites enviados
    com seus status, para acompanhar quem aceitou e quem não respondeu.

78. Como super admin ou admin, quero cancelar um convite pendente,
    para revogar um convite que não é mais necessário.

79. Como super admin ou admin, quero reenviar um convite expirado,
    para dar nova chance a quem não respondeu a tempo.

80. Como visitante, quero aceitar um convite pelo link recebido,
    para entrar no workspace sem ser adicionado manualmente.

81. Como visitante sem conta, quero criar minha conta durante o aceite
    do convite, para entrar no workspace sem cadastro separado.

82. Como visitante, quero recusar um convite,
    para informar que não vou participar do workspace.

83. Como sistema, quero marcar automaticamente convites como expirados
    quando o prazo vencer, para manter os status atualizados.

84. Como sistema, quero registrar quando o convidado visualizou o link,
    para que o admin saiba que o email foi aberto.
```

---

## Notificações

```
85. Como membro do workspace, quero receber um email quando um passo
    for atribuído a mim, para saber que tenho uma nova responsabilidade.

86. Como membro do workspace, quero receber um email quando o prazo de
    uma tarefa que participo estiver próximo, para me planejar.

87. Como membro do workspace, quero receber um email quando o prazo de
    um passo atribuído a mim estiver próximo, para me planejar.

88. Como membro do workspace, quero receber um email quando o status de
    uma tarefa que participo for alterado, para acompanhar o progresso.

89. Como membro do workspace, quero receber um email quando for convidado
    para um workspace, para aceitar ou recusar o convite.

90. Como membro do workspace, quero receber um email quando for mencionado
    num comentário, para ser notificado de mensagens direcionadas a mim.

91. Como sistema, quero retentar o envio de emails que falharam,
    para garantir que notificações importantes sejam entregues.
```

---

## Dashboard

```
92. Como membro do workspace, quero visualizar o total de tarefas por status
    em todos os meus workspaces, para ter visão geral do andamento.

93. Como membro do workspace, quero visualizar as tarefas atrasadas,
    para identificar o que está fora do prazo.

94. Como membro do workspace, quero visualizar a taxa de conclusão
    por projeto, para entender quais projetos estão mais avançados.

95. Como membro do workspace, quero visualizar a carga de trabalho
    por membro, para identificar quem está sobrecarregado.
```

---

## Histórico

```
96. Como membro do workspace, quero visualizar o histórico completo
    de atividades de uma tarefa, para entender tudo que aconteceu nela.

97. Como membro do workspace, quero visualizar o histórico completo
    de atividades de um projeto, para acompanhar todas as ações realizadas.

98. Como membro do workspace, quero filtrar o histórico por período,
    para encontrar atividades de uma data específica.

99. Como membro do workspace, quero filtrar o histórico por membro,
    para ver as ações realizadas por uma pessoa específica.

100. Como membro do workspace, quero filtrar o histórico por tipo de ação,
     para encontrar eventos específicos como criações ou mudanças de status.
```

---

## Sistema

```
101. Como sistema, quero deletar permanentemente workspaces com soft delete
     há mais de 30 dias, para liberar espaço e manter o banco limpo.

102. Como sistema, quero deletar permanentemente notificações com mais
     de 90 dias, para manter o banco limpo sem perder dados relevantes.

103. Como sistema, quero deletar tokens revogados com prazo vencido,
     para manter a blacklist enxuta.

104. Como sistema, quero marcar convites como expirados automaticamente
     quando o prazo vencer, para manter os status sempre corretos.

105. Como sistema, quero enviar lembretes de prazo para membros com
     tarefas ou passos vencendo em breve, para ajudá-los a se planejar.

106. Como sistema, quero retentar o envio de notificações com falha
     automaticamente a cada hora, respeitando o limite de 3 tentativas.

107. Como sistema, quero impedir que um passo tenha prazo posterior
     ao prazo da tarefa, para garantir consistência nos prazos.

108. Como sistema, quero alertar o admin quando o prazo de uma tarefa
     for alterado para antes do prazo de algum passo, para que ele
     possa ajustar os prazos afetados.

109. Como sistema, quero reajustar automaticamente a ordem dos passos
     quando um passo for deletado, para manter a sequência sem buracos.

110. Como sistema, quero manter os passos sem responsável quando um
     membro for removido do workspace, para não perder o trabalho configurado.

111. Como sistema, quero registrar todas as ações relevantes no histórico
     com contexto suficiente, para permitir auditoria completa do sistema.
```
