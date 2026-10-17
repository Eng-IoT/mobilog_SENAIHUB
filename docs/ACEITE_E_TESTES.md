# Verificação e aceite · MobiLog R01

Registro técnico em 16/10/2026. Os campos de ensaio estão em branco para serem preenchidos após a publicação.

## Verificação já executada

| Verificação | Resultado e limite |
| --- | --- |
| `npm test` | 27 testes passaram: domínio, identidade, permissões, isolamento e SQL em PostgreSQL local descartável |
| `npm run typecheck` | Aprovado para os componentes, API e regras |
| `npm run build` | Build de produção Next.js 16.3.8 aprovado |
| `npm audit --omit=dev` | Nenhuma vulnerabilidade reportada nas dependências de produção nesta consulta |
| `npm run demo:build` | Demonstração independente gerada, com JavaScript, CSS e marca incorporados |
| Banco remoto | 4 tabelas com RLS, 4 políticas, 3 funções e Realtime do estado instalados no projeto exclusivo |
| Permissões remotas | `authenticated` não tem UPDATE no estado nem execução da função privilegiada de criação |
| Verificação de segurança Supabase | Sem apontamentos na consulta de 16/10/2026 |
| Vercel | Criação automática recusada com 403 de autorização; nenhum deploy desta versão foi realizado |
| Smartphone e navegador real | Não verificados nesta entrega; executar o ensaio abaixo |

Os testes cobrem sequência obrigatória, reserva e consumo de materiais, reenvio sem baixa duplicada, checklist, lote completo, pausa/retomada, retrabalho, autoria, restrição por função, troca de responsável, equipe explícita por aba, associação pendente, isolamento entre equipes, privilégios SQL, atualização por revisão e transação sem cadastro incompleto.

Os testes automatizados não validam entrega de e-mail, credenciais reais, instalação da PWA, câmera, rede da escola, experiência visual em dispositivos ou capacidade simultânea para 35 alunos. Esses itens dependem do ensaio no ambiente publicado.

## Ensaio do ambiente publicado

Ambiente/URL: __________________________  Data: ________________

Instrutor: __________________________  Equipe de ensaio: __________________________

Dispositivos/navegadores: __________________________________________________________

Use dois celulares e um computador, com contas distintas. Registre apenas nomes e identificadores de evidência, sem senhas.

| ID | Ação | Resultado esperado | Resultado observado / evidência |
| --- | --- | --- | --- |
| A01 | Abrir URL no computador | Logo SENAI Hub, MobiLog e tela de acesso carregam |  |
| A02 | Criar acesso pelo instrutor; entrar no celular | Troca de senha inicial obrigatória antes das atividades |  |
| A03 | Entrar como aluno e selecionar equipe | Nome, equipe e função corretos |  |
| A04 | Solicitar acesso por código com outra conta | Equipe não libera dados antes da aprovação |  |
| A05 | Aprovar função; aluno sair e entrar | Acesso liberado somente à função atribuída |  |
| A06 | Logística cadastrar uma mesa didática | Pedido inicia em Planejamento; Corte continua bloqueado |  |
| A07 | Concluir planejamento | Reserva aparece e a etapa de Corte é liberada |  |
| A08 | Aluno iniciar/assumir uma etapa no celular | Responsável aparece pelo nome e o computador atualiza; medir o tempo |  |
| A09 | Outro aluno da mesma função tentar confirmar | Operação bloqueada; autoria preservada |  |
| A10 | Instrutor reatribuir a etapa atual | Nova pessoa consegue executar; histórico registra a mudança |  |
| A11 | Tentar concluir sem checklist ou com quantidade parcial | Conclusão recusada; etapa seguinte continua bloqueada |  |
| A12 | Pausar com motivo, retomar e concluir | Pausa registrada; retomada libera continuidade correta |  |
| A13 | Qualidade devolver ao Acabamento | Retorno registrado, consumo anterior preservado e nova inspeção necessária |  |
| A14 | Finalizar até Entrega | Oito etapas concluídas, status Entregue e progresso 100% |  |
| A15 | Pedir material acima do disponível no planejamento | Sem conclusão nem saldo negativo; receber material permite nova tentativa |  |
| A16 | Desligar rede com atividade aberta e registrar | Tentativa pendente no aparelho; outro painel não avança |  |
| A17 | Ligar rede e manter a tela aberta | Tentativa aceita ou motivo de recusa legível; reenvio não duplica consumo |  |
| A18 | Abrir QR do pedido em outro aparelho | Mesmo pedido após login na equipe correta |  |
| A19 | Abrir duas equipes em duas abas e trocar seleção | Cada aba confirma somente na equipe que apresenta |  |
| A20 | Suspender aluno e tentar nova operação | Operação futura bloqueada no servidor |  |
| A21 | Exportar CSV e Cópia JSON | Arquivos abrem; equipe e registros conferem |  |
| A22 | Instalar na tela inicial em um Android e um iPhone disponíveis | Abre a URL publicada, mantém identificação e permite login |  |
| A23 | Ensaio da turma conectada no horário habitual | Registro de tempo de atualização e eventuais erros por grupo |  |

A meta operacional é receber a confirmação e atualizar o painel com a tela visível em poucos segundos. Há consulta de apoio a cada 6 segundos, além do Realtime; a rede e as cotas podem afetar esse tempo. Anote o tempo observado em A08 e A23, sem tratá-lo como garantia.

## Aceite para 26/10

- [ ] Implantação concluída com as três variáveis no ambiente correto.
- [ ] Login individual e primeiro acesso aprovados.
- [ ] Fluxo completo, materiais e autoria aprovados.
- [ ] Atualização entre smartphone e computador comprovada.
- [ ] Pendências e reenvio verificados.
- [ ] Erros que impedem o uso corrigidos e conferidos.
- [ ] CSV, cópia JSON e demonstração local disponíveis.
- [ ] Funções e roteiro distribuídos aos alunos.

Responsável pelo aceite: ________________________ Data: ________________

Situação: [ ] Liberado para treinamento compartilhado  [ ] Ajustes pendentes
