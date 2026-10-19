import type { Account } from "./access.ts";
import { activeStage, STAGES, TEAM, type Order } from "./production.ts";

const DESCRIPTIONS: Record<string, string> = {
  planning: "O projeto e os materiais são conferidos antes de começar.",
  cut: "A madeira ganha as medidas e as peças do projeto.",
  prep: "Cada peça é preparada para receber a montagem.",
  assembly: "As peças se unem e o móvel ganha forma.",
  finish: "Superfícies, bordas e detalhes recebem o acabamento.",
  quality: "Medidas, estabilidade e acabamento são inspecionados.",
  pack: "O móvel é protegido e identificado para o transporte.",
  delivery: "A Logística confere a expedição e confirma o recebimento.",
};

// Keep the team in the link: identical order IDs may exist in different teams.
// This only selects a membership returned by /api/me; the API revalidates it.
export function trackingAccount(account: Account, workspaceId?: string): Account | null {
  if (!workspaceId || workspaceId === account.workspaceId) return account;
  if (account.mode === "demo") return null;
  const membership = account.workspaces.find(item => item.id === workspaceId && item.active);
  return membership ? { ...account, workspaceId: membership.id, workspaceName: membership.name, role: membership.role } : null;
}

export function trackingHref(orderId: string, workspaceId: string) {
  return "?" + new URLSearchParams({ view: "acompanhamento", order: orderId, equipe: workspaceId }).toString();
}

export function trackingStage(order: Order) {
  const current = activeStage(order);
  const index = current ? STAGES.findIndex(stage => stage.id === current.stageId) : STAGES.length;
  const completed = order.stages.filter(stage => stage.status === "done").length;
  const definition = STAGES[index];
  return {
    current, index, completed,
    title: definition?.name || "Móvel entregue",
    status: !current ? "Processo concluído" : current.status === "paused" ? "Atividade pausada" : current.status === "in_progress" ? "Em execução" : "Aguardando início",
    description: !current ? "Da matéria-prima à entrega: todas as etapas foram confirmadas." : current.status === "paused" ? "A equipe retomará a atividade para continuar a fabricação." : DESCRIPTIONS[current.stageId],
    sector: current ? TEAM.find(member => member.id === current.assignedTo)?.name || "Equipe da oficina" : "Ciclo de produção concluído",
    next: current ? STAGES[index + 1]?.name || "Confirmação do recebimento" : "",
  };
}
