"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, Check, Clock3, Fingerprint, Hammer, Leaf, Package, Printer, RefreshCw, Ruler, ShieldCheck } from "lucide-react";
import { formatDuration, formatPassportDate, PASSPORT_TOKEN, type ProductPassport } from "@/lib/product-passport";
import FurnitureArt from "./furniture-art";

const STATUS = { waiting: "Aguardando", ready: "Pronta para iniciar", in_progress: "Em execução", paused: "Pausada", done: "Concluída" };
const number = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
export default function ProductPassportPage({ token }: { token: string }) {
  const [product, setProduct] = useState<ProductPassport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  useEffect(() => {
    let alive = true, inFlight = false;
    let controller: AbortController | undefined;
    async function load() {
      if (inFlight) return;
      if (!PASSPORT_TOKEN.test(token)) { setError("Ficha do produto não encontrada. Confira o QR Code da peça."); setLoading(false); return; }
      inFlight = true;
      controller = new AbortController();
      const timer = setTimeout(() => controller?.abort(), 12000);
      try {
        const response = await fetch("/api/products/" + encodeURIComponent(token), { cache: "no-store", credentials: "omit", signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 404 ? "Ficha do produto não encontrada. Confira o QR Code da peça." : "Não foi possível consultar a ficha. Confira a conexão e tente novamente.");
        const data = await response.json() as ProductPassport;
        if (alive) { setProduct(data); setError(""); setCheckedAt(new Date().toISOString()); }
      } catch (problem) {
        if (alive) setError(problem instanceof Error && problem.name !== "AbortError" ? problem.message : "A consulta demorou. Confira a conexão e tente novamente.");
      } finally { clearTimeout(timer); inFlight = false; if (alive) setLoading(false); }
    }
    const visible = () => { if (!document.hidden) void load(); };
    void load();
    const interval = setInterval(visible, 15000);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", visible);
    return () => { alive = false; controller?.abort(); clearInterval(interval); document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", visible); };
  }, [token, attempt]);
  useEffect(() => { if (product) document.title = product.name + " · Identidade do móvel · SENAI Hub"; }, [product?.name]);

  return <div className="passport-page">
    <a className="skip-link" href="#product-passport">Ir para a ficha do produto</a>
    <header className="passport-header"><img src="/logo-senai-hub.webp" alt="SENAI Hub · Inovação e Tecnologia"/><div><strong>MobiLog</strong><span>LOGÍSTICA + MARCENARIA</span></div></header>
    <main id="product-passport" className="passport-main">
      {!product ? <section className="passport-empty" aria-live="polite"><Fingerprint size={40}/><h1>{loading ? "Abrindo a identidade do móvel" : "Ficha indisponível"}</h1><p>{loading ? "Consultando os registros deste produto." : error}</p>{!loading && <button className="btn primary" onClick={() => setAttempt(n => n + 1)}><RefreshCw size={17}/>Tentar novamente</button>}</section> : <>
        <div className="passport-topline"><span><Fingerprint size={16}/>IDENTIDADE DO MÓVEL</span><button className="btn secondary passport-print" onClick={() => window.print()}><Printer size={16}/>Imprimir ficha</button></div>
        {error && <div className="passport-notice" role="status"><span>{error} Exibindo a última consulta.</span><button onClick={() => setAttempt(n => n + 1)}>Atualizar</button></div>}
        {product.training && <p className="passport-training"><BookOpen size={16}/>Projeto educacional · os registros podem incluir simulações e exemplos de treinamento.</p>}
        <section className="passport-hero">
          <div className="passport-hero-copy"><span className="passport-code">{product.serial}</span><h1>{product.name}</h1><p>{product.details.description || "Conheça os materiais e o percurso de fabricação deste móvel."}</p><div className="passport-pills"><span><Package size={15}/>{product.typeLabel}</span><span>Peça {product.unit} de {product.quantity}</span><span className={product.qualityApprovedAt ? "approved" : ""}>{product.qualityApprovedAt ? <ShieldCheck size={15}/> : <Hammer size={15}/>} {product.qualityApprovedAt ? "Qualidade aprovada" : "Etapa: " + product.stageLabel}</span></div><p className="passport-lot">Pedido {product.orderId} · {product.quantity === 1 ? "Unidade identificada individualmente." : "Esta peça tem QR próprio. Tempos e materiais abaixo se referem ao lote completo."}</p></div>
          <div className="passport-visual"><FurnitureArt type={product.type} large/><span>Representação ilustrativa do tipo de móvel</span></div>
        </section>
        <section className="passport-metrics" aria-label="Resumo da fabricação">
          <article><Clock3 size={21}/><span>Tempo ativo de fabricação</span><strong>{product.productionStartedAt ? formatDuration(product.activeMs) : "Ainda não iniciado"}</strong><small>Soma das etapas de fabricação, sem pausas</small></article>
          <article><Hammer size={21}/><span>Fabricação concluída</span><strong className="passport-date">{product.manufacturedAt ? formatPassportDate(product.manufacturedAt) : "Em preparação ou execução"}</strong><small>Conclusão do Acabamento registrada</small></article>
          <article><ShieldCheck size={21}/><span>Qualidade</span><strong>{product.qualityApprovedAt ? "Aprovada" : "Aguardando aprovação"}</strong><small>{product.qualityApprovedAt ? formatPassportDate(product.qualityApprovedAt) : "Conferência antes da liberação"}</small></article>
        </section>
        <div className="passport-grid">
          <section className="passport-card"><div className="passport-section-title"><Leaf size={22}/><h2>Materiais e características</h2></div><dl className="passport-specs"><div><dt>Madeira ou painel</dt><dd>{product.details.woodType || "Não informado pela equipe"}</dd></div><div><dt>Origem do material</dt><dd>{product.details.materialOrigin || "Não informada pela equipe"}</dd></div><div><dt><Ruler size={15}/>Dimensões</dt><dd>{product.details.dimensions || "Não informadas pela equipe"}</dd></div><div><dt>Acabamento</dt><dd>{product.details.finish || "Não informado pela equipe"}</dd></div><div><dt>Técnica construtiva</dt><dd>{product.details.construction || "Não informada pela equipe"}</dd></div></dl><h3>Materiais do pedido{product.quantity > 1 ? " · lote completo" : ""}</h3><div className="passport-materials">{product.materials.map((m, i) => <article key={i}><div><strong>{m.name}</strong><p>{m.specification}</p></div><div><strong>{number(m.quantity)} {m.unit}</strong><span>{m.status}</span></div></article>)}</div></section>
          <section className="passport-card"><div className="passport-section-title"><Clock3 size={22}/><h2>Datas e tempos</h2></div><dl className="passport-specs"><div><dt>Cadastro do pedido</dt><dd>{formatPassportDate(product.createdAt)}</dd></div><div><dt>Início da fabricação</dt><dd>{formatPassportDate(product.productionStartedAt)}</dd></div><div><dt>Fim da fabricação</dt><dd>{formatPassportDate(product.manufacturedAt)}</dd></div><div><dt>Aprovação da Qualidade</dt><dd>{formatPassportDate(product.qualityApprovedAt)}</dd></div><div><dt>Entrega confirmada</dt><dd>{formatPassportDate(product.deliveredAt)}</dd></div><div><dt>Tempo decorrido da fabricação</dt><dd>{product.elapsedMs === null ? "Ainda não iniciado" : formatDuration(product.elapsedMs)}</dd></div><div><dt>Pausas na fabricação</dt><dd>{formatDuration(product.pausedMs)}</dd></div><div><dt>Revisões solicitadas</dt><dd>{product.reworks}</dd></div></dl><p className="passport-explanation">O tempo ativo soma Corte, Preparação, Montagem e Acabamento, incluindo os ciclos de retrabalho. O tempo decorrido vai do início do Corte ao fim do Acabamento e inclui pausas e espera. Horários de Rio Branco, Acre.</p></section>
        </div>
        <section className="passport-card passport-stages"><div className="passport-section-title"><Hammer size={22}/><h2>O percurso desta peça</h2><span>{product.completedStages} de 8 etapas</span></div><ol>{product.stages.map((stage, i) => <li key={stage.id} className={stage.status}><span className="passport-stage-number">{stage.status === "done" ? <Check size={17}/> : String(i + 1).padStart(2, "0")}</span><div><h3>{stage.name}</h3><p>{stage.sector}</p><span>{STATUS[stage.status]}</span></div><div className="passport-stage-time"><strong>{stage.startedAt || stage.activeMs > 0 ? formatDuration(stage.activeMs) : "Não iniciada"}</strong><time>{stage.completedAt ? formatPassportDate(stage.completedAt) : stage.startedAt ? "Início: " + formatPassportDate(stage.startedAt) : ""}</time>{stage.checked && <small><ShieldCheck size={12}/>Conferências registradas</small>}</div></li>)}</ol></section>
        <div className="passport-grid passport-bottom-grid">
          <section className="passport-card"><div className="passport-section-title"><ShieldCheck size={22}/><h2>Uso e conservação</h2></div><p className="passport-care">{product.details.careInstructions || "Os cuidados específicos desta peça ainda não foram informados. Consulte a equipe de marcenaria do SENAI Hub."}</p><div className="passport-identity"><Fingerprint size={24}/><div><strong>Uma identidade para esta peça</strong><p>{product.serial}</p><small>O QR Code acompanha os registros do produto ao longo do processo.</small></div></div></section>
          <section className="passport-card"><div className="passport-section-title"><Package size={22}/><h2>Histórico do produto</h2></div><div className="passport-history">{product.history.slice(0, 8).map((event, i) => <article key={`${event.at}-${i}`}><span/><div><strong>{event.title}</strong><p>{event.stage} · {event.sector}</p><time>{formatPassportDate(event.at)}</time></div></article>)}{product.history.length > 8 && <details><summary>Ver os {product.history.length - 8} registros anteriores</summary>{product.history.slice(8).map((event, i) => <article key={`${event.at}-${i}`}><span/><div><strong>{event.title}</strong><p>{event.stage} · {event.sector}</p><time>{formatPassportDate(event.at)}</time></div></article>)}</details>}{!product.history.length && <p>Os registros aparecerão quando a equipe confirmar as atividades.</p>}</div></section>
        </div>
        <p className="passport-updated">Última consulta: {formatPassportDate(checkedAt)} · Dados atualizados automaticamente com esta página aberta.</p>
      </>}
    </main>
    <footer className="passport-footer"><span><strong>SENAI Hub</strong> · Mundo SENAI · Logística e Marcenaria</span><a href="/">Acesso da equipe <ArrowUpRight size={14}/></a></footer>
  </div>;
}
