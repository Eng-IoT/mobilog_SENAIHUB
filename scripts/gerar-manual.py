from pathlib import Path
import sys
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'docs/MobiLog-Guia-de-Implantacao-e-Treinamento.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
fontdir=Path('/usr/share/fonts/truetype/dejavu')
if (fontdir/'DejaVuSans.ttf').exists():
    pdfmetrics.registerFont(TTFont('Mobi',str(fontdir/'DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('MobiBold',str(fontdir/'DejaVuSans-Bold.ttf')))
    pdfmetrics.registerFontFamily('Mobi',normal='Mobi',bold='MobiBold',italic='Mobi',boldItalic='MobiBold')
    F,FB='Mobi','MobiBold'
else: F,FB='Helvetica','Helvetica-Bold'
NAVY=colors.HexColor('#193b74'); ORANGE=colors.HexColor('#c8481c'); WOOD=colors.HexColor('#9b7046'); GREEN=colors.HexColor('#2d7766')
INK=colors.HexColor('#253349'); MUTED=colors.HexColor('#5b6a7e'); LINE=colors.HexColor('#dce4ed'); PALE=colors.HexColor('#f1f5fa'); AMBER=colors.HexColor('#fff4e6')
W,H=595.276,841.89; LEFT=46; CW=W-2*LEFT
style={
 'body':ParagraphStyle('body',fontName=F,fontSize=9.2,leading=14.5,textColor=INK,spaceAfter=8),
 'small':ParagraphStyle('small',fontName=F,fontSize=8.0,leading=12,textColor=MUTED,spaceAfter=6),
 'h1':ParagraphStyle('h1',fontName=FB,fontSize=24,leading=29,textColor=NAVY,spaceAfter=14),
 'h2':ParagraphStyle('h2',fontName=FB,fontSize=12,leading=17,textColor=NAVY,spaceBefore=12,spaceAfter=7),
 'eyebrow':ParagraphStyle('eyebrow',fontName=FB,fontSize=8,leading=12,textColor=ORANGE,spaceAfter=9),
 'cell':ParagraphStyle('cell',fontName=F,fontSize=8.3,leading=12.5,textColor=INK),
 'th':ParagraphStyle('th',fontName=FB,fontSize=8.2,leading=12,textColor=colors.white),
 'cover':ParagraphStyle('cover',fontName=FB,fontSize=48,leading=55,textColor=NAVY,spaceAfter=10),
 'coverSub':ParagraphStyle('coverSub',fontName=FB,fontSize=18,leading=25,textColor=INK,spaceAfter=12),
 'note':ParagraphStyle('note',fontName=F,fontSize=8.6,leading=13.3,textColor=INK),
}
P=lambda text,kind='body':Paragraph(text,style[kind])
story=[]
def add(text,kind='body'):story.append(P(text,kind))
def title(n,text,sub):
    add(n,'eyebrow');add(text,'h1');add(sub)
def h(text):add(text,'h2')
def step(n,text):add('<b>'+str(n)+'.</b> '+text)
def box(text,color=PALE):
    t=Table([[P(text,'note')]],colWidths=[CW]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('BOX',(0,0),(-1,-1),.6,LINE),('LEFTPADDING',(0,0),(-1,-1),13),('RIGHTPADDING',(0,0),(-1,-1),13),('TOPPADDING',(0,0),(-1,-1),11),('BOTTOMPADDING',(0,0),(-1,-1),11)]));story.extend([t,Spacer(1,10)])
def table(headers,rows,widths):
    data=[[P(escape(x),'th') for x in headers]]+[[P(str(v),'cell') for v in row] for row in rows]
    t=Table(data,colWidths=[CW*x for x in widths],repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),NAVY),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,1),(-1,-1),.4,LINE),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,PALE])]))
    story.extend([t,Spacer(1,10)])
def page():story.append(PageBreak())

def frame(c,d):
    c.saveState();c.setFillColor(NAVY);c.rect(0,H-7,W,7,fill=1,stroke=0)
    if d.page>1:
        logo=ImageReader(str(ROOT/'public/logo-senai-hub.webp'));iw,ih=logo.getSize();c.drawImage(logo,LEFT,H-63,width=118,height=118*ih/iw,mask='auto')
        c.setFont(FB,8);c.setFillColor(MUTED);c.drawRightString(W-LEFT,H-48,'MOBILOG  /  LOGÍSTICA + MARCENARIA')
        c.setStrokeColor(LINE);c.line(LEFT,H-80,W-LEFT,H-80)
    c.setStrokeColor(LINE);c.line(LEFT,48,W-LEFT,48)
    c.setFont(F,7.2);c.setFillColor(MUTED);c.drawString(LEFT,32,'Material didático  |  R01  |  16/10/2026')
    c.drawRightString(W-LEFT,32,str(d.page).zfill(2)+' / 08')
    c.restoreState()

# 1
logo=Image(str(ROOT/'public/logo-senai-hub.webp'));logo.drawWidth=208;logo.drawHeight=208*logo.imageHeight/logo.imageWidth;logo.hAlign='LEFT'
story.extend([logo,Spacer(1,24)])
add('PROJETO MUNDO SENAI  /  PREPARAÇÃO ATÉ 26.10.2026','eyebrow')
add('MobiLog','cover');add('Marcenaria e Logística<br/>Conectadas','coverSub')
add('Guia de implantação e treinamento','h2');add('Da matéria-prima à entrega, tudo conectado.')
story.append(Spacer(1,8))
box('<b>Objetivo da turma</b><br/>Acompanhar pedidos, materiais e execução. Cada integrante registra a própria etapa no smartphone, e a Logística acompanha o fluxo no painel.')
table(['O que foi preparado','O que falta ativar'],[
 ['Código para GitHub/Vercel, banco exclusivo instalado, regras de acesso e demonstração local.','Importar o repositório na Vercel e cadastrar a chave privada do Supabase no ambiente.'],
 ['27 testes aprovados e build de produção concluído.','Ensaiar login, atualização entre aparelhos e instalação na tela inicial com os dispositivos da turma.']
],[.5,.5])
add('Oito etapas, um pedido','h2')
flow=Table([[P('<b>1</b> Planejamento','small'),P('<b>2</b> Corte','small'),P('<b>3</b> Preparação','small'),P('<b>4</b> Montagem','small')],[P('<b>5</b> Acabamento','small'),P('<b>6</b> Qualidade','small'),P('<b>7</b> Embalagem','small'),P('<b>8</b> Entrega','small')]],colWidths=[CW/4]*4)
flow.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),.5,LINE),('LEFTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),5)]));story.append(flow)
story.append(Spacer(1,14));add('Treino imediato: abra <b>MobiLog-Demonstracao.html</b> em um computador. O arquivo usa dados fictícios e funciona localmente. A integração entre aparelhos depende da versão publicada.','small')
page()
# 2
title('01 / ATIVAÇÃO','Publicar e conectar','O banco exclusivo já está instalado. Não execute novamente o SQL de instalação nesse projeto.')
box('<b>Projeto Supabase:</b> mobilog-senai-hub<br/><b>Referência:</b> agpvqaktfpeoqthgdbwi<br/><b>Painel:</b> <link href="https://supabase.com/dashboard/project/agpvqaktfpeoqthgdbwi" color="#193b74">abrir projeto no Supabase</link>')
step(1,'Extraia o ZIP. No GitHub, crie um repositório vazio e envie o conteúdo da pasta <b>mobilog</b>. O arquivo package.json deve ficar na raiz.')
step(2,'Na sua conta da Vercel, importe o repositório. Escolha <b>Next.js</b>, Node.js <b>22.x</b>, instalação <b>npm ci</b> e build <b>npm run build</b>.')
step(3,'Cadastre as três variáveis abaixo antes de publicar. Use os ambientes em que o projeto será testado e apresentado.')
table(['Variável','Onde obter'],[
 ['NEXT_PUBLIC_SUPABASE_URL','Copiar de .env.example. URL pública do projeto exclusivo.'],
 ['NEXT_PUBLIC_SUPABASE_<br/>PUBLISHABLE_KEY','Copiar de .env.example. Chave pública sb_publishable_...'],
 ['SUPABASE_SECRET_KEY','Supabase > Settings > API Keys > Secret keys. Cole a chave sb_secret_... diretamente na Vercel; uso somente no servidor.']
],[.47,.53])
step(4,'Publique. Se alterar variáveis depois do build, faça <b>Redeploy</b>. A chave privada não está no ZIP e não precisa ser enviada nesta conversa.')
step(5,'Crie seu primeiro acesso em <b>Supabase > Authentication > Users > Add user</b>, com e-mail e senha pessoal. Confirme a conta pela opção de confirmação automática, se disponível.')
step(6,'Entre no MobiLog, informe seu nome e crie a equipe de treinamento. Guarde o código mostrado e cadastre os acessos individuais em <b>Equipe</b>.')
box('<b>Publicação pendente:</b> a criação automática na Vercel retornou 403 de autorização ao escopo da conta. A importação deve ser feita pela sessão da conta autorizada. O código e o banco foram preparados apesar desse bloqueio.',AMBER)
add('O passo a passo completo, incluindo cadastro por e-mail, configuração de redirecionamento, execução local e recuperação de acesso, está em docs/IMPLANTACAO.md. Não publique .env.local ou uma chave privada no GitHub.','small')
page()
# 3
title('02 / INSTRUTOR','Organizar pessoas e funções','Proposta para 35 alunos: 7 grupos de 5. Ajuste ao tamanho e ao horário reais da turma.')
table(['Função','Etapas e decisões'],[
 ['Logística','Pedido, lista de materiais, Planejamento, recebimento de material, Embalagem e Entrega.'],
 ['Corte e preparação','Corte e Preparação, identificação de peças e conferência das medidas.'],
 ['Montagem','Montagem, fixações e alinhamento.'],
 ['Acabamento','Acabamento e conferência das condições de secagem.'],
 ['Qualidade','Inspeção, aprovação ou devolução ao Acabamento.']
],[.29,.71])
h('Preparar a rodada')
step(1,'Com sua conta, crie equipes como <b>Treino G1</b> até <b>Treino G7</b>. Ative exemplos fictícios e a identificação de treinamento.')
step(2,'Em <b>Equipe > Cadastrar acesso</b>, informe nome, e-mail único, senha inicial individual e função. Entregue cada acesso separadamente; o sistema exige a troca da senha no primeiro login.')
step(3,'Se a conta já existir, a pessoa entra, solicita a equipe pelo código e aguarda sua aprovação. Não recrie o mesmo usuário.')
step(4,'Escolha um pedido e confira os materiais. Abra o painel no computador e as atividades nos smartphones disponíveis.')
h('Responsabilidade e rodízio')
add('O aluno inicia ou assume a atividade da própria função. Para trocar a pessoa, abra o pedido e use <b>Responsável pela etapa atual</b>. A mudança fica no histórico com a autoria do instrutor.')
add('Ao fim da rodada, avance as funções: Logística, Corte/preparação, Montagem, Acabamento e Qualidade. Após cinco rodadas, cada aluno terá praticado os cinco papéis. Atualize as funções em Equipe; os alunos saem e entram novamente.')
box('<b>Encerrar a aula:</b> confira o Histórico, exporte o CSV em Pedidos e use Cópia JSON no topo. Registre as evidências individuais e peça que saiam da conta nos aparelhos compartilhados.')
add('Há limite de 15 equipes criadas por conta nesta edição. Planeje sete equipes e uma de ensaio. O guia do instrutor explica aprovação, suspensão, redefinição das contas administradas pela própria equipe e tratamento de pendências.','small')
page()
# 4
title('03 / ALUNO','Executar e registrar','Entre com seu acesso, confira o nome da equipe e abra Atividades ou App do marceneiro.')
box('<b>Sequência de operação:</b> selecionar pedido > conferir quantidade e destino > iniciar ou assumir > executar a atividade orientada > marcar o checklist > confirmar o lote > conferir a mensagem e o Histórico.')
table(['Etapa','Conferências da atividade didática','Função'],[
 ['1. Planejamento','Pedido/projeto aprovados; materiais conferidos.','Logística'],
 ['2. Corte','Peças identificadas; medidas conferidas.','Corte/prep.'],
 ['3. Preparação','Peças preparadas; conferência final.','Corte/prep.'],
 ['4. Montagem','Montagem realizada; fixações e alinhamento.','Montagem'],
 ['5. Acabamento','Acabamento realizado; condições de secagem.','Acabamento'],
 ['6. Qualidade','Medidas e acabamento; integridade e estabilidade.','Qualidade'],
 ['7. Embalagem','Proteção/identificação; volumes e destino.','Logística'],
 ['8. Entrega','Expedição conferida; recebimento confirmado.','Logística']
],[.25,.52,.23])
h('Antes de confirmar')
add('Marque apenas as conferências realizadas na atividade. O registro exige a <b>quantidade total do lote</b>. Uma etapa futura continua bloqueada até a conclusão da anterior. O percentual representa etapas concluídas, não tempo de fabricação.')
add('Se a atividade já foi assumida por outra pessoa, peça a revisão do responsável ao instrutor. Use sempre sua própria conta.')
h('Como saber se terminou')
add('Leia o retorno da operação e confira seu nome no Histórico. <b>Pendente</b> significa que a confirmação ainda não chegou à nuvem. O próximo setor só recebe a liberação depois da aceitação pelo servidor.')
add('A prática na oficina deve seguir a orientação do instrutor e dos responsáveis pela marcenaria. Os checklists organizam o registro e precisam ser adequados ao processo real.','small')
page()
# 5
title('04 / MATERIAIS E EXCEÇÕES','Entender o que mudou','Uma informação correta ajuda a Logística a organizar abastecimento, prazo, qualidade e entrega.')
table(['Número','Significado'],[
 ['Saldo físico','Quantidade registrada em estoque.'],['Reservado','Parte comprometida com pedidos planejados e ainda não consumida.'],['Disponível','Saldo físico menos reservado.']
],[.28,.72])
h('Exemplo isolado: 10 m² de MDF e uma mesa de 2,4 m²')
table(['Momento','Físico','Reservado','Disponível'],[
 ['Antes de planejar','10','0','10'],['Após Planejamento','10','2,4','7,6'],['Após Corte','7,6','0','7,6']
],[.46,.18,.18,.18])
add('Sem outros pedidos no exemplo. Reservar não significa consumir duas vezes. Corte consome MDF/madeira; Preparação consome fita de borda; Montagem consome parafusos e dobradiças. Receitas e saldos são didáticos.')
h('Três exercícios de problema e resolução')
step(1,'<b>Falta de material:</b> cadastre um pedido que exija mais que o disponível. O planejamento não conclui. A Logística registra o recebimento com referência e repete a tentativa.')
step(2,'<b>Pausa:</b> inicie uma etapa, pause com motivo claro e observe o bloqueio da seguinte. Retome depois da orientação do instrutor e conclua.')
step(3,'<b>Retrabalho:</b> na Qualidade, registre a devolução com motivo. O pedido volta ao Acabamento, mantém os consumos anteriores e exige nova inspeção.')
box('<b>Sem conexão:</b> com o aplicativo e a atividade já abertos, registre uma tentativa offline. Ela fica pendente no aparelho. Religue a rede, mantenha a tela aberta e confira se foi aceita; use Sincronizar registros se necessário. Não apague dados do navegador com pendências.',AMBER)
add('Não há garantia de envio com o aplicativo fechado. O primeiro login exige conexão. A cópia JSON contém o estado confirmado, sem as tentativas pendentes de cada celular.','small')
page()
# 6
title('05 / CRONOGRAMA','Prontidão até 26/10/2026','O dia 26 é o prazo para a turma estar preparada. A data do evento não foi presumida.')
table(['Data','Foco','Evidência ao final'],[
 ['16/10<br/>sexta','Ativar e apresentar','Publicação configurada ou pendência técnica registrada. Demonstração local aberta e funções distribuídas.'],
 ['17-18/10','Reserva técnica opcional','Apoio de TI conclui a ativação e o ensaio; sem necessidade de aula extra para a turma.'],
 ['19/10<br/>segunda','Acessos e sequência','Cada aluno entrou, trocou a senha e confirmou a função. Pedido criado, sem pular etapas.'],
 ['20/10<br/>terça','Materiais','Grupo explica físico, reservado e disponível; demonstra reserva, consumo e recebimento.'],
 ['21/10<br/>quarta','Pessoas e pausas','Autoria localizada no Histórico, reatribuição pelo instrutor e pausa/retomada registradas.'],
 ['22/10<br/>quinta','Qualidade e rede','Devolução ao Acabamento, nova inspeção e tentativa offline com posterior confirmação.'],
 ['23/10<br/>sexta','Ensaio integrado','Rodízio de funções e apresentação de 3-5 minutos. CSV e cópia JSON guardados.'],
 ['24-25/10','Contingência opcional','Corrigir impedimentos, guardar a versão aprovada e conferir equipamentos e rede.'],
 ['26/10<br/>segunda','Conferência final','Lista de aceite aprovada pelo instrutor e alunos capazes de explicar o fluxo.']
],[.17,.25,.58])
h('Aula sugerida de 90 minutos')
add('<b>0-10:</b> objetivo e exemplo. <b>10-20:</b> acessos e funções. <b>20-50:</b> rodada de produção. <b>50-65:</b> uma exceção. <b>65-80:</b> histórico e materiais. <b>80-90:</b> explicação de cada aluno e devolutiva.')
box('<b>Evidência individual:</b> aluno, equipe, função/rodada, pedido/etapa, registro no Histórico, problema e resolução explicados, conferência do instrutor. O arquivo editável traz a ficha e a matriz de rodízio.')
add('Avaliação sugerida: cinco critérios de 2 pontos - fluxo, autoria, materiais/quantidade, resolução de exceção e contribuição logística. Proposta didática, sem caráter de critério institucional oficial.','small')
page()
# 7
title('06 / ACEITE','Conferir antes de liberar','Use um computador, dois smartphones e contas diferentes. Depois, faça um ensaio com a turma na rede habitual.')
h('Verificação já concluída')
add('<b>27 testes aprovados</b>, TypeScript e compilação de produção aprovados. Banco exclusivo com quatro tabelas protegidas por RLS, quatro políticas, três funções e Realtime instalado. A consulta remota de segurança não retornou apontamentos em 16/10/2026.')
box('<b>A validar após publicar:</b> credenciais reais, primeiro acesso, atualização entre aparelhos, instalação da PWA, uso de câmera/QR, rede da escola e comportamento da turma conectada. Esses resultados não foram presumidos.',AMBER)
h('Lista de conferência do instrutor')
checks=[
 'Três variáveis configuradas no ambiente correto e novo deploy concluído.',
 'Aluno entra, troca a senha inicial e vê a equipe/função corretas.',
 'Solicitação por código aguarda aprovação antes de abrir dados.',
 'Pedido percorre as oito etapas; checklist e lote são respeitados.',
 'Confirmação no smartphone aparece no computador; tempo anotado.',
 'Outra pessoa não confirma etapa já assumida; reatribuição funciona.',
 'Reserva, consumo, recebimento, pausa e retrabalho conferem.',
 'Tentativa sem rede não libera a próxima etapa antes da aceitação.',
 'Reenvio não repete consumo; abas mantêm a equipe apresentada.',
 'CSV, cópia JSON e demonstração local estão disponíveis.'
]
for text in checks:add('[  ] '+text,'small')
story.append(Spacer(1,8))
for text in ['URL do ambiente: __________________________________________________________','Dispositivos/navegadores: __________________________________________________','Data e tempo observado de atualização: _____________________________________','Responsável pelo aceite: ___________________________________________________','Situação: [  ] Liberado para treinamento compartilhado   [  ] Ajustes pendentes']:
    add(text,'small')
add('O roteiro editável docs/ACEITE_E_TESTES.md detalha 23 verificações e os campos de evidência. A consulta de apoio ocorre a cada 6 segundos com a tela visível; o tempo depende da rede e das cotas.','small')
page()
# 8
title('07 / APRESENTAÇÃO','Mostrar o valor da Logística','Prepare um pedido para avançar, um para a Qualidade e um já entregue. Ensaie com os mesmos alunos e equipamentos.')
box('<b>Abertura sugerida:</b> “O MobiLog conecta o trabalho da marcenaria ao planejamento da Logística. No computador, acompanhamos pedido, materiais e entrega. No smartphone, cada integrante confirma sua própria etapa. A informação ajuda a reduzir espera, evitar falta de material e organizar a produção.”')
table(['Tempo','Demonstração de 3-5 minutos'],[
 ['0:00-0:40','Logística apresenta pedido, destino, quantidade e reserva.'],['0:40-1:30','Responsável mostra seu acesso no smartphone, inicia/assume e confirma uma etapa preparada.'],['1:30-2:00','Outro aluno mostra a atualização no painel e a autoria no Histórico.'],['2:00-3:00','Qualidade demonstra uma devolução em outro pedido e explica a reinspeção.'],['3:00-5:00','Grupo explica os saldos, a próxima etapa e o resultado até a entrega; responde perguntas.']
],[.22,.78])
h('Se precisar de apoio local')
add('Abra <b>MobiLog-Demonstracao.html</b> no computador e identifique a simulação: ela mostra as regras em um navegador. A atualização entre aparelhos pertence à versão publicada. Não apresente a troca local de setor como confirmação recebida de outro celular.')
h('Perguntas para os alunos')
add('Onde o pedido está? Qual a próxima etapa? Quem confirma? O que muda no estoque? O que fazer se faltar material, a rede cair ou a Qualidade reprovar? Que decisão da Logística melhora com esses dados?')
h('Arquivos para continuar')
add('<b>README.md:</b> visão geral e comandos.<br/><b>docs/IMPLANTACAO.md:</b> publicação e primeiro acesso.<br/><b>docs/GUIA_INSTRUTOR.md e GUIA_ALUNOS.md:</b> operação.<br/><b>docs/TREINAMENTO_ATE_26_10_2026.md:</b> rodízio e fichas.<br/><b>docs/ACEITE_E_TESTES.md:</b> ensaio e evidências.<br/><b>docs/ARQUITETURA.md:</b> banco e manutenção.','small')
add('MobiLog R01 - projeto educacional com a marca SENAI Hub fornecida. Receitas e exemplos devem ser conferidos com a marcenaria antes de qualquer uso real.','small')

doc=SimpleDocTemplate(str(OUT),pagesize=(W,H),rightMargin=LEFT,leftMargin=LEFT,topMargin=99,bottomMargin=64,title='MobiLog - Guia de implantação e treinamento',author='Projeto educacional SENAI Hub',subject='Logística e marcenaria - preparação até 26/10/2026')
doc.build(story,onFirstPage=frame,onLaterPages=frame)
print(str(OUT))
