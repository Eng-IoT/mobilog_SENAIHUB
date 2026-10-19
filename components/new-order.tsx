"use client";
import { useState } from "react";
import { Plus, Package, ArrowRight } from "lucide-react";
import { TYPES, EMPTY_PRODUCT_DETAILS, addDays, todayInAcre, recipe, availableQuantity, type FurnitureType, type ProductionState, type RecipeItem, type Command, type ProductDetails } from "@/lib/production";
import type { ActionResult } from "@/hooks/use-production";
import { Modal, qty } from "./production-ui";
import { ProductDetailsFields } from "./product-details-editor";

export default function NewOrder({ state, busy, run, onClose, onMessage }: { state: ProductionState; busy: boolean; run: (c: Omit<Command, "eventId">) => Promise<ActionResult>; onClose: () => void; onMessage: (s: string) => void }) {
  const [name, setName] = useState(""); const [client, setClient] = useState(""); const [type, setType] = useState<FurnitureType>("mesa");
  const [quantity, setQuantity] = useState(1); const [due, setDue] = useState(addDays(todayInAcre(), 7)); const [priority, setPriority] = useState<"normal" | "alta">("normal");
  const [notes, setNotes] = useState(""); const [materials, setMaterials] = useState<RecipeItem[]>(recipe("mesa", 1));
  const [productDetails, setProductDetails] = useState<ProductDetails>({ ...EMPTY_PRODUCT_DETAILS });
  function changeRecipe(newType: FurnitureType, newQuantity: number) { setMaterials(recipe(newType, newQuantity)); }
  return <Modal title="Novo pedido" subtitle="Planejamento da produção" onClose={onClose} className="new-order-modal"><form onSubmit={event => {
    event.preventDefault();
    void run({ kind: "create-order", actorId: "gestao", order: { name, client, type, quantity, due, priority, notes, materials, productDetails } }).then(result => { onMessage(result.message); if (result.status !== "blocked") onClose(); });
  }}>
    <div className="form-grid"><label className="field">Nome do móvel<input autoFocus required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Mesa para a sala de reunião"/></label><label className="field">Cliente ou destino<input required minLength={2} maxLength={100} value={client} onChange={e => setClient(e.target.value)} placeholder="Ex.: Sala colaborativa"/></label></div>
    <div className="form-grid three"><label className="field">Tipo de móvel<select value={type} onChange={e => { const t = e.target.value as FurnitureType; setType(t); changeRecipe(t, quantity); }}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label><label className="field">Quantidade<input type="number" min={1} max={50} required value={quantity} onChange={e => { const q = Number(e.target.value); setQuantity(q); changeRecipe(type, q); }}/></label><label className="field">Prioridade<select value={priority} onChange={e => setPriority(e.target.value as "normal" | "alta")}><option value="normal">Normal</option><option value="alta">Alta</option></select></label></div>
    <div className="form-grid"><label className="field">Prazo de entrega<input type="date" required value={due} onChange={e => setDue(e.target.value)}/></label><label className="field">Observação<input maxLength={600} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes úteis para a equipe"/></label></div>
    <div className="recipe-heading"><h3><Package size={18}/>Lista de materiais</h3><span className="badge amber">Receita demonstrativa</span></div><p className="muted small-text">Ajuste as quantidades ao desenho do móvel. Estes valores são exemplos didáticos.</p>
    <div className="recipe-list">{materials.map((item, index) => {
      const m = state.materials.find(material => material.id === item.materialId)!;
      const available = availableQuantity(state, m.id);
      return <label key={m.id}><div><strong>{m.name}</strong><small>Disponível: {qty(available)} {m.unit}</small></div><input aria-label={"Quantidade de " + m.name} type="number" min={m.unit==="un."?1:0.001} step={m.unit==="un."?1:"any"} max={100000} required value={item.quantity} onChange={e => setMaterials(prev => prev.map((old, i) => i === index ? { ...old, quantity: Number(e.target.value) } : old))}/><span>{m.unit}</span></label>;
    })}</div>
    <div className="inline-note blue"><ArrowRight size={17}/><span>O pedido começará em Planejamento. Cada etapa será liberada para a função correspondente; a pessoa assume a atividade com seu acesso.</span></div>
    <details className="product-details-disclosure"><summary>Ficha pública do produto · madeira, acabamento e cuidados</summary><ProductDetailsFields value={productDetails} onChange={setProductDetails}/></details>
    <div className="button-row"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={busy}><Plus size={17}/>Criar pedido</button></div>
  </form></Modal>;
}
