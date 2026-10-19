"use client";

import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronRight, CloudOff, Hammer, Maximize, Minimize, Monitor, RefreshCw, Truck } from "lucide-react";
import { useProduction } from "@/hooks/use-production";
import type { Account } from "@/lib/access";
import { STAGES } from "@/lib/production";
import { trackingHref, trackingStage } from "@/lib/tracking";
import FurnitureArt from "./furniture-art";

const Furniture3D = lazy(() => import("./furniture-3d"));

class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function ProductTracking({ account, orderId }: { account: Account; orderId: string }) {
  const { state, connection, syncedAt, refresh } = useProduction(account, { readOnly: true });
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const changed = () => setFullscreen(!!document.fullscreenElement);
    setFullscreenSupported(!!document.documentElement.requestFullscreen && document.fullscreenEnabled);
    document.addEventListener("fullscreenchange", changed);
    const previousTitle = document.title;
    document.title = `Acompanhar ${orderId} · MobiLog · SENAI Hub`;
    return () => { document.removeEventListener("fullscreenchange", changed); document.title = previousTitle; };
  }, [orderId]);
  const order = state?.orders.find(item => item.id === orderId);
  const stage = order ? trackingStage(order) : null;
  const offline = connection === "offline";
  const demo = connection === "demo";
  const connected = connection === "online";
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setNotice("");
    } catch { setNotice("Use a opção de tela cheia do navegador para ampliar a apresentação."); }
  }

  return <div className={"tracking-page " + (stage?.current?.status === "paused" ? "tracking-paused" : "") + (!stage?.current && order ? " tracking-complete" : "")}>
    <a className="skip-link" href="#tracking-content">Ir para o acompanhamento</a>
    <header className="tracking-header">
      <a href="?" className="tracking-logo" aria-label="SENAI Hub · voltar ao painel"><img src="/logo-senai-hub.webp" alt="SENAI Hub · Inovação e Tecnologia"/></a>
      <div className="tracking-brand"><strong>MobiLog<span> / </span>Oficina ao vivo</strong><span>LOGÍSTICA + MARCENARIA · MUNDO SENAI</span></div>
      <div className="tracking-header-actions">
        <span className={"tracking-connection " + connection}><i/>{demo ? "Demonstração local" : offline ? "Sem conexão" : connected ? "Atualização ao vivo" : "Conectando"}</span>
        <a href="?" className="tracking-control" aria-label="Voltar ao painel"><ArrowLeft size={18}/><span>Painel</span></a>
        {fullscreenSupported && <button className="tracking-control" type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"}>{fullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}<span>{fullscreen ? "Sair da tela cheia" : "Tela cheia"}</span></button>}
      </div>
    </header>

    <main id="tracking-content" className="tracking-main">
      {offline && <div className="tracking-offline" role="status"><CloudOff size={19}/><span>{state ? "Exibindo a última consulta. Aguardando conexão para atualizar as etapas." : "Conecte o notebook à internet para carregar o pedido."}</span><button onClick={() => void refresh()}><RefreshCw size={16}/>Tentar novamente</button></div>}
      {notice && <p className="tracking-notice" role="status">{notice}</p>}
      {!state ? <section className="tracking-empty" aria-live="polite"><Monitor size={42}/><h1>{offline ? "Aguardando conexão" : "Preparando o acompanhamento"}</h1><p>Carregando o produto e as etapas da equipe.</p><button className="btn secondary" onClick={() => void refresh()}><RefreshCw size={18}/>Consultar novamente</button></section> : !order || !stage ? <section className="tracking-empty"><Monitor size={42}/><h1>Pedido não encontrado</h1><p>Este pedido não está disponível na equipe {account.workspaceName}.</p><a className="btn navy" href="?">Voltar aos pedidos</a></section> : <>
        <div className="tracking-product-heading">
          <div><p className="tracking-eyebrow"><span/>{order.id} <b>·</b> A JORNADA DO SEU MÓVEL</p><h1>{order.name}</h1></div>
          <div className="tracking-product-info"><span>{order.quantity} {order.quantity === 1 ? "móvel" : "móveis"} neste pedido</span>{state.orders.length > 1 && <label className="tracking-select"><span className="sr-only">Trocar produto em acompanhamento</span><select value={order.id} onChange={event => window.location.assign(trackingHref(event.target.value, account.workspaceId))}>{state.orders.map(item => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label>}</div>
        </div>

        <section className="tracking-showcase" aria-label="Visualização do móvel">
          <div className="tracking-showcase-tag"><Hammer size={17}/><span>DA MADEIRA À ENTREGA</span></div>
          <ModelBoundary key={order.type} fallback={<div className="furniture-fallback"><FurnitureArt type={order.type} large/><p>Modelo ilustrativo · recarregue a página para tentar o 3D novamente.</p></div>}><Suspense fallback={<div className="tracking-model-loading"><FurnitureArt type={order.type} large/><span>Preparando o modelo 3D…</span></div>}><Furniture3D type={order.type}/></Suspense></ModelBoundary>
          <span className="tracking-showcase-note">Feito por pessoas.<br/><strong>Conectado pela Logística.</strong></span>
        </section>

        <section className="tracking-stage-card" aria-label="Etapa atual da fabricação">
          <div className="tracking-stage-top">
            <div className="tracking-stage-copy" aria-live="polite" aria-atomic="true"><div className="tracking-stage-label"><span className="tracking-stage-number">{stage.current ? `ETAPA ${stage.index + 1} DE ${STAGES.length}` : "JORNADA COMPLETA"}</span><span className="tracking-stage-status"><i/>{stage.status}</span></div><h2>{stage.title}</h2><p>{stage.description}</p></div>
            <div className="tracking-stage-aside"><span className="tracking-sector-icon">{stage.current ? <Hammer size={24}/> : <Truck size={24}/>}</span><div><small>{stage.current ? "SETOR RESPONSÁVEL" : "TODAS AS ETAPAS CONFIRMADAS"}</small><strong>{stage.sector}</strong>{stage.next && <p>Próxima: <b>{stage.next}</b><ChevronRight size={15}/></p>}</div></div>
          </div>
          <ol className="tracking-journey" aria-label={`${stage.completed} de ${STAGES.length} etapas concluídas`}>{order.stages.map((item, index) => <li key={item.stageId} className={item.status === "done" ? "done" : index === stage.index ? "current" : "waiting"} aria-current={index === stage.index ? "step" : undefined}><span className="tracking-step-line"/><span className="tracking-step-dot">{item.status === "done" ? <Check size={17}/> : String(index + 1).padStart(2, "0")}</span><strong>{STAGES[index].name}</strong><span className="sr-only">{item.status === "done" ? ", concluída" : index === stage.index ? ", etapa atual" : ", aguardando"}</span></li>)}</ol>
          <div className="tracking-progress-caption"><span>{stage.completed} de {STAGES.length} etapas concluídas</span><span>{stage.completed === STAGES.length ? "Uma nova história, pronta para começar." : "Cada confirmação da equipe atualiza esta jornada."}</span></div>
        </section>
      </>}
    </main>

    <footer className="tracking-footer"><span><strong>SENAI Hub</strong><i/>Mundo SENAI<span className="tracking-footer-team"> · {account.workspaceName}</span></span><span>{demo ? "Dados fictícios · treinamento neste navegador" : syncedAt ? `Última consulta: ${new Date(syncedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Rio_Branco" })}` : "Acompanhamento da produção"}</span></footer>
  </div>;
}
