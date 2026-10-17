"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, QrCode, Copy, Printer, Cloud, Check, CircleCheck, Pause } from "lucide-react";
import { activeStage, isLate, progress, STAGES, TEAM, type Order } from "@/lib/production";

export function Modal({ title, subtitle, children, onClose, drawer = false, className = "" }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; drawer?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className={"modal " + (drawer ? "drawer " : "") + className} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }
  }} aria-label={title}>
    <div className="modal-heading"><div>{subtitle && <span className="eyebrow">{subtitle}</span>}<h2>{title}</h2></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div>
    <div className="modal-content">{children}</div>
  </dialog>;
}
export function Avatar({ id, small = false }: { id: string; small?: boolean }) {
  const person = TEAM.find(member => member.id === id) || TEAM[0];
  return <span className={"avatar " + (small ? "small" : "")} style={{ backgroundColor: person.color + "18", color: person.color }} title={person.name}>{person.initials}</span>;
}
export function StatusBadge({ order }: { order: Order }) {
  const stage = activeStage(order);
  if (!stage) return <span className="badge green"><CircleCheck size={12}/>Entregue</span>;
  if (stage.status === "paused") return <span className="badge amber"><Pause size={12}/>Pausado</span>;
  if (isLate(order)) return <span className="badge red">Prazo vencido</span>;
  return <span className={"badge " + (stage.status === "in_progress" ? "blue" : "gray")}>{stage.status === "in_progress" ? "Em andamento" : "Aguardando início"}</span>;
}
export function ProgressBar({ order }: { order: Order }) {
  const percent = progress(order);
  return <div className="progress-cell" title={order.stages.filter(s => s.status === "done").length + " de " + STAGES.length + " etapas concluídas. O percentual representa etapas, não tempo de fabricação."}><div className={"progress-track " + (percent === 100 ? "complete" : "")}><span style={{ width: percent + "%" }}/></div><span>{percent}%</span></div>;
}
export function OrderRoute({ order, compact = false }: { order: Order; compact?: boolean }) {
  return <ol className={"order-route " + (compact ? "compact" : "")}>{order.stages.map((stage, index) => <li key={stage.stageId} className={stage.status}>
    <span className="route-marker">{stage.status === "done" ? <Check size={13}/> : index + 1}</span>
    <div><strong>{STAGES[index].name}</strong>{!compact && <><small>{stage.assignedName || TEAM.find(p => p.id === stage.assignedTo)?.name}</small><span className="route-time">{stage.completedAt ? formatDateTime(stage.completedAt) : stage.status === "in_progress" ? "Em execução" : stage.status === "paused" ? stage.issue : stage.status === "ready" ? "Pronta para iniciar" : "Aguardando etapa anterior"}</span></>}</div>
  </li>)}</ol>;
}
export function formatDate(value: string) { return new Date(value + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Rio_Branco" }).replace(".", ""); }
export function formatDateTime(value: string) { return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Rio_Branco" }); }
export function qty(value: number) { return value.toLocaleString("pt-BR", { maximumFractionDigits: 3 }); }
export function Empty({ children }: { children: ReactNode }) { return <div className="empty-state"><CircleCheck size={28}/><p>{children}</p></div>; }
export function QRModal({ order, onClose, onMessage }: { order: Order; onClose: () => void; onMessage: (message: string) => void }) {
  const [dataUrl, setDataUrl] = useState(""); const [url, setUrl] = useState(""); const [error, setError] = useState("");
  useEffect(() => {
    if(window.location.protocol==="file:"){setError("O QR entre aparelhos estará disponível na versão publicada. Neste arquivo, abra Pedidos e escolha a atividade.");return;}
    const path=window.location.pathname==="/demo"?"/demo":"/";
    const value = window.location.origin + path + "?view=worker&order=" + encodeURIComponent(order.id); setUrl(value);
    void import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(value, { margin: 2, width: 280, errorCorrectionLevel: "M", color: { dark: "#183868", light: "#ffffff" } })).then(setDataUrl).catch(() => setError("Não foi possível gerar o QR Code."));
  }, [order.id]);
  return <Modal title="Ficha do pedido" subtitle="MobiLog · rastreabilidade" onClose={onClose} className="qr-modal">
    <div className="qr-sheet"><img src="/logo-senai-hub.webp" alt="SENAI Hub" className="qr-logo"/><strong className="qr-order-id">{order.id}</strong><h3>{order.name}</h3><p>{order.quantity} un. · {order.client}</p>{dataUrl ? <img src={dataUrl} alt={"QR Code do pedido " + order.id} className="qr-image"/> : <p>{error || "Preparando QR Code…"}</p>}<div className="qr-instruction"><QrCode size={18}/><span>{url ? "Escaneie para abrir este pedido no aplicativo." : "Use a versão publicada para acessar em outro aparelho."}</span></div><small>MobiLog · identificação do pedido</small></div>
    <div className="button-row"><button className="btn secondary" disabled={!url} onClick={() => { void navigator.clipboard.writeText(url).then(() => onMessage("Link do pedido copiado.")).catch(() => onMessage("Copie o link no campo abaixo.")); }}><Copy size={16}/>Copiar link</button><button className="btn primary" onClick={() => window.print()}><Printer size={16}/>Imprimir ficha</button></div>
    <label className="field qr-url">Link do pedido<input readOnly value={url} onFocus={e => e.currentTarget.select()}/></label>
  </Modal>;
}
export function Connection({ status, pending, compact = false }: { status: string; pending: number; compact?: boolean }) {
  return <div className={"connection " + status + (compact ? " compact" : "")}><Cloud size={15}/><span>{status==="demo" ? "Demonstração local" : pending ? pending + " pendente(s)" : status === "online" ? "Sincronizado" : status === "connecting" ? "Conectando…" : "Aguardando conexão"}</span><i/></div>;
}
