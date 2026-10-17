# Guia do instrutor

MobiLog R01 · Uso educacional. Comece pela implantação e faça o ensaio em dois aparelhos antes da primeira atividade compartilhada.

## Organizar a turma

Para uma turma de 35 alunos, a proposta é trabalhar com **7 grupos de 5**, mantendo o instrutor como administrador de cada equipe. Ajuste ao número real de alunos. Cinco funções cobrem as oito etapas:

| Função | Responsabilidade |
| --- | --- |
| Logística | Cadastrar pedido, conferir materiais, planejar, receber materiais, embalar e entregar |
| Corte e preparação | Identificar e conferir peças, registrar corte e preparação |
| Montagem | Registrar montagem e conferir fixações e alinhamento |
| Acabamento | Registrar acabamento e conferir condições de secagem |
| Qualidade | Inspecionar e aprovar ou devolver para acabamento |

Crie as equipes com sua conta. Em seguida, cadastre os alunos diretamente em cada equipe. Para alguém já cadastrado, peça que solicite entrada pelo código e aprove em Equipe. Não crie a mesma conta em duplicidade.

A função de leitura serve para visitantes ou observadores. Troque as funções ao fim de uma rodada e peça aos alunos para sair e entrar novamente. O servidor sempre considera a função atual do banco. Reatribua etapas ainda vinculadas ao responsável anterior.

## Preparar cada rodada

1. Nomeie a equipe `Treino Gx · Logística 2026` e use exemplos fictícios.
2. Confirme cinco acessos distintos, função correta e troca da senha inicial.
3. Selecione um pedido ou cadastre `Mesa didática Gx`, uma unidade, destino `Oficina de treinamento`, com prazo definido na aula.
4. Confira as quantidades de materiais com o grupo. As receitas são exemplos e podem ser ajustadas no cadastro.
5. Abra o painel em um computador e o aplicativo em um smartphone por função, quando houver aparelhos disponíveis. Com menos aparelhos, cada pessoa deve sair da conta antes de passar o dispositivo.
6. Distribua a ficha de evidências do plano de treinamento. Nunca preencha a ficha com senhas.

## Atribuir e acompanhar

O aluno inicia ou assume a atividade da própria função. Ela passa a mostrar o nome da pessoa. Outro aluno da mesma função acompanha, mas não pode confirmar uma atividade já assumida por alguém.

Para trocar o responsável, abra **Pedidos**, selecione o pedido e use **Responsável pela etapa atual**. Escolha uma pessoa ativa da função correspondente e confirme. O histórico registra a alteração com a autoria do instrutor.

No caso de exemplos já em andamento e ainda sem pessoa, use **Assumir atividade** antes de registrar a execução. Uma etapa futura só fica disponível quando a anterior é concluída.

## Contas e acesso

- **Cadastrar acesso:** informa nome, e-mail, senha inicial individual e função; não envia mensagem.
- **Aprovar e definir função:** libera uma solicitação recebida por código.
- **Ajustar acesso:** altera nome/função e permite suspender a participação naquela equipe.
- **Redefinir senha inicial:** disponível para contas administradas por essa equipe; exige nova troca no próximo acesso. A operação altera a conta de login, portanto explique ao aluno que essa nova senha também vale nas outras equipes das quais participa.
- **Novo código da equipe:** invalida o código anterior para novas solicitações. Quem já está associado continua associado.

A suspensão da equipe bloqueia as próximas operações no servidor. Ela não apaga os registros anteriores. O aluno deve sair e entrar novamente depois de uma mudança de função para atualizar a apresentação dos controles.

## Demonstrar uma exceção de cada vez

**Material insuficiente:** cadastre uma mesa com MDF previsto acima do disponível. Inicie Planejamento e tente concluir com o checklist completo. A reserva deve ser recusada, sem saldo negativo. A Logística recebe material com uma referência e repete a tentativa com os mesmos dados do pedido.

**Pausa:** o responsável inicia uma etapa e registra uma pausa com motivo, como `Aguardando conferência das medidas`. O próximo setor continua bloqueado. Depois da orientação do instrutor, retome e conclua.

**Retrabalho:** use o exemplo Bancos de madeira, que chega à Qualidade. A Qualidade assume a etapa, registra uma devolução com motivo e acompanha o retorno ao Acabamento. O histórico fica preservado, uma nova inspeção será necessária e os materiais já consumidos não são descontados novamente.

**Perda de conexão:** teste apenas depois do ensaio online. Com a atividade aberta, desligue a rede, registre uma tentativa e observe o aviso de pendência. O painel do outro aparelho deve permanecer sem avanço até o servidor aceitar. Ligue a rede, mantenha o aplicativo aberto e use Sincronizar registros, se necessário. Uma tentativa recusada precisa ser revisada; não é confirmação de produção.

## Encerrar a aula

1. Confira **Histórico** com o grupo: pessoa, pedido, etapa, motivo e horário.
2. Em **Pedidos**, exporte o CSV. No topo, use **Cópia JSON** para guardar o estado da equipe.
3. Identifique as cópias por equipe e data; os arquivos não incluem senhas de login. Guarde-os sob responsabilidade do instrutor.
4. Registre as dificuldades no controle de pendências. Verifique que cada aluno produziu sua evidência.
5. Peça que saiam da conta em aparelhos compartilhados.

O botão Reiniciar exemplos está restrito à demonstração local e afeta aquele navegador. O ambiente em nuvem não possui botão para apagar o histórico ou zerar a equipe. Para uma rodada nova, crie outra equipe com identificação clara. Há um limite de 15 equipes criadas por conta nesta edição; planeje as sete equipes e uma equipe de ensaio.

## Se algo não funcionar

| Sinal | Ação |
| --- | --- |
| Ambiente em nuvem aguarda configuração | Verifique as três variáveis na Vercel e faça novo deploy |
| Não entra com a senha inicial | Confira e-mail, senha e se a conta foi criada no projeto correto |
| Aluno não enxerga a equipe | Aprove a associação e confirme a seleção em Equipes e turmas |
| A pessoa vê a atividade, mas não confirma | Confira função, responsável já atribuído, etapa anterior e checklist |
| Servidor recusou uma tentativa | Abra Registros neste aparelho, leia o motivo e revise; descarte a tentativa inválida antes de criar outra |
| Conexão indisponível | Mantenha a tela aberta ao reconectar; não apague dados do navegador com pendências |
| Publicação falha com permissão 403 | Faça a importação pela própria conta autorizada da Vercel ou encaminhe ao administrador do escopo |

A prática com madeira e máquinas depende da supervisão e dos procedimentos da oficina. Os checklists do sistema organizam o registro logístico da atividade e devem ser conferidos com os responsáveis pela marcenaria.
