# Implantação · GitHub + Vercel + Supabase

Edição R01 · atualização de 17/10/2026. Responsável pela ativação: instrutor ou apoio de TI.

## 1. Banco que já está pronto

- Projeto: **mobilog-senai-hub**.
- Referência: `agpvqaktfpeoqthgdbwi`.
- Região: São Paulo (`sa-east-1`).
- Painel: https://supabase.com/dashboard/project/agpvqaktfpeoqthgdbwi
- API: https://agpvqaktfpeoqthgdbwi.supabase.co
- Organização escolhida: `jmmengiot-6770's projects`.

Foram instaladas quatro tabelas, quatro políticas de acesso, três funções de servidor e a publicação Realtime do estado. A consulta de segurança remota não retornou apontamentos em 16/10/2026. Nenhuma turma, aluno ou senha foi inserida. O projeto antigo permanece separado.

**Não execute novamente `database/01_estrutura.sql` neste banco.** Esse arquivo instala a mesma estrutura em outro projeto novo e vazio, se houver necessidade. Ele não importa os dados do protótipo anterior.

## 2. Código no GitHub

O projeto está em **https://github.com/Eng-IoT/mobilog_SENAIHUB**, na branch `main`, com o aplicativo, o SQL, a logo fornecida, a demonstração e os manuais para alunos e docentes. `package.json` fica na raiz do repositório.

Para trabalhar no computador:

```bash
git clone https://github.com/Eng-IoT/mobilog_SENAIHUB.git
cd mobilog_SENAIHUB
```

Se usar o ZIP, extraia-o e abra a pasta que contém `package.json`. `.env.example` contém somente as configurações públicas e um campo vazio para a chave privada. Nunca envie `.env.local`, `node_modules`, `.next` ou qualquer chave privada ao GitHub.

## 3. Importar na Vercel

A criação automática foi impedida por erro **403: acesso não autorizado ao escopo da conta**. A publicação pode ser feita pela sua própria sessão na Vercel:

1. Abra https://vercel.com/new e importe `Eng-IoT/mobilog_SENAIHUB`.
2. Defina o nome do novo projeto como `mobilog-senai-hub`, framework **Next.js** e raiz que contém `package.json`.
3. Use Node.js **22.x**, instalação `npm ci` e build `npm run build`. O arquivo `vercel.json` já indica a configuração do projeto e região `gru1`.
4. Antes de publicar, cadastre as três variáveis da tabela abaixo nos ambientes usados. Se usar Production e Preview, configure os dois.
5. Publique e abra a URL fornecida pela Vercel. Se adicionar variáveis depois do build, faça **Redeploy**: variáveis `NEXT_PUBLIC_` entram no JavaScript durante a compilação.

| Variável | Origem e uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Copie de `.env.example`; identifica o banco exclusivo. Pode ser pública. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Copie de `.env.example`; chave pública `sb_publishable_...`. |
| `SUPABASE_SECRET_KEY` | No painel do projeto Supabase, Settings > API Keys > Secret keys. Use ou crie uma chave `sb_secret_...` e cole diretamente na Vercel. Somente servidor. |

A chave privada não foi disponibilizada pela conexão de ferramentas e **não está no ZIP**. Não a coloque em variável com prefixo `NEXT_PUBLIC_`, no GitHub, em imagens de tela ou em material dos alunos. Não é necessário enviá-la nesta conversa.

Confira os planos e as cotas ativos no painel dos provedores. A entrega não garante gratuidade ou capacidade para a turma sem o ensaio.

## 4. Primeiro acesso do instrutor

Caminho recomendado para iniciar sem depender de entrega de e-mail:

1. No painel Supabase do projeto correto, abra **Authentication > Users > Add user > Create new user**.
2. Informe seu e-mail e uma senha pessoal com pelo menos 10 caracteres, letras e números. Marque **Auto Confirm User**, caso a interface ofereça essa opção.
3. Abra a URL publicada do MobiLog e entre com esses dados.
4. Informe seu nome e crie uma equipe com identificação clara, como `Treino G1 · Logística 2026`.
5. Mantenha marcados os exemplos e a identificação de treinamento para os ensaios.
6. Guarde o código de equipe mostrado uma vez. Em **Equipe**, você também poderá gerar outro código e invalidar o anterior.

Quem cria uma equipe torna-se instrutor/administrador **daquela equipe**. Uma conta não recebe acesso às equipes de outras pessoas por criar a própria.

## 5. Cadastro dos alunos

Em **Equipe > Cadastrar acesso**, o instrutor informa nome, e-mail de acesso, senha inicial individual e função. A criação não envia e-mail. A pessoa entra e troca a senha antes de acessar as atividades.

Use um e-mail único por pessoa. Para evitar dúvidas de recuperação, prefira endereços dos próprios alunos. Se adotar identificações didáticas, registre a correspondência em lista restrita ao instrutor. Não compartilhe senhas ou uma conta entre colegas.

Uma conta já existente pode entrar, usar **Equipes e turmas > Entrar em uma equipe** e solicitar acesso com o código. O instrutor aprova a solicitação e escolhe a função. A mesma conta pode participar de várias equipes sem ser criada novamente.

O instrutor só redefine pelo aplicativo a senha das contas criadas diretamente por aquela equipe. Contas pessoais ou criadas em outra equipe exigem recuperação pelo responsável do projeto Supabase.

## 6. Cadastro por e-mail, se optar por habilitá-lo

O botão **Criar minha conta** está implementado. Para confirmar e-mail no ambiente publicado:

1. Em Authentication > URL Configuration, defina **Site URL** como a URL pública do MobiLog.
2. Inclua a URL exata `https://SEU-DOMINIO/auth/confirm` na lista de redirecionamentos permitidos. Se usar desenvolvimento local, adicione `http://localhost:3000/auth/confirm` separadamente.
3. Em Authentication > Email Templates > Confirm signup, use um link para o endpoint implementado:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirmar meu acesso ao MobiLog</a>
```

4. Faça um teste com seu próprio endereço antes de orientar a turma. A entrega de mensagens e os limites dependem da configuração de e-mail do projeto. Para o treinamento, o cadastro feito pelo instrutor evita depender desse envio.

O exemplo acima usa o domínio principal em Site URL. Não o aplique sem ajustar o projeto correto. A rota implementada também aceita o retorno de código PKCE.

Referências oficiais: https://supabase.com/docs/guides/auth/auth-email-templates e https://supabase.com/docs/guides/auth/server-side/creating-a-client

## 7. Instalação no smartphone

Use a URL **HTTPS publicada**. Android: abra no navegador e procure Instalar aplicativo ou Adicionar à tela inicial. iPhone: Safari > Compartilhar > Adicionar à Tela de Início. A disponibilidade do botão depende do navegador. Cada pessoa deve entrar com sua conta.

O arquivo HTML local serve para ensaiar a operação em um aparelho. Ele não sincroniza, não cria usuários e não oferece QR entre aparelhos.

## 8. Verificação para liberar a turma

Execute o roteiro em `ACEITE_E_TESTES.md` com um computador e dois celulares. Confirme login, troca de senha, atribuição de função, andamento da etapa e atualização no computador. Meça a atualização com a tela visível; existe consulta de apoio a cada 6 segundos e ela depende da rede.

Abra `/api/health` na URL publicada. `configured: true` significa apenas que as três variáveis existem; não comprova que a chave, o banco ou o login funcionam. A confirmação é o ensaio completo.

## 9. Computador de desenvolvimento

Instale Node.js 22 LTS, use `npm ci`, copie `.env.example` para `.env.local`, complete a chave privada e rode `npm run check:env`. Em seguida, `npm run dev` e abra `http://localhost:3000`. Não coloque o arquivo privado no Git.

Para preparar outro banco: crie um projeto exclusivo vazio, execute `database/01_estrutura.sql` uma única vez e substitua as três variáveis pelas desse novo projeto. Aplique mudanças futuras como novas migrações; não apague tabelas para atualizar esta entrega.
