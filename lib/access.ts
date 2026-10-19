import type { Command, ProductionState } from "./production.ts";

export const ROLES = [
  { id: "admin", label: "Instrutor / administrador", actorId: "gestao" },
  { id: "logistica", label: "Logística", actorId: "gestao" },
  { id: "corte", label: "Corte e preparação", actorId: "corte" },
  { id: "montagem", label: "Montagem", actorId: "montagem" },
  { id: "acabamento", label: "Acabamento", actorId: "acabamento" },
  { id: "qualidade", label: "Qualidade", actorId: "qualidade" },
  { id: "viewer", label: "Visitante / leitura", actorId: "" },
] as const;
export type Role = typeof ROLES[number]["id"];
export type Identity = {
  userId: string; name: string; role: Role;
  assignment?: { userId: string; name: string; actorId: string };
};
export type Membership = {
  workspace_id: string; user_id: string; display_name: string; role: Role;
  active: boolean; created_at: string;
};
export function chooseMembership(rows:Membership[], explicit:string|null|undefined, fallback?:string) {
  const chosen=explicit||fallback;
  return rows.find(m=>m.workspace_id===chosen&&m.active)||(!explicit?rows.find(m=>m.active):undefined);
}
export type Account = {
  userId: string; name: string; email: string; role: Role;
  workspaceId: string; workspaceName: string; mustChangePassword: boolean;
  workspaces: { id: string; name: string; active: boolean; role: Role }[];
  mode: "cloud" | "demo";
};
export class AccessError extends Error {
  status: number;
  constructor(message: string, status = 403) { super(message); this.name = "AccessError"; this.status = status; }
}
export function actorFor(role: Role) { return ROLES.find(r => r.id === role)?.actorId || ""; }
export function isManagement(role: Role) { return role === "admin" || role === "logistica"; }
export function validateRole(value: unknown): Role {
  if (!ROLES.some(r => r.id === value)) throw new AccessError("Função inválida.", 422);
  return value as Role;
}
export function authorizeCommand(state: ProductionState, command: Command, identity: Identity) {
  if (!identity.userId || !ROLES.some(r => r.id === identity.role)) throw new AccessError("Entre com uma conta autorizada.");
  if (identity.role === "viewer") throw new AccessError("Sua conta permite somente consulta.");
  const isAdmin = identity.role === "admin";
  if (!isAdmin && command.actorId !== actorFor(identity.role)) throw new AccessError("Você só pode registrar atividades da sua função.");
  if (["create-order", "stock-receive", "update-product-details"].includes(command.kind) && !isManagement(identity.role)) throw new AccessError("Esta operação pertence à Logística.");
  if (command.kind === "stage-reassign" && !isAdmin) throw new AccessError("Apenas o instrutor pode trocar o responsável.");
  const order = state.orders.find(o => o.id === command.orderId);
  const stage = order?.stages.find(s => s.stageId === command.stageId);
  if (!stage) return;
  if (!isAdmin && stage.assignedUserId && stage.assignedUserId !== identity.userId) throw new AccessError("Esta atividade foi assumida por outra pessoa. Peça ao instrutor para reatribuir.");
  if (!isAdmin && !stage.assignedUserId && ["stage-finish", "stage-pause", "stage-resume", "quality-rework"].includes(command.kind)) throw new AccessError("Assuma esta atividade antes de registrar a execução.");
}
