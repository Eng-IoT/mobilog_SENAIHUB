# MobiLog · SENAI Hub

**Marcenaria e Logística Conectadas**  
Da matéria-prima à entrega, tudo conectado.

Ferramenta educacional para os alunos de Logística acompanharem pedidos, materiais e execução na marcenaria. Um painel no computador e o mesmo aplicativo web no smartphone: cada aluno usa sua conta, assume uma atividade e registra a execução. O servidor valida a etapa e atualiza os demais aparelhos.

## Comece por aqui

- **Treinar agora:** abra `dist/MobiLog-Demonstracao.html` no navegador de um computador. O arquivo usa dados fictícios e não precisa de instalação ou internet. Cada navegador tem sua própria simulação. O ambiente publicado também oferece `/demo`.
- **Publicar com contas e sincronização:** siga [docs/IMPLANTACAO.md](docs/IMPLANTACAO.md). A estrutura do banco exclusivo já está instalada; faltam a chave privada no ambiente e a importação na sua conta da Vercel.
- **Manual para alunos e docentes no evento:** [PDF](docs/MobiLog-Manual-Alunos-e-Docentes-Mundo-SENAI.pdf) e [Word editável](docs/MobiLog-Manual-Alunos-e-Docentes-Mundo-SENAI.docx), com TV, notebook, três marceneiros e peça pronta.
- **Preparar a turma:** leia [docs/TREINAMENTO_ATE_26_10_2026.md](docs/TREINAMENTO_ATE_26_10_2026.md) e [docs/GUIA_ALUNOS.md](docs/GUIA_ALUNOS.md).

## Situação da entrega · atualização de 17/10/2026

| Item | Situação verificada |
| --- | --- |
| Código React/Next.js para GitHub e Vercel | Preparado; compilação de produção aprovada |
| Banco exclusivo Supabase | Criado em São Paulo; estrutura, RLS e funções instaladas |
| Segurança do esquema remoto | Verificação automática sem apontamentos em 16/10/2026 |
| Regras e permissões | 27 testes automatizados aprovados, incluindo PostgreSQL local isolado |
| Demonstração em arquivo único | Gerada com interface, marca e recursos incorporados |
| Publicação na Vercel | Não realizada: a conexão retornou 403 por falta de acesso ao escopo da conta |
| Login e sincronização em aparelhos reais | A validar depois da configuração da chave privada e publicação |
| Repositório GitHub | Código e manuais disponíveis em [Eng-IoT/mobilog_SENAIHUB](https://github.com/Eng-IoT/mobilog_SENAIHUB), na branch `main`. |

Não há senhas prontas nem conta compartilhada. O pacote não contém a chave privada do Supabase. Os testes locais e a compilação não substituem o ensaio com os celulares da turma.

## Funcionalidades

- Pedidos de mesas, armários, estantes e bancos, com receitas ajustáveis por pedido.
- Oito etapas sequenciais, checklist, conclusão do lote inteiro e impedimento de avanço indevido.
- Reserva no planejamento e consumo por etapa, recebimento de materiais e alerta de saldo mínimo.
- Pausa com motivo, retomada e devolução da qualidade para acabamento.
- Login individual, troca obrigatória da senha inicial e funções por equipe.
- Instrutor cadastra acessos, aprova solicitações, ajusta funções, suspende membros e reatribui a etapa atual.
- Histórico com autoria validada pelo servidor; reenvio da mesma tentativa não repete a baixa de material.
- Pendências locais sem conexão, reenvio com o aplicativo aberto e atualização por Realtime com consulta de apoio a cada 6 segundos.
- QR do pedido na versão publicada, relatório CSV e cópia JSON do estado.
- PWA para a tela inicial, layout para smartphone e demonstração local separada dos dados em nuvem.

## Tecnologia

Node.js 22.13+ da linha 22; Next.js 16, React 19, TypeScript, Supabase PostgreSQL/Auth/Realtime e Vercel. Bibliotecas fixadas no `package-lock.json`. Não depende de Cloudflare Workers, D1 ou Vinext.

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
| `database/01_estrutura.sql` | Instalação em outro projeto Supabase vazio |
| `public/` | Logo fornecida, ícones, manifesto e service worker |
| `dist/MobiLog-Demonstracao.html` | Treinamento local independente |
| `docs/IMPLANTACAO.md` | GitHub, Vercel, variáveis e primeiro acesso |
| `docs/GUIA_INSTRUTOR.md` | Turmas, contas, atribuições e rotina |
| `docs/GUIA_ALUNOS.md` | Operação e exercícios |
| `docs/TREINAMENTO_ATE_26_10_2026.md` | Cronograma, evidências e avaliação sugerida |
| `docs/ACEITE_E_TESTES.md` | Resultados técnicos e ensaio em aparelhos reais |
| `docs/ROTEIRO_APRESENTACAO.md` | Falas e demonstração para o público |
| `docs/ARQUITETURA.md` | Modelo de dados e limites desta edição |

## Limites desta edição

É uma entrega para treinamento e demonstração educacional. Receitas, saldos iniciais e pedidos de exemplo são fictícios. O percentual conta etapas concluídas, não horas de fabricação. Não há conclusão parcial do lote, edição livre de etapas, fotos, apontamento de custos, integração com máquinas ou aplicativo de loja. A cópia JSON é para conferência e recuperação técnica; não existe botão de importação. O sistema não deve substituir os procedimentos de segurança da oficina.

A marca SENAI Hub foi preservada do arquivo fornecido. A composição utiliza azul e laranja com tons de madeira. O uso institucional e a apresentação do projeto devem seguir a orientação do responsável no SENAI.
