import { requireMembership } from "@/lib/session";
import { failure, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { admin, membership } = await requireMembership(false, request);
    const orderId = new URL(request.url).searchParams.get("order");
    if (!orderId || orderId.length > 100) return json({ error: "Selecione um pedido." }, 422);
    const { data, error } = await admin.from("mobilog_product_passports").select("id,unit_number").eq("workspace_id", membership.workspace_id).eq("order_id", orderId).order("unit_number");
    if (error) throw error;
    return json({ identities: data });
  } catch (error) { return failure(error); }
}
