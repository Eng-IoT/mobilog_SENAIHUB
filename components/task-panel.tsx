"use client";
import { useState } from "react";
import { Play, Pause, RotateCcw, CheckCheck, AlertTriangle, Cloud, Smartphone, CalendarDays, Package } from "lucide-react";
import { activeStage, availableQuantity, STAGES, TEAM, type Command, type Order, type ProductionState } from "@/lib/production";
import type { ActionResult, PendingRecord } from "@/hooks/use-production";
import { Avatar, Modal, formatDate, qty } from "./production-ui";
import FurnitureArt from "./furniture-art";
import type {Account} from "@/lib/access";

export default function TaskPanel({ order, state, actorId, account, run, pending, busy, onMessage, onProfile }: {
  order: Order; state: ProductionState; actorId: string; account:Account;
  run: (command: Omit<Command, "eventId">) => Promise<ActionResult>;
  pending: PendingRecord[]; busy: boolean; onMessage: (message: string) => void; onProfile: (id: string) => void;
}) {
  const stage = activeStage(order);
  const definition = STAGES.find(item => item.id === stage?.stageId);
  const [checks, setChecks] = useState([false, false]);
  const [quantity, setQuantity] = useState(order.quantity);
  const [reasonMode, setReasonMode] = useState<"pause" | "rework" | null>(null);
  const [reason, setReason] = useState("");
  const queued = pending.some(item => item.command.orderId === order.id && item.command.stageId === stage?.stageId && item.status === "pending");
  if (!stage || !definition) return <div className="completion-box"><CheckCheck size={30}/><h3>Pedido entregue</h3><p>Todos os registros deste móvel estão no histórico.</p></div>;
  const person = TEAM.find(member => member.id === stage.assignedTo)!;
  const otherClaim=account.mode==="cloud"&&account.role!=="admin"&&!!stage.assignedUserId&&stage.assignedUserId!==account.userId;
  const canSwitch=account.mode==="demo"||account.role==="admin";
  const needClaim=account.mode==="cloud"&&stage.assignedTo===actorId&&!stage.assignedUserId&&stage.status!=="ready"&&account.role!=="viewer";
  const submit = async (kind: string, extra: Partial<Command> = {}) => {
    const result = await run({ kind, actorId, orderId: order.id, stageId: stage.stageId, ...extra });
    onMessage(result.message);
    if (result.status !== "blocked") { setReasonMode(null); setReason(""); }
  };
  return <section className="task-panel">
    <div className="task-object"><div className="task-furniture"><FurnitureArt type={order.type}/></div><div><span className="eyebrow">{order.id} · {order.quantity} un.</span><h3>{order.name}</h3><p>{order.client}</p><span className="task-due"><CalendarDays size={14}/>Entrega: {formatDate(order.due)}</span></div></div>
    <div className="task-stage"><span className="orange-label">{definition.name}</span><div className="person-inline"><Avatar id={person.id} small/><span>{stage.assignedName||person.name}</span></div></div>
    {stage.assignedTo !== actorId || otherClaim || account.role==="viewer" ? <div className="profile-prompt"><Smartphone size={22}/><p>Esta atividade está com <strong>{stage.assignedName||person.name}</strong>.</p>{canSwitch&&<button className="btn primary" onClick={() => onProfile(person.id)}>Abrir atividades do setor</button>}</div> : <>
      {queued && <div className="inline-note amber"><Cloud size={17}/><span>Registro guardado neste aparelho. A próxima etapa será liberada após confirmação na nuvem.</span></div>}
      {definition.id === "planning" && <div className="task-materials"><h4><Package size={16}/>Materiais do pedido</h4>{order.materials.map(item => {
        const material = state.materials.find(m => m.id === item.materialId)!;
        const available = availableQuantity(state, material.id);
        return <div key={item.materialId}><span>{material.name}</span><strong className={available < item.quantity && order.materialState === "unreserved" ? "text-red" : ""}>{qty(item.quantity)} {material.unit}</strong><small>Disponível: {qty(available)} {material.unit}</small></div>;
      })}<p>A conclusão do planejamento reserva os materiais. O consumo é registrado nas etapas de corte, preparação e montagem.</p></div>}
      {needClaim&&<div className="start-task"><p>Assuma a atividade para associar os próximos registros ao seu login.</p><button className="btn primary full" disabled={busy||queued} onClick={()=>void submit("stage-claim")}>Assumir atividade</button></div>}
      {stage.status === "ready" && <div className="start-task"><p>Confira o pedido e inicie para registrar a execução.</p><button className="btn primary full" disabled={busy || queued} onClick={() => void submit("stage-start")}><Play size={18}/>Iniciar {definition.name.toLowerCase()}</button></div>}
      {!needClaim&&stage.status === "paused" && <div className="paused-task"><AlertTriangle size={23}/><h4>Atividade pausada</h4><p>{stage.issue}</p><button className="btn primary full" disabled={busy || queued} onClick={() => void submit("stage-resume")}><RotateCcw size={17}/>Retomar atividade</button></div>}
      {!needClaim&&stage.status === "in_progress" && <form onSubmit={event => { event.preventDefault(); void submit("stage-finish", { checks, completedQuantity: quantity }); }}>
        <h4 className="checklist-heading">Antes de concluir</h4><p className="muted small-text">Confirme a conferência do lote completo.</p>
        <div className="task-checklist">{definition.checks.map((item, index) => <label key={item} className={checks[index] ? "checked" : ""}><input type="checkbox" checked={checks[index]} disabled={busy || queued} onChange={event => setChecks(prev => prev.map((value, i) => i === index ? event.target.checked : value))}/><span>{item}</span></label>)}</div>
        <label className="field quantity-field">Quantidade concluída <span className="muted">Lote: {order.quantity} un.</span><input type="number" min={1} max={order.quantity} required value={quantity} disabled={busy || queued} onChange={event => setQuantity(Number(event.target.value))}/></label>
        <button className="btn primary full" type="submit" disabled={busy || queued || !checks.every(Boolean) || quantity !== order.quantity}><CheckCheck size={18}/>{definition.id === "delivery" ? "Confirmar entrega" : definition.id === "quality" ? "Aprovar qualidade" : "Concluir etapa"}</button>
        <div className="task-extra-actions"><button className="btn secondary" type="button" disabled={busy || queued} onClick={() => { setReason(""); setReasonMode("pause"); }}><Pause size={16}/>Registrar pausa</button>{definition.id === "quality" && <button className="btn danger-outline" type="button" disabled={busy || queued} onClick={() => { setReason(""); setReasonMode("rework"); }}><RotateCcw size={16}/>Solicitar retrabalho</button>}</div>
      </form>}
    </>}
    {reasonMode && <Modal title={reasonMode === "pause" ? "Registrar pausa" : "Solicitar retrabalho"} subtitle={order.id + " · " + definition.name} onClose={() => setReasonMode(null)}><form onSubmit={event => { event.preventDefault(); void submit(reasonMode === "pause" ? "stage-pause" : "quality-rework", { reason }); }}><label className="field">Motivo<textarea autoFocus required minLength={3} maxLength={300} value={reason} onChange={event => setReason(event.target.value)} placeholder="Descreva o que precisa ser resolvido."/></label>{reasonMode === "rework" && <p className="inline-note amber">O pedido retornará ao acabamento. A qualidade precisará ser conferida novamente.</p>}<div className="button-row"><button type="button" className="btn secondary" onClick={() => setReasonMode(null)}>Cancelar</button><button className="btn primary" disabled={busy || reason.trim().length < 3}>Confirmar registro</button></div></form></Modal>}
  </section>;
}
