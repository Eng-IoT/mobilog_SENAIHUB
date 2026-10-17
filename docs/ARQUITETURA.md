# Arquitetura e manutenção

## Componentes

- **React/Next.js:** interface responsiva, formulário de acesso e rotas de API executadas no servidor da Vercel.
- **Supabase Auth:** contas individuais, sessões por cookie e verificação do usuário em cada operação.
- **PostgreSQL:** equipes, vínculos, estado de produção e código de entrada protegido por hash.
- **Realtime:** avisa uma mudança de estado; a aplicação consulta os dados autorizados novamente. Uma consulta a cada 6 segundos apoia a atualização com a tela visível.
- **PWA:** manifesto, ícones e service worker para recursos públicos. API e autenticação não são armazenadas no cache do service worker.

## Tabelas

| Tabela | Conteúdo |
| --- | --- |
| `public.mobilog_workspaces` | Nome, dono e identificação de treinamento da equipe |
| `public.mobilog_memberships` | Conta, equipe, nome apresentado, função e liberação |
| `public.mobilog_states` | Um documento JSON de produção por equipe, revisão e data de atualização |
| `mobilog_private.join_codes` | Hash SHA-256 do código de entrada, sem exposição ao navegador |

Pedidos, materiais e eventos ficam no documento JSON de cada equipe. É uma escolha simples para a escala de treinamento desta edição. Uma operação lê a revisão, valida o comando e só grava se essa revisão ainda for a atual. Em caso de concorrência, tenta novamente sobre o estado atualizado. Não há um banco diferente em cada smartphone.

O registro do evento é parte do mesmo documento da alteração de produção; uma única gravação de estado/revisão preserva essa relação. O histórico não é um registro legal inviolável: quem administra diretamente o banco pode alterar seu conteúdo.

## Regras de acesso

As tabelas têm RLS. A conta autenticada consulta sua própria associação. Somente uma associação ativa permite consultar o estado da equipe. Não há GRANT de escrita ao navegador. As três funções de criação de equipe, solicitação e troca de código só podem ser chamadas pelo servidor com a chave privada.

As rotas verificam a identidade com `auth.getUser()`, consultam a função no banco e validam o comando. A escolha de função não vem de `user_metadata`. O cabeçalho de equipe é verificado contra as associações ativas para que abas diferentes não dependam somente do cookie de seleção.

A chave privada é exclusiva do servidor e fica no módulo marcado `server-only`. Contas criadas pelo instrutor recebem uma indicação protegida de troca de senha inicial. O servidor bloqueia operações até que ela seja alterada. A redefinição de senha no aplicativo é restrita a contas provisionadas pela própria equipe.

## Estado de produção

- Apenas a etapa liberada pode iniciar.
- Iniciar ou assumir vincula a etapa à pessoa autenticada.
- A mesma função não permite que outra pessoa finalize uma atividade já assumida.
- Checklist e quantidade total precisam conferir para concluir.
- O planejamento reserva todos os itens previstos quando há disponibilidade.
- Corte consome MDF/madeira; preparação consome fita; montagem consome ferragens.
- Retrabalho devolve para acabamento e nova inspeção, preserva histórico e não repete os consumos anteriores.
- `eventId` e impressão digital do comando permitem reconhecer o mesmo reenvio sem repetir a operação.

## Sem conexão

Tentativas e última consulta ficam no armazenamento local, separados por conta e equipe. Não há liberação otimista da próxima etapa. Ao reconectar, o aplicativo aberto envia a fila e mostra aceitação ou recusa. Não existe garantia de envio em segundo plano com o aplicativo fechado. O primeiro login exige internet. Se a aplicação for fechada sem rede, a tela de acesso pode exigir reconexão para validar a sessão.

Limpar o navegador ou perder o aparelho pode apagar tentativas ainda não enviadas. O banco contém somente as operações aceitas. Cópias JSON e CSV devem ser guardadas depois da sincronização; a cópia JSON não inclui a fila pendente de cada celular.

## Cópias e recuperação

Cópia JSON exporta o documento de produção, revisão, equipe e data. CSV exporta a seleção de pedidos visível. Nenhum deles inclui senhas. Não existe importação de backup pela interface. Uma recuperação exige apoio técnico, conferência da equipe de destino e migração controlada no banco. Os recursos de backup gerenciado dependem do plano real do Supabase.

## Evolução após o treinamento

Para uso contínuo em uma marcenaria, avaliar tabelas normalizadas por pedido/evento, catálogo editável de materiais, medição de tempos e quantidades parciais, anexos, recuperação de senha pelo próprio usuário, observabilidade, paginação do histórico, política de retenção e testes de carga na rede real. Esses recursos não foram apresentados como já implementados nesta edição.

## Arquivo de marca

`public/logo-senai-hub.webp` preserva o arquivo fornecido. SHA-256:

`90546d294943da67d5998b8836e47a3cffc94f9df5ca53e608519d04afa88a42`

## Documentação oficial consultada

- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/environment-variables
