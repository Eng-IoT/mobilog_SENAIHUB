"use client";
import { useState } from "react";
import { Download, RotateCcw, Trash2, Undo2 } from "lucide-react";
import type { Command, MaintenanceKind, Order, ProductionState } from "@/lib/production";
import type { ActionResult } from "@/hooks/use-production";
import { Modal, formatDateTime } from "./production-ui";

export default function ProductionMaintenance({ kind, order, state, workspaceName, revision, busy, ready, run, onClose, onMessage, onBackup, onComplete }: {
  kind: MaintenanceKind; order?: Order; state: ProductionState; workspaceName: string; revision: number;
  busy: boolean; ready: boolean; run: (command: Omit<Command, "eventId">) => Promise<ActionResult>;
  onClose: () => void; onMessage: (message: string) => void; onBackup: () => void; onComplete: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [resetStock, setResetStock] = useState(true);
  const deleting = kind === "delete-order", restoring = kind === "restore-production";
  const phrase = deleting ? order?.id || "" : restoring ? "RESTAURAR" : "LIMPAR";
  const title = deleting ? "Excluir produto" : restoring ? "Restaurar dados" : "Limpar produção";
  const units = state.orders.reduce((sum, item) => sum + item.quantity, 0);
  const backup = state.recovery;
  const canConfirm = ready && !busy && !!phrase && confirmation === phrase && (!restoring || !!backup);
  return <Modal title={title} subtitle={workspaceName} onClose={onClose} className="maintenance-modal">
    <form onSubmit={event => {
      event.preventDefault();
      if (!canConfirm) return;
      void run({ kind, actorId: "gestao", orderId: deleting ? order?.id : undefined, confirmation, expectedRevision: revision, ...(kind === "reset-production" ? { resetStock } : {}) }).then(result => {
        onMessage(result.message);
        if (result.status === "synced") onComplete();
        onClose();
      });
    }}>
      <div className={"maintenance-intro " + (restoring ? "restoring" : "")}><span>{deleting ? <Trash2 size={25}/> : restoring ? <Undo2 size={25}/> : <RotateCcw size={25}/>}</span><div><h3>{deleting ? order ? order.id + " · " + order.name : "Produto já removido" : restoring ? "Recuperar a cópia anterior" : "Preparar uma nova rodada"}</h3><p>{deleting ? order ? `${order.quantity} unidade(s) serão retiradas da produção.` : "Atualize o painel para consultar os produtos disponíveis." : restoring ? "A cópia escolhida substituirá a produção atual desta equipe." : "Os pedidos, as etapas e o histórico serão limpos nesta equipe."}</p></div></div>
      {deleting ? <ul className="maintenance-effects"><li>As fichas QR deste pedido ficam indisponíveis para consulta.</li><li>As reservas de materiais são liberadas. O material já consumido continua descontado do estoque.</li><li>O docente pode restaurar a cópia anterior pela opção Restaurar dados.</li></ul> : restoring ? <><div className="maintenance-summary"><span>Cópia disponível</span><strong>{backup ? formatDateTime(backup.at) : "Nenhuma"}</strong>{backup && <><span>Operação anterior</span><strong>{backup.action}</strong><span>Pedidos na cópia</span><strong>{backup.data.orders.length}</strong></>}</div><p className="maintenance-help">Os dados atuais ficam guardados como a próxima cópia de recuperação. A restauração também recupera os QR Codes dos produtos restaurados.</p></> : <><div className="maintenance-summary"><span>Pedidos atuais</span><strong>{state.orders.length}</strong><span>Unidades cadastradas</span><strong>{units}</strong><span>Registros do histórico</span><strong>{state.events.length}</strong></div><label className="checkbox-line maintenance-stock"><input type="checkbox" checked={resetStock} onChange={event => setResetStock(event.target.checked)}/><span><strong>Zerar também os saldos de materiais</strong><small>{resetStock ? "O estoque ficará em zero. Registre novos recebimentos antes de liberar a produção." : "Os saldos físicos atuais serão mantidos, e as reservas dos pedidos serão liberadas."}</small></span></label><p className="maintenance-help">Os acessos, as funções e o cadastro dos materiais são mantidos. As fichas QR dos pedidos removidos ficam indisponíveis. A numeração dos próximos pedidos continua para preservar a identidade de cada produto.</p></>}
      {!deleting && <p className="maintenance-help">Após a operação, os demais aparelhos recebem a atualização. Tentativas anteriores ao reset ou à restauração ficam bloqueadas para revisão.</p>}
      <p className="maintenance-recovery">Fica disponível uma cópia para o docente recuperar a última exclusão, limpeza ou restauração. Uma nova operação substitui essa cópia.</p>
      <button type="button" className="text-btn maintenance-backup" onClick={onBackup}><Download size={16}/>Baixar cópia JSON antes de continuar</button>
      {!ready && <p className="inline-note amber" role="status">Conecte-se e resolva os registros pendentes deste aparelho antes de confirmar.</p>}
      <label className="field maintenance-confirm">Digite <strong>{phrase || "o código do pedido"}</strong> para confirmar<input autoFocus autoComplete="off" spellCheck={false} value={confirmation} onChange={event => setConfirmation(event.target.value)} aria-label="Confirmação da operação" placeholder={phrase} disabled={busy}/></label>
      <div className="button-row"><button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancelar</button><button className={"btn " + (restoring ? "navy" : "danger")} disabled={!canConfirm}>{deleting ? <Trash2 size={17}/> : restoring ? <Undo2 size={17}/> : <RotateCcw size={17}/>} {busy ? "Aguardando confirmação…" : deleting ? "Confirmar exclusão" : restoring ? "Confirmar restauração" : "Confirmar limpeza"}</button></div>
    </form>
  </Modal>;
}
