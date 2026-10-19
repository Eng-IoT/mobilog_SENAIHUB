# Identidade do produto por QR Code

Cada unidade de um pedido recebe uma identidade permanente. O QR Code abre a ficha pública da peça, com logo do SENAI Hub, sem pedir login. Em um lote de três móveis há três QR Codes diferentes; as etapas e os consumos continuam sendo registrados para o lote inteiro.

## Preparar a ficha

1. Entre como Logística ou docente e abra **Pedidos**.
2. No pedido, escolha **Ficha QR** e **Completar dados do produto**.
3. Confira com a marcenaria e preencha descrição, tipo de madeira ou painel, origem do material, dimensões, acabamento, técnica construtiva e cuidados de conservação.
4. Salve e aguarde a confirmação de sincronização.
5. Abra **Ficha QR** novamente. Quando houver várias unidades, escolha a peça no seletor.
6. Use **Abrir ficha** para conferir o conteúdo e **Imprimir etiqueta** para preparar o QR que será fixado na peça correspondente.

Informe somente características conferidas. Campos não preenchidos aparecem como não informados. As observações internas do pedido, o cliente ou destino, os nomes e acessos da equipe e os motivos de pausa não aparecem na consulta pública.

Os mesmos campos podem ser preenchidos ao cadastrar um pedido, em **Ficha pública do produto**. A edição pertence à Logística e ao docente; cada marceneiro continua registrando a execução pelo seu aplicativo.

## Entender os registros

| Informação | Como é obtida |
| --- | --- |
| Identidade | Código do pedido, número da unidade e identificador exclusivo |
| Início da fabricação | Registro de início do Corte |
| Fabricação concluída | Última conclusão do Acabamento, válida no ciclo atual |
| Qualidade aprovada | Conclusão da etapa de Qualidade no ciclo atual |
| Tempo ativo de fabricação | Soma da execução de Corte, Preparação, Montagem e Acabamento; desconta pausas e inclui ciclos anteriores de retrabalho |
| Tempo decorrido | Intervalo entre início do Corte e fim do Acabamento; enquanto a fabricação estiver aberta, vai até a consulta e inclui espera e pausas |
| Materiais | Lista do pedido, com quantidade total do lote e situação prevista, reservada ou consumida |
| Histórico | Datas, setores e ações confirmadas no sistema |

Datas e horários usam o fuso de Rio Branco, Acre. O identificador da peça permanece igual depois de alterações na ficha e de novas confirmações das etapas. A página consulta atualizações a cada 15 segundos enquanto estiver visível e conectada.

Em equipes de treinamento, a ficha exibe a identificação de projeto educacional. Os registros podem conter exemplos ou simulações; a equipe deve explicar isso ao visitante.

## Conferência no Mundo SENAI

- Preencha a ficha com as características da peça pronta que será exposta.
- Imprima o QR correspondente à unidade e fixe-o sem cobrir partes importantes do móvel.
- Escaneie usando um smartphone sem sessão no MobiLog e confira a abertura direta da ficha.
- Confira nome, número da unidade, madeira, medidas e acabamento.
- Durante o ensaio, registre uma etapa no pedido de treinamento e confira a atualização da ficha e da TV.

**Etiquetas antigas precisam ser reimpressas.** Os QR Codes anteriores guardam o endereço da área de trabalho; a nova etiqueta guarda o endereço próprio da peça. O acesso da equipe continua disponível separadamente.

## Instalação e verificação técnica

Em uma instalação nova, execute `database/01_estrutura.sql` e depois `database/02_rastreabilidade.sql`. Em instalações existentes, execute somente o segundo script uma vez. Ele cria as identidades das unidades já cadastradas e gera as futuras na mesma transação que grava os pedidos.

A tabela de identidades tem RLS e não concede acesso direto aos papéis `anon` ou `authenticated`. A API autenticada lista somente as identidades da equipe escolhida. A API pública exige um identificador aleatório válido e devolve uma seleção explícita dos dados de um único produto; ela não devolve o estado da equipe nem credenciais. A chave privada continua restrita ao servidor.

Os testes locais verificam persistência dos identificadores, separação entre equipes, bloqueio de leitura e escrita direta, ausência de dados internos na resposta pública, permissões da edição e cálculo dos tempos com pausa e retrabalho.
