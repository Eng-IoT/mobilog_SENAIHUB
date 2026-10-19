"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, QrCode, Copy, Printer, Cloud, Check, CircleCheck, Pause, ArrowUpRight, BookOpen } from "lucide-react";
import { activeStage, isLate, progress, STAGES, TEAM, type Order } from "@/lib/production";
import type { Account } from "@/lib/access";
import { passportHref, passportSerial, type PassportIdentity } from "@/lib/product-passport";

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
export function QRModal({ order, account, onClose, onMessage, onEdit }: { order: Order; account: Account; onClose: () => void; onMessage: (message: string) => void; onEdit?: () => void }) {
  const [dataUrl, setDataUrl] = useState(""); const [url, setUrl] = useState(""); const [error, setError] = useState("");
  const [identities, setIdentities] = useState<PassportIdentity[]>([]);
  const [unit, setUnit] = useState(1);
  useEffect(() => {
    if (account.mode === "demo" || window.location.protocol === "file:") { setError("A ficha pública e o QR por peça ficam disponíveis nos pedidos sincronizados do ambiente em nuvem. A demonstração local permanece neste navegador."); return; }
    let alive = true;
    const controller = new AbortController();
    void fetch("/api/passports?order=" + encodeURIComponent(order.id), { cache: "no-store", headers: { "X-MobiLog-Workspace": account.workspaceId }, signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Não foi possível consultar as identidades. Confira sua conexão e entre novamente se a sessão expirou.");
      const result = await response.json() as { identities: PassportIdentity[] };
      if (alive) { setIdentities(result.identities); if (!result.identities.length) setError("Sincronize o pedido para disponibilizar suas identidades."); }
    }).catch(problem => { if (alive) setError(problem instanceof Error ? problem.message : "Não foi possível consultar a ficha."); });
    return () => { alive = false; controller.abort(); };
  }, [account.mode, account.workspaceId, order.id]);
  const identity = identities.find(item => item.unit_number === unit);
  useEffect(() => {
    setDataUrl(""); setUrl("");
    if (!identity) return;
    let alive = true;
    const value = window.location.origin + passportHref(identity.id);
    setUrl(value);
    void import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(value, { margin: 4, width: 320, errorCorrectionLevel: "M", color: { dark: "#183868", light: "#ffffff" } })).then(image => { if (alive) { setDataUrl(image); setError(""); } }).catch(() => { if (alive) setError("Não foi possível gerar o QR Code."); });
    return () => { alive = false; };
  }, [identity?.id]);
  return <Modal title="Identidade da peça" subtitle="MobiLog · rastreabilidade do produto" onClose={onClose} className="qr-modal">
    {order.quantity > 1 && <label className="field qr-unit">Escolha a peça para imprimir<select value={unit} onChange={event => setUnit(Number(event.target.value))}>{Array.from({ length: order.quantity }, (_, i) => <option key={i} value={i + 1}>Peça {i + 1} de {order.quantity}</option>)}</select></label>}
    <div className="qr-sheet"><img src="/logo-senai-hub.webp" alt="SENAI Hub" className="qr-logo"/><strong className="qr-order-id">{order.id} · {String(unit).padStart(3, "0")}</strong><h3>{order.name}</h3><p>Peça {unit} de {order.quantity}</p>{dataUrl ? <img src={dataUrl} alt={"QR Code da peça " + unit + " do pedido " + order.id} className="qr-image"/> : <p role="status">{error || "Preparando QR Code…"}</p>}<div className="qr-instruction"><QrCode size={18}/><span>Escaneie para conhecer os materiais, as datas e o histórico desta peça. A consulta abre sem login.</span></div><small>{identity ? passportSerial(identity.id, order.id, unit) : "MobiLog · identidade do produto"}</small></div>
    <div className="button-row">{url && <a className="btn secondary" href={url} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={16}/>Abrir ficha</a>}<button className="btn secondary" disabled={!url} onClick={() => { void navigator.clipboard.writeText(url).then(() => onMessage("Link da peça copiado.")).catch(() => onMessage("Copie o link no campo abaixo.")); }}><Copy size={16}/>Copiar link</button><button className="btn primary" disabled={!dataUrl} onClick={() => window.print()}><Printer size={16}/>Imprimir etiqueta</button></div>
    {onEdit && <button className="btn secondary full qr-edit" onClick={onEdit}><BookOpen size={16}/>Completar dados do produto</button>}
    <label className="field qr-url">Link público desta peça<input readOnly value={url} onFocus={e => e.currentTarget.select()}/></label>
  </Modal>;
}
export function Connection({ status, pending, compact = false }: { status: string; pending: number; compact?: boolean }) {
  return <div className={"connection " + status + (compact ? " compact" : "")}><Cloud size={15}/><span>{status==="demo" ? "Demonstração local" : pending ? pending + " pendente(s)" : status === "online" ? "Sincronizado" : status === "connecting" ? "Conectando…" : "Aguardando conexão"}</span><i/></div>;
}
