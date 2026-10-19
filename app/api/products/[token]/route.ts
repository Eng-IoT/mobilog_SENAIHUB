import { adminClient } from "@/lib/supabase/server";
import { buildProductPassport, PASSPORT_TOKEN } from "@/lib/product-passport";
import { json } from "@/lib/http";
import type { ProductionState } from "@/lib/production";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    if (!PASSPORT_TOKEN.test(token)) return json({ error: "Ficha do produto não encontrada." }, 404);
    const admin = adminClient();
    const { data: identity, error } = await admin.from("mobilog_product_passports").select("workspace_id,order_id,unit_number").eq("id", token).maybeSingle();
    if (error) throw error;
    if (!identity) return json({ error: "Ficha do produto não encontrada." }, 404);
    const [snapshot, workspace] = await Promise.all([
      admin.from("mobilog_states").select("state,updated_at").eq("workspace_id", identity.workspace_id).single(),
      admin.from("mobilog_workspaces").select("training").eq("id", identity.workspace_id).single(),
    ]);
    if (snapshot.error || workspace.error) throw snapshot.error || workspace.error;
    const product = buildProductPassport(snapshot.data.state as ProductionState, identity.order_id, identity.unit_number, token, workspace.data.training, snapshot.data.updated_at);
    if (!product) return json({ error: "Ficha do produto não encontrada." }, 404);
    return json(product);
  } catch (error) {
    console.error("MobiLog product lookup failed", error instanceof Error ? error.name : "unknown");
    return json({ error: "Não foi possível consultar a ficha do produto. Tente novamente em instantes." }, 503);
  }
}
