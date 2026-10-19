import { authorizeCommand, type Identity } from "./access.ts";
export type StageStatus = "waiting" | "ready" | "in_progress" | "paused" | "done";
export type FurnitureType = "mesa" | "armario" | "estante" | "banco";
export type View = "dashboard" | "orders" | "production" | "materials" | "team" | "history" | "worker";

export const TEAM = [
  { id: "gestao", name: "Equipe de Logística", initials: "LG", role: "Planejamento e entrega", color: "#244786" },
  { id: "corte", name: "Corte e preparação", initials: "CP", role: "Corte e preparação", color: "#987349" },
  { id: "montagem", name: "Montagem", initials: "MO", role: "Montagem", color: "#33796d" },
  { id: "acabamento", name: "Acabamento", initials: "AC", role: "Acabamento", color: "#b86139" },
  { id: "qualidade", name: "Qualidade", initials: "QU", role: "Qualidade", color: "#69568b" },
] as const;

export const STAGES = [
  { id: "planning", name: "Planejamento", short: "Planejar", owner: "gestao", checks: ["Projeto e pedido aprovados", "Lista de materiais conferida"] },
  { id: "cut", name: "Corte", short: "Cortar", owner: "corte", checks: ["Peças identificadas", "Medidas conferidas"] },
  { id: "prep", name: "Preparação", short: "Preparar", owner: "corte", checks: ["Peças preparadas", "Conferência final realizada"] },
  { id: "assembly", name: "Montagem", short: "Montar", owner: "montagem", checks: ["Peças montadas", "Fixações e alinhamento conferidos"] },
  { id: "finish", name: "Acabamento", short: "Acabar", owner: "acabamento", checks: ["Acabamento realizado", "Condições de secagem conferidas"] },
  { id: "quality", name: "Qualidade", short: "Conferir", owner: "qualidade", checks: ["Medidas e acabamento aprovados", "Integridade e estabilidade conferidas"] },
  { id: "pack", name: "Embalagem", short: "Embalar", owner: "gestao", checks: ["Móvel protegido e identificado", "Volumes e destino conferidos"] },
  { id: "delivery", name: "Entrega", short: "Entregar", owner: "gestao", checks: ["Expedição conferida", "Recebimento confirmado"] },
] as const;

export type Material = { id: string; name: string; specification: string; unit: string; stock: number; minimum: number };
export type RecipeItem = { materialId: string; quantity: number; consumed?: boolean };
export type ProductDetails = {
  description: string; woodType: string; materialOrigin: string; dimensions: string;
  finish: string; construction: string; careInstructions: string;
};
export const EMPTY_PRODUCT_DETAILS: ProductDetails = {
  description: "", woodType: "", materialOrigin: "", dimensions: "", finish: "", construction: "", careInstructions: "",
};
export type StageRun = {
  stageId: string; assignedTo: string; status: StageStatus;
  startedAt: string | null; completedAt: string | null; pausedAt: string | null;
  assignedUserId?: string | null; assignedName?: string | null;
  pauseMs: number; completedQuantity: number; checks: boolean[]; issue: string;
};
export type Order = {
  id: string; name: string; client: string; type: FurnitureType; quantity: number;
  due: string; priority: "normal" | "alta"; createdAt: string; notes: string;
  stages: StageRun[]; materials: RecipeItem[]; materialState: "unreserved" | "reserved" | "consumed";
  reworks: number; productDetails?: ProductDetails;
};
export type HistoryEvent = {
  id: string; actorId: string; orderId: string | null; stageId: string | null;
  kind: string; title: string; detail: string; at: string; fingerprint: string; performer?: { userId: string; name: string };
};
export type ProductionState = { orders: Order[]; materials: Material[]; events: HistoryEvent[] };
export type Snapshot = { state: ProductionState; revision: number; updatedAt: string };
export type Command = {
  eventId: string; kind: string; actorId: string; orderId?: string; stageId?: string;
  reason?: string; checks?: boolean[]; completedQuantity?: number; targetUserId?: string;
  materialId?: string; quantity?: number;
  productDetails?: ProductDetails;
  order?: { name: string; client: string; type: FurnitureType; quantity: number; due: string; priority: "normal" | "alta"; notes: string; materials?: RecipeItem[]; productDetails?: ProductDetails };
};

export const RECIPES: Record<FurnitureType, RecipeItem[]> = {
  mesa: [{ materialId: "mdf", quantity: 2.4 }, { materialId: "screws", quantity: 24 }, { materialId: "edge", quantity: 5 }],
  armario: [{ materialId: "mdf", quantity: 6 }, { materialId: "screws", quantity: 60 }, { materialId: "edge", quantity: 12 }, { materialId: "hinges", quantity: 4 }],
  estante: [{ materialId: "mdf", quantity: 3 }, { materialId: "screws", quantity: 32 }, { materialId: "edge", quantity: 8 }],
  banco: [{ materialId: "wood", quantity: 0.04 }, { materialId: "screws", quantity: 16 }],
};
export const TYPES: { value: FurnitureType; label: string }[] = [
  { value: "mesa", label: "Mesa" }, { value: "armario", label: "Armário" },
  { value: "estante", label: "Estante" }, { value: "banco", label: "Banco" },
];

export class ProductionError extends Error {
  status: number;
  constructor(message: string, status = 422) { super(message); this.name = "ProductionError"; this.status = status; }
}
export function todayInAcre(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Rio_Branco", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(key => parts.find(p => p.type === key)?.value).join("-");
}
export function addDays(date: string, delta: number) {
  const value = new Date(date + "T12:00:00Z"); value.setUTCDate(value.getUTCDate() + delta); return value.toISOString().slice(0, 10);
}
export function activeStage(order: Order): StageRun | undefined { return order.stages.find(stage => stage.status !== "done"); }
export function stageIndex(order: Order): number {
  const index = order.stages.findIndex(stage => stage.status !== "done"); return index < 0 ? STAGES.length : index;
}
export function progress(order: Order): number { return Math.round(order.stages.filter(s => s.status === "done").length / STAGES.length * 100); }
export function isLate(order: Order, date = todayInAcre()): boolean { return progress(order) < 100 && order.due < date; }
export function reservedQuantity(state: ProductionState, materialId: string) {
  return state.orders.filter(o => o.materialState === "reserved").reduce((sum, o) => sum + (o.materials.find(m => m.materialId === materialId && !m.consumed)?.quantity || 0), 0);
}
export function availableQuantity(state: ProductionState, materialId: string) {
  const material = state.materials.find(m => m.id === materialId);
  return round((material?.stock || 0) - reservedQuantity(state, materialId));
}
export function recipe(type: FurnitureType, quantity: number): RecipeItem[] {
  return RECIPES[type].map(item => ({ ...item, quantity: round(item.quantity * quantity) }));
}
function round(number: number) { return Math.round(number * 1000) / 1000; }
function text(value: unknown, label: string, min = 1, max = 300) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new ProductionError("Confira o campo " + label + ".");
  return value.trim();
}
function number(value: unknown, label: string, max = 100000, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > max || (integer && !Number.isInteger(value))) throw new ProductionError("Informe uma quantidade válida para " + label + ".");
  return value;
}
function checkDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ProductionError("Informe uma data de entrega válida.");
  const d = new Date(value + "T12:00:00Z");
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) throw new ProductionError("Informe uma data de entrega válida.");
  return value;
}
export function parseProductDetails(value: unknown): ProductDetails {
  if (value === undefined) return { ...EMPTY_PRODUCT_DETAILS };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProductionError("Confira os dados da ficha do produto.");
  const source = value as Record<string, unknown>;
  const result = { ...EMPTY_PRODUCT_DETAILS };
  for (const key of Object.keys(result) as (keyof ProductDetails)[]) {
    const field = source[key] ?? "";
    if (typeof field !== "string" || field.trim().length > (key === "description" || key === "careInstructions" ? 800 : 200)) throw new ProductionError("Confira o campo da ficha: " + key + ".");
    result[key] = field.trim();
  }
  return result;
}

export function applyCommand(current: ProductionState, command: Command, now = new Date().toISOString(), identity?: Identity): { state: ProductionState; duplicate: boolean } {
  if (!command || typeof command !== "object") throw new ProductionError("Solicitação inválida.", 400);
  text(command.eventId, "identificação do registro", 8, 100);
  const person = TEAM.find(member => member.id === command.actorId);
  if (!person) throw new ProductionError("Escolha um perfil de demonstração válido.", 403);
  const fingerprint = JSON.stringify(command);
  const previous = current.events.find(event => event.id === command.eventId);
  if (previous) {
    if (identity && previous.performer?.userId !== identity.userId) throw new ProductionError("O registro pertence a outra conta.", 403);
    if (previous.fingerprint !== fingerprint) throw new ProductionError("Esse registro já foi utilizado em outra ação.", 409);
    return { state: current, duplicate: true };
  }
  if (identity) authorizeCommand(current, command, identity);
  const state: ProductionState = structuredClone(current);
  let title = ""; let detail = ""; let orderId: string | null = command.orderId || null;
  let eventStageId: string | null = command.stageId || null;
  if (command.kind === "create-order") {
    if (person.id !== "gestao") throw new ProductionError("Use o perfil da Logística para cadastrar pedidos.", 403);
    const input = command.order;
    if (!input || !TYPES.some(type => type.value === input.type)) throw new ProductionError("Selecione um tipo de móvel.");
    const quantity = number(input.quantity, "o pedido", 50, true);
    const idNumber = state.orders.reduce((max, order) => Math.max(max, Number(order.id.split("-")[1]) || 0), 0) + 1;
    orderId = "OP-" + String(idNumber).padStart(3, "0");
    const materials = input.materials || recipe(input.type, quantity);
    if (!Array.isArray(materials) || materials.length < 1 || materials.length > state.materials.length) throw new ProductionError("Confira a lista de materiais.");
    const used = new Set<string>();
    for (const item of materials) {
      if (!state.materials.some(m => m.id === item.materialId) || used.has(item.materialId)) throw new ProductionError("Material inválido ou repetido.");
      used.add(item.materialId); number(item.quantity, "os materiais", 100000, state.materials.find(m => m.id === item.materialId)?.unit === "un.");
    }
    state.orders.push({
      id: orderId, name: text(input.name, "nome do móvel", 2, 100), client: text(input.client, "destino", 2, 100),
      type: input.type, quantity, due: checkDate(input.due), priority: input.priority === "alta" ? "alta" : "normal",
      notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 600) : "", createdAt: now,
      productDetails: parseProductDetails(input.productDetails),
      materials: materials.map(m => ({ materialId: m.materialId, quantity: m.quantity, consumed: false })), materialState: "unreserved", reworks: 0,
      stages: STAGES.map((stage, index) => ({
        stageId: stage.id, assignedTo: stage.owner, status: index === 0 ? "ready" : "waiting",
        startedAt: null, completedAt: null, pausedAt: null, pauseMs: 0, completedQuantity: 0, checks: [], issue: "",
      })),
    });
    title = "Pedido cadastrado"; detail = input.name + " · " + quantity + " un.";
  } else if (command.kind === "update-product-details") {
    if (person.id !== "gestao") throw new ProductionError("A Logística preenche a ficha do produto.", 403);
    const order = state.orders.find(item => item.id === command.orderId);
    if (!order) throw new ProductionError("Pedido não encontrado.", 404);
    order.productDetails = parseProductDetails(command.productDetails);
    eventStageId = null;
    title = "Ficha do produto atualizada"; detail = order.name;
  } else if (command.kind === "stock-receive") {
    if (person.id !== "gestao") throw new ProductionError("Use o perfil da Logística para receber materiais.", 403);
    const material = state.materials.find(item => item.id === command.materialId);
    if (!material) throw new ProductionError("Material não encontrado.", 404);
    const quantity = number(command.quantity, "o recebimento", 10000, material.unit === "un.");
    const reason = text(command.reason, "referência do recebimento", 3, 160);
    material.stock = round(material.stock + quantity);
    title = "Material recebido"; detail = material.name + " · +" + quantity + " " + material.unit + " · " + reason;
    orderId = null; eventStageId = null;
  } else {
    const order = state.orders.find(item => item.id === command.orderId);
    if (!order) throw new ProductionError("Pedido não encontrado.", 404);
    const index = order.stages.findIndex(item => item.stageId === command.stageId);
    const stage = order.stages[index];
    if (!stage) throw new ProductionError("Etapa não encontrada.", 404);
    if (stage.assignedTo !== person.id) throw new ProductionError("Esta etapa pertence a outro responsável.", 403);
    if (index > 0 && order.stages[index - 1].status !== "done") throw new ProductionError("A etapa anterior precisa ser concluída primeiro.");
    const definition = STAGES[index];
    detail = definition.name + " · " + order.name;
    if (command.kind === "stage-claim") {
      if (!["ready", "in_progress", "paused"].includes(stage.status)) throw new ProductionError("Esta etapa não pode ser assumida.");
      if (!identity) throw new ProductionError("Identificação da conta é necessária.");
      stage.assignedUserId = identity.userId; stage.assignedName = identity.name;
      title = "Responsabilidade assumida";
    } else if (command.kind === "stage-reassign") {
      if (!identity?.assignment || stage.status === "done") throw new ProductionError("Confira o novo responsável.");
      if (identity.assignment.actorId !== stage.assignedTo) throw new ProductionError("A função da pessoa não corresponde à etapa.");
      stage.assignedUserId = identity.assignment.userId; stage.assignedName = identity.assignment.name;
      title = "Responsável alterado"; detail += " · " + identity.assignment.name;
    } else if (command.kind === "stage-start") {
      if (stage.status !== "ready") throw new ProductionError("Esta etapa não está disponível para iniciar.");
      stage.status = "in_progress"; stage.startedAt = now;
      if (identity) { stage.assignedUserId = identity.userId; stage.assignedName = identity.name; } stage.issue = ""; title = "Etapa iniciada";
    } else if (command.kind === "stage-pause") {
      if (stage.status !== "in_progress") throw new ProductionError("Inicie a etapa antes de registrar uma pausa.");
      stage.issue = text(command.reason, "motivo da pausa", 3, 300);
      stage.status = "paused"; stage.pausedAt = now; title = "Etapa pausada"; detail += " · " + stage.issue;
    } else if (command.kind === "stage-resume") {
      if (stage.status !== "paused") throw new ProductionError("Esta etapa não está pausada.");
      stage.pauseMs += Math.max(0, new Date(now).getTime() - new Date(stage.pausedAt || now).getTime());
      stage.pausedAt = null; stage.status = "in_progress"; stage.issue = ""; title = "Etapa retomada";
    } else if (command.kind === "stage-finish") {
      if (stage.status !== "in_progress") throw new ProductionError("A etapa precisa estar em andamento para concluir.");
      if (command.completedQuantity !== order.quantity) throw new ProductionError("Confira a quantidade: esta versão conclui o lote inteiro de " + order.quantity + " un.");
      if (!Array.isArray(command.checks) || command.checks.length !== definition.checks.length || !command.checks.every(value => value === true)) throw new ProductionError("Confirme todos os itens do checklist.");
      if (definition.id === "planning") {
        const shortages = order.materials.filter(item => availableQuantity(state, item.materialId) + 0.000001 < item.quantity);
        if (shortages.length) throw new ProductionError("Materiais insuficientes: " + shortages.map(item => state.materials.find(m => m.id === item.materialId)?.name).join(", ") + ". Registre o recebimento antes de liberar.");
        order.materialState = "reserved";
      }
      const consumeAt: Record<string, string> = { mdf: "cut", wood: "cut", edge: "prep", screws: "assembly", hinges: "assembly" };
      const consumedNow = order.materials.filter(item => !item.consumed && consumeAt[item.materialId] === definition.id);
      if (order.materialState === "reserved") {
        for (const item of consumedNow) {
          const material = state.materials.find(m => m.id === item.materialId)!;
          if (material.stock + 0.000001 < item.quantity) throw new ProductionError("Saldo de material inconsistente. Solicite revisão da Logística.");
          material.stock = round(material.stock - item.quantity);
          item.consumed = true;
        }
        if (order.materials.every(item => item.consumed)) order.materialState = "consumed";
      }
      stage.status = "done"; stage.completedAt = now; stage.completedQuantity = order.quantity; stage.checks = [...command.checks]; stage.issue = "";
      if (index < STAGES.length - 1) order.stages[index + 1].status = "ready";
      title = definition.id === "delivery" ? "Entrega confirmada" : "Etapa concluída";
      if (definition.id === "planning") detail += " · materiais reservados";
      if (consumedNow.length) detail += " · consumo dos materiais desta etapa registrado";
    } else if (command.kind === "quality-rework") {
      if (definition.id !== "quality" || !["ready", "in_progress"].includes(stage.status)) throw new ProductionError("Solicite retrabalho durante a inspeção de qualidade.");
      const reason = text(command.reason, "motivo do retrabalho", 3, 300);
      for (let i = 4; i < order.stages.length; i++) {
        const old = order.stages[i];
        order.stages[i] = { ...old, assignedUserId: null, assignedName: null, status: i === 4 ? "ready" : "waiting", startedAt: null, completedAt: null, pausedAt: null, pauseMs: 0, completedQuantity: 0, checks: [], issue: "" };
      }
      order.reworks++; title = "Retrabalho solicitado"; detail += " · retornar ao acabamento · " + reason;
    } else throw new ProductionError("Ação não reconhecida.", 400);
  }
  state.events.push({ id: command.eventId, actorId: command.actorId, orderId, stageId: eventStageId, kind: command.kind, title, detail, at: now, fingerprint, ...(identity ? { performer: { userId: identity.userId, name: identity.name } } : {}) });
  return { state, duplicate: false };
}

export function createDemoState(now = new Date()): ProductionState {
  let state: ProductionState = {
    orders: [], events: [],
    materials: [
      { id: "mdf", name: "MDF 18 mm", specification: "Branco · consumo por área", unit: "m²", stock: 44, minimum: 12 },
      { id: "wood", name: "Madeira maciça", specification: "Peças beneficiadas · volume", unit: "m³", stock: 0.4, minimum: 0.12 },
      { id: "screws", name: "Parafusos", specification: "Kit de montagem demonstrativo", unit: "un.", stock: 480, minimum: 120 },
      { id: "edge", name: "Fita de borda", specification: "Branca · largura compatível", unit: "m", stock: 64, minimum: 20 },
      { id: "hinges", name: "Dobradiças", specification: "Kit para armários", unit: "un.", stock: 8, minimum: 12 },
    ],
  };
  const day = todayInAcre(now);
  let count = 0;
  const stamp = (hours: number) => new Date(now.getTime() + hours * 3600000).toISOString();
  const act = (partial: Omit<Command, "eventId">, hours: number) => { state = applyCommand(state, { ...partial, eventId: "seed-event-" + (++count) }, stamp(hours)).state; };
  const samples: { name: string; client: string; type: FurnitureType; quantity: number; due: number; stage: number; active?: boolean; paused?: boolean; priority?: "normal" | "alta" }[] = [
    { name: "Mesa de reunião", client: "Sala colaborativa", type: "mesa", quantity: 1, due: 3, stage: 3, active: true },
    { name: "Armário organizador", client: "Oficina criativa", type: "armario", quantity: 1, due: -1, stage: 4, active: true, paused: true, priority: "alta" },
    { name: "Estante modular", client: "Biblioteca comunitária", type: "estante", quantity: 2, due: 6, stage: 0 },
    { name: "Bancos de madeira", client: "Espaço de convivência", type: "banco", quantity: 4, due: 1, stage: 5 },
    { name: "Mesa lateral", client: "Recepção", type: "mesa", quantity: 1, due: 2, stage: 6 },
    { name: "Banco de leitura", client: "Cantinho de leitura", type: "banco", quantity: 2, due: -1, stage: 8 },
  ];
  samples.forEach((sample, index) => {
    act({ kind: "create-order", actorId: "gestao", order: { ...sample, due: addDays(day, sample.due), priority: sample.priority || "normal", notes: "Pedido fictício para apresentação no Mundo SENAI. Ajuste a receita de materiais à marcenaria antes de uso real." } }, -60 + index);
    const orderId = "OP-" + String(index + 1).padStart(3, "0");
    for (let stage = 0; stage < sample.stage; stage++) {
      const def = STAGES[stage];
      act({ kind: "stage-start", actorId: def.owner, orderId, stageId: def.id }, -40 + stage * 3 + index);
      act({ kind: "stage-finish", actorId: def.owner, orderId, stageId: def.id, checks: [true, true], completedQuantity: sample.quantity }, -38 + stage * 3 + index);
    }
    if (sample.active && sample.stage < STAGES.length) act({ kind: "stage-start", actorId: STAGES[sample.stage].owner, orderId, stageId: STAGES[sample.stage].id }, -4 + index);
    if (sample.paused) act({ kind: "stage-pause", actorId: "acabamento", orderId, stageId: "finish", reason: "Aguardando revisão do acabamento pela equipe." }, -1);
  });
  return state;
}
