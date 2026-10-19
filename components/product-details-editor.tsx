"use client";
import { useState } from "react";
import { BookOpen, Save } from "lucide-react";
import { EMPTY_PRODUCT_DETAILS, type Command, type Order, type ProductDetails } from "@/lib/production";
import type { ActionResult } from "@/hooks/use-production";
import { Modal } from "./production-ui";

export function ProductDetailsFields({ value, onChange }: { value: ProductDetails; onChange: (next: ProductDetails) => void }) {
  const field = (key: keyof ProductDetails, label: string, placeholder: string, long = false) => <label className="field" key={key}>{label}{long ? <textarea rows={3} maxLength={800} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} placeholder={placeholder}/> : <input maxLength={200} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} placeholder={placeholder}/>}</label>;
  return <div className="product-details-fields">
    <p className="inline-note blue"><BookOpen size={18}/><span>Estas informações aparecem na ficha pública do QR Code. Preencha os dados conferidos com a marcenaria; campos vazios aparecem como não informados.</span></p>
    {field("description", "Descrição do produto", "Uso e características do móvel.", true)}
    <div className="form-grid">{field("woodType", "Tipo de madeira ou painel", "Ex.: MDF 18 mm; madeira maciça de pinus.")}{field("materialOrigin", "Origem ou fornecedor do material", "Informe somente a origem confirmada.")}</div>
    <div className="form-grid">{field("dimensions", "Dimensões do móvel", "Largura × profundidade × altura, com unidade.")}{field("finish", "Acabamento", "Ex.: laminado, pintura ou verniz aplicado.")}</div>
    {field("construction", "Técnica construtiva", "Ex.: montagem com parafusos e cavilhas.")}
    {field("careInstructions", "Cuidados de uso e conservação", "Orientações específicas para esta peça.", true)}
  </div>;
}
export default function ProductDetailsEditor({ order, busy, run, onClose, onMessage }: { order: Order; busy: boolean; run: (c: Omit<Command, "eventId">) => Promise<ActionResult>; onClose: () => void; onMessage: (message: string) => void }) {
  const [details, setDetails] = useState<ProductDetails>({ ...EMPTY_PRODUCT_DETAILS, ...order.productDetails });
  return <Modal title="Ficha do produto" subtitle={order.id + " · " + order.name} onClose={onClose} className="new-order-modal"><form onSubmit={event => {
    event.preventDefault();
    void run({ kind: "update-product-details", actorId: "gestao", orderId: order.id, productDetails: details }).then(result => { onMessage(result.message); if (result.status !== "blocked") onClose(); });
  }}><ProductDetailsFields value={details} onChange={setDetails}/><div className="button-row"><button className="btn secondary" type="button" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={busy}><Save size={17}/>Salvar ficha</button></div></form></Modal>;
}
