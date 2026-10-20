# MobiLog · SENAI Hub

**Marcenaria e Logística Conectadas**  
Da matéria-prima à entrega, tudo conectado.

Ferramenta educacional para os alunos de Logística acompanharem pedidos, materiais e execução na marcenaria. Um painel no computador e o mesmo aplicativo web no smartphone: cada aluno usa sua conta, assume uma atividade e registra a execução. O servidor valida a etapa e atualiza os demais aparelhos.

## Comece por aqui

- **Treinar agora:** abra `dist/MobiLog-Demonstracao.html` no navegador de um computador. O arquivo usa dados fictícios e não precisa de instalação ou internet. Cada navegador tem sua própria simulação. O ambiente publicado também oferece `/demo`.
- **Acessar com contas e sincronização:** [MobiLog publicado](https://mobilog-senaihub.vercel.app). Para uma nova instalação, siga [docs/IMPLANTACAO.md](docs/IMPLANTACAO.md).
- **Manual para alunos e docentes no evento:** [PDF](docs/MobiLog-Manual-Alunos-e-Docentes-Mundo-SENAI.pdf) e [Word editável](docs/MobiLog-Manual-Alunos-e-Docentes-Mundo-SENAI.docx), com TV, notebook, três marceneiros e peça pronta.
- **Preparar a turma:** leia [docs/TREINAMENTO_ATE_26_10_2026.md](docs/TREINAMENTO_ATE_26_10_2026.md) e [docs/GUIA_ALUNOS.md](docs/GUIA_ALUNOS.md).

## Situação da entrega · atualização de 20/10/2026

| Item | Situação verificada |
| --- | --- |
| Código React/Next.js para GitHub e Vercel | Preparado; compilação de produção aprovada |
| Banco exclusivo Supabase | Criado em São Paulo; estrutura, RLS e funções instaladas |
| Segurança do esquema remoto | Verificação automática sem apontamentos em 16/10/2026 |
| Regras e permissões | 53 testes automatizados aprovados, incluindo PostgreSQL local isolado, rastreabilidade, exclusão, limpeza e recuperação |
| Demonstração em arquivo único | Gerada com interface, marca e recursos incorporados |
| Publicação na Vercel | Aplicativo publicado; atualizações da branch `main` seguem a integração com o GitHub |
| Login e sincronização em aparelhos reais | Fluxo validado pela equipe; repetir o ensaio antes do evento |
| Repositório GitHub | Código e manuais disponíveis em [Eng-IoT/mobilog_SENAIHUB](https://github.com/Eng-IoT/mobilog_SENAIHUB), na branch `main`. |

As contas são administradas pelo docente no aplicativo. O pacote não contém senhas de acesso nem a chave privada do Supabase. Os testes locais e a compilação não substituem o ensaio com os celulares da turma.

## Funcionalidades

- Pedidos de mesas, armários, estantes e bancos, com receitas ajustáveis por pedido.
- Oito etapas sequenciais, checklist, conclusão do lote inteiro e impedimento de avanço indevido.
- Reserva no planejamento e consumo por etapa, recebimento de materiais e alerta de saldo mínimo.
- Pausa com motivo, retomada e devolução da qualidade para acabamento.
- Login individual, troca obrigatória da senha inicial e funções por equipe.
- Instrutor cadastra acessos, aprova solicitações, ajusta funções, suspende membros e reatribui a etapa atual.
- Histórico com autoria validada pelo servidor; reenvio da mesma tentativa não repete a baixa de material.
- Pendências locais sem conexão, reenvio com o aplicativo aberto e atualização por Realtime com consulta de apoio a cada 6 segundos.
- QR exclusivo por peça, ficha pública de rastreabilidade sem login, relatório CSV e cópia JSON do estado.
- Exclusão de pedidos pela Logística ou docente; limpeza e restauração da última cópia pelo docente, com confirmação digitada.
- PWA para a tela inicial, layout para smartphone e demonstração local separada dos dados em nuvem.

## Apresentação na TV

Em **Pedidos**, abra o móvel e selecione **Acompanhar na TV**. A apresentação abre em uma nova aba, com modelo 3D ilustrativo girando lentamente, etapa atual em letras grandes, jornada completa e botão de tela cheia. A tela consulta os pedidos existentes e mantém o acesso pela equipe. Veja o [guia de acompanhamento na TV](docs/ACOMPANHAMENTO_TV.md).

## Identidade de cada peça

Em **Pedidos → Ficha QR**, selecione a unidade e imprima a etiqueta. O visitante abre uma ficha com materiais, características, datas, tempos e histórico, sem login. A Logística e o docente podem usar **Completar dados do produto** para informar madeira, origem, medidas, acabamento e cuidados. Veja o [guia de identidade do produto](docs/IDENTIDADE_DO_PRODUTO.md). Etiquetas do modelo anterior precisam ser reimpressas.

## Exclusão e nova rodada de treinamento

Em **Pedidos**, a Logística e o docente podem usar a lixeira para excluir todas as unidades de um pedido, digitando seu código. O docente também encontra **Limpar produção** no topo do Painel ou de Pedidos, com a opção de manter ou zerar os saldos de materiais. Contas, funções e catálogo são preservados. **Restaurar dados** recupera o estado anterior à última exclusão, limpeza ou restauração e substitui toda a produção atual da equipe. Veja o [guia de exclusão e reset](docs/EXCLUSAO_E_RESET.md).

## Tecnologia

Node.js 22.13+ da linha 22; Next.js 16, React 19, TypeScript, Three.js, Supabase PostgreSQL/Auth/Realtime e Vercel. Bibliotecas fixadas no `package-lock.json`. Não depende de Cloudflare Workers, D1 ou Vinext.

O banco mantém equipes, associações e um estado versionado por equipe. A API valida a conta, a função e a equipe explícita em cada operação. Alterações usam comparação da revisão para lidar com confirmações simultâneas. O navegador não pode gravar as tabelas diretamente nem chamar as funções privilegiadas.

## Executar no computador

Instale Node.js 22 LTS. Na pasta que contém `package.json`:

```bash
npm ci
```

Copie `.env.example` para `.env.local` e complete `SUPABASE_SECRET_KEY` diretamente no arquivo local. URL e chave pública do projeto exclusivo já estão no exemplo. Não envie `.env.local` ao GitHub.

```bash
npm run check:env
npm run dev
```

Abra `http://localhost:3000`. Use `http://localhost:3000/demo` para os exemplos isolados. O treinamento na versão em nuvem exige as três variáveis e o banco configurado. O arquivo HTML em `dist` não exige Node.js.

## Verificar e compilar

```bash
npm test
npm run typecheck
npm run build
npm run demo:build
```

`npm test` usa um PostgreSQL local descartável via PGlite; não toca no banco em nuvem. A integração do GitHub verifica testes, build e geração da demonstração. `npm run check:env` informa somente presença/ausência das variáveis, sem imprimir valores.

## Conteúdo do pacote

| Caminho | Finalidade |
| --- | --- |
| `app/`, `components/`, `hooks/`, `lib/` | Interface, API, contas e regras |
| `database/01_estrutura.sql` | Estrutura inicial em um projeto Supabase vazio |
| `database/02_rastreabilidade.sql` | Identidades permanentes dos produtos e criação automática por unidade |
| `public/` | Logo fornecida, ícones, manifesto e service worker |
| `dist/MobiLog-Demonstracao.html` | Treinamento local independente |
| `docs/IMPLANTACAO.md` | GitHub, Vercel, variáveis e primeiro acesso |
| `docs/GUIA_INSTRUTOR.md` | Turmas, contas, atribuições e rotina |
| `docs/GUIA_ALUNOS.md` | Operação e exercícios |
| `docs/TREINAMENTO_ATE_26_10_2026.md` | Cronograma, evidências e avaliação sugerida |
| `docs/ACEITE_E_TESTES.md` | Resultados técnicos e ensaio em aparelhos reais |
| `docs/ROTEIRO_APRESENTACAO.md` | Falas e demonstração para o público |
| `docs/EXCLUSAO_E_RESET.md` | Exclusão, limpeza da produção, estoque e restauração da última cópia |
| `docs/ARQUITETURA.md` | Modelo de dados e limites desta edição |

## Limites desta edição

É uma entrega para treinamento e demonstração educacional. Receitas, saldos iniciais e pedidos de exemplo são fictícios. O percentual conta etapas concluídas, não horas de fabricação. Não há conclusão parcial do lote, edição livre de etapas, fotos, apontamento de custos, integração com máquinas ou aplicativo de loja. A cópia JSON é para conferência e recuperação técnica; não existe botão de importação. O sistema não deve substituir os procedimentos de segurança da oficina.

A marca SENAI Hub foi preservada do arquivo fornecido. A composição utiliza azul e laranja com tons de madeira. O uso institucional e a apresentação do projeto devem seguir a orientação do responsável no SENAI.
