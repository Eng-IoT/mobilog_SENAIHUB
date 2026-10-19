import { EMPTY_PRODUCT_DETAILS, STAGES, TEAM, TYPES, type HistoryEvent, type Order, type ProductDetails, type ProductionState, type StageRun } from "./production.ts";

export const PASSPORT_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function passportHref(token: string) { return "/produto/" + encodeURIComponent(token); }
export function passportSerial(token: string, orderId: string, unit: number) {
  return `${orderId}-${String(unit).padStart(3, "0")}-${token.slice(0, 8).toUpperCase()}`;
}
export type PassportIdentity = { id: string; unit_number: number };
export type PassportStage = {
  id: string; name: string; sector: string; status: StageRun["status"];
  startedAt: string | null; completedAt: string | null; activeMs: number; pausedMs: number; checked: boolean;
};
export type ProductPassport = {
  token: string; serial: string; orderId: string; unit: number; quantity: number; name: string; type: Order["type"]; typeLabel: string;
  createdAt: string; productionStartedAt: string | null; manufacturedAt: string | null; qualityApprovedAt: string | null; deliveredAt: string | null;
  stageLabel: string; completedStages: number; activeMs: number; pausedMs: number; elapsedMs: number | null;
  training: boolean; updatedAt: string; reworks: number; details: ProductDetails;
  materials: { name: string; specification: string; quantity: number; unit: string; status: "Consumido" | "Reservado" | "Previsto" }[];
  stages: PassportStage[];
  history: { at: string; title: string; stage: string; sector: string }[];
};
function timestamp(value: string | null | undefined) { const n = value ? Date.parse(value) : NaN; return Number.isFinite(n) ? n : null; }

// O histórico preserva os ciclos anteriores, inclusive quando o retrabalho
// reinicia Acabamento e Qualidade. Não se contam espera ou pausas como execução.
export function stageTiming(stage: StageRun, events: HistoryEvent[], now: number) {
  const rows = events.filter(e => e.stageId === stage.stageId && timestamp(e.at) !== null).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (!rows.some(e => e.kind === "stage-start")) {
    const start = timestamp(stage.startedAt);
    const end = Math.min(timestamp(stage.completedAt) ?? now, now);
    const pausedAt = timestamp(stage.pausedAt);
    const pausedMs = Math.max(0, stage.pauseMs || 0) + (stage.status === "paused" && pausedAt !== null ? Math.max(0, end - pausedAt) : 0);
    return { activeMs: start === null ? 0 : Math.max(0, end - start - pausedMs), pausedMs: start === null ? 0 : pausedMs };
  }
  let activeMs = 0, pausedMs = 0;
  let running: number | null = null, paused: number | null = null;
  for (const event of rows) {
    const at = Math.min(Date.parse(event.at), now);
    if (event.kind === "stage-start") { if (running === null && paused === null) running = at; }
    else if (event.kind === "stage-pause" && running !== null) { activeMs += Math.max(0, at - running); running = null; paused = at; }
    else if (event.kind === "stage-resume" && paused !== null) { pausedMs += Math.max(0, at - paused); paused = null; running = at; }
    else if (event.kind === "stage-finish" || event.kind === "quality-rework") {
      if (running !== null) activeMs += Math.max(0, at - running);
      if (paused !== null) pausedMs += Math.max(0, at - paused);
      running = null; paused = null;
    }
  }
  if (running !== null) activeMs += Math.max(0, now - running);
  if (paused !== null) pausedMs += Math.max(0, now - paused);
  return { activeMs, pausedMs };
}
const EVENT_TITLES: Record<string, string> = {
  "create-order": "Pedido registrado", "stage-start": "Etapa iniciada", "stage-pause": "Pausa registrada",
  "stage-resume": "Atividade retomada", "stage-finish": "Etapa concluída", "quality-rework": "Nova revisão solicitada",
  "update-product-details": "Ficha do produto atualizada",
};
export function buildProductPassport(state: ProductionState, orderId: string, unit: number, token: string, training: boolean, updatedAt: string, now = Date.now()): ProductPassport | null {
  const order = state.orders.find(item => item.id === orderId);
  if (!order || !Number.isInteger(unit) || unit < 1 || unit > order.quantity) return null;
  const events = state.events.filter(e => e.orderId === orderId);
  const stages = STAGES.map(definition => {
    const run = order.stages.find(s => s.stageId === definition.id)!;
    return {
      id: definition.id, name: definition.name, sector: TEAM.find(p => p.id === definition.owner)!.name,
      status: run.status, startedAt: run.startedAt, completedAt: run.completedAt,
      ...stageTiming(run, events, now), checked: run.status === "done" && run.checks.length === definition.checks.length && run.checks.every(Boolean),
    };
  });
  const manufacturing = stages.filter(s => ["cut", "prep", "assembly", "finish"].includes(s.id));
  const productionStartedAt = events.filter(e => e.stageId === "cut" && e.kind === "stage-start").map(e => e.at).sort()[0] || manufacturing[0].startedAt;
  const quality = stages.find(s => s.id === "quality")!;
  const finish = stages.find(s => s.id === "finish")!;
  const manufacturedAt = finish.status === "done" ? finish.completedAt : null;
  const from = timestamp(productionStartedAt), to = timestamp(manufacturedAt) ?? now;
  const details = { ...EMPTY_PRODUCT_DETAILS };
  // Uma lista explícita impede que futuros campos internos vazem na ficha pública.
  for (const key of Object.keys(details) as (keyof ProductDetails)[]) if (typeof order.productDetails?.[key] === "string") details[key] = order.productDetails[key];
  return {
    token, serial: passportSerial(token, order.id, unit), orderId: order.id, unit, quantity: order.quantity,
    name: order.name, type: order.type, typeLabel: TYPES.find(t => t.value === order.type)?.label || "Móvel",
    createdAt: order.createdAt, productionStartedAt, manufacturedAt,
    qualityApprovedAt: quality.status === "done" ? quality.completedAt : null, deliveredAt: stages.find(s => s.id === "delivery")!.completedAt,
    stageLabel: stages.find(s => s.status !== "done")?.name || "Entregue", completedStages: stages.filter(s => s.status === "done").length,
    activeMs: manufacturing.reduce((sum, s) => sum + s.activeMs, 0), pausedMs: manufacturing.reduce((sum, s) => sum + s.pausedMs, 0),
    elapsedMs: from === null ? null : Math.max(0, to - from), training, updatedAt, reworks: order.reworks, details,
    materials: order.materials.map(item => {
      const material = state.materials.find(m => m.id === item.materialId);
      return { name: material?.name || "Material registrado", specification: material?.specification || "", quantity: item.quantity, unit: material?.unit || "", status: item.consumed ? "Consumido" : order.materialState === "reserved" ? "Reservado" : "Previsto" };
    }),
    stages,
    history: events.filter(e => EVENT_TITLES[e.kind]).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).map(e => ({
      at: e.at, title: EVENT_TITLES[e.kind], stage: STAGES.find(s => s.id === e.stageId)?.name || "Produto",
      sector: TEAM.find(p => p.id === e.actorId)?.name || "Logística",
    })),
  };
}
export function formatPassportDate(value: string | null) {
  return value && timestamp(value) !== null ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Rio_Branco", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Ainda não registrada";
}
export function formatDuration(ms: number) {
  if (ms <= 0) return "0 min";
  if (ms < 60000) return "Menos de 1 min";
  const minutes = Math.floor(ms / 60000), hours = Math.floor(minutes / 60);
  return hours ? `${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;
}
