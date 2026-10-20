# MobiLog · Exclusão, limpeza e restauração

Orientação para docentes e equipe de Logística · 20/10/2026.

Use estes recursos para retirar um pedido incorreto ou preparar uma nova rodada de treinamento. A operação vale para toda a equipe selecionada e será atualizada nos demais aparelhos. Publicar esta atualização não apaga os dados existentes.

## Quem pode usar

| Recurso | Acesso necessário | Onde encontrar |
| --- | --- | --- |
| Excluir produto | Logística ou instrutor/administrador | Lixeira na linha de **Pedidos**, ou botão **Excluir produto** nos detalhes do pedido |
| Limpar produção | Instrutor/administrador | No topo do **Painel** ou de **Pedidos** |
| Restaurar dados | Instrutor/administrador | No topo do **Painel** ou de **Pedidos**, quando há cópia disponível |

Marceneiros e visitantes não podem executar essas operações. Para treinar sem alterar a equipe, use a [demonstração](https://mobilog-senaihub.vercel.app/demo).

## Excluir um produto

1. Abra **Pedidos** e confira o código e o nome do móvel.
2. Clique na lixeira ou abra os detalhes e selecione **Excluir produto**.
3. Leia o resumo. A exclusão remove **todas as unidades daquele pedido**, suas etapas e seus registros específicos.
4. Digite o código exibido, por exemplo **OP-001**, e clique em **Confirmar exclusão**.

As reservas de materiais são liberadas. O material já consumido continua descontado do estoque, pois a exclusão do registro não devolve material físico. As fichas QR desse pedido ficam indisponíveis enquanto o produto estiver excluído. A numeração não é reutilizada em produtos novos.

## Limpar a produção para uma nova rodada

1. Entre com a conta de instrutor/administrador e selecione a equipe correta.
2. Combine com os participantes uma pausa nos registros e confira as pendências dos aparelhos.
3. No **Painel** ou em **Pedidos**, clique em **Limpar produção**.
4. Confira a quantidade de pedidos, unidades e registros que serão removidos. Se necessário, use **Baixar cópia JSON antes de continuar**.
5. Escolha o tratamento do estoque:

| Opção | Resultado |
| --- | --- |
| **Zerar também os saldos de materiais** marcada, opção inicial | Saldos físicos ficam em zero. Registre novos recebimentos antes de liberar a produção. |
| Opção desmarcada | Mantém os saldos físicos atuais e libera as reservas dos pedidos removidos. |

6. Digite **LIMPAR**, em letras maiúsculas, e clique em **Confirmar limpeza**.

Pedidos, etapas e histórico ficam limpos. Contas, funções, equipe e cadastro dos materiais são mantidos. Os próximos pedidos continuam a numeração anterior para que um QR antigo nunca identifique outro produto. As fichas QR dos pedidos removidos ficam indisponíveis.

## Restaurar a cópia anterior

1. Entre com a conta de instrutor/administrador.
2. Clique em **Restaurar dados** no **Painel** ou em **Pedidos**.
3. Confira a data, a operação e a quantidade de pedidos da cópia.
4. Digite **RESTAURAR** e confirme.

A restauração substitui **toda a produção atual da equipe**, incluindo pedidos, etapas, histórico e saldos de materiais. Não é uma recuperação isolada de um único produto. Os QR Codes dos pedidos recuperados voltam a funcionar. Confira os saldos físicos e as atividades realizadas depois da cópia antes de retomar o trabalho.

Há **uma única cópia de recuperação**, criada antes de cada exclusão, limpeza ou restauração. Uma nova dessas operações substitui a cópia anterior. Ao restaurar, a produção que estava ativa passa a ser a próxima cópia disponível. Alterações normais de produção não substituem essa cópia. O JSON baixado serve como registro adicional; esta versão não tem importação de JSON pela interface.

## Conexão e confirmações

- Na versão em nuvem, as operações exigem conexão e nenhuma tentativa pendente ou bloqueada no aparelho que confirma. Resolva as pendências antes de prosseguir.
- Se outro aparelho alterar a produção durante a confirmação, a operação é recusada. Confira o painel e abra a confirmação novamente.
- Uma exclusão, limpeza ou restauração não entra na fila offline nem é reenviada automaticamente. Se a resposta não chegar, confira o painel antes de repetir.
- Tentativas antigas de outros aparelhos ficam bloqueadas após uma limpeza ou restauração. Revise cada tentativa, descarte as que pertencem à rodada anterior e registre novamente apenas o trabalho atual que ainda precisa ser informado.
- Na demonstração, todas as mudanças ficam limitadas aos dados fictícios daquele navegador.
