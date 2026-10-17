import "server-only";
import { cookies } from "next/headers";
import { userClient, adminClient } from "./supabase/server";
import { AccessError, chooseMembership, type Identity, type Membership } from "./access";
export async function signedIn(allowPasswordChange = false) {
  const client = await userClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new AccessError("Entre com sua conta para continuar.", 401);
  if (data.user.app_metadata?.must_change_password && !allowPasswordChange) throw new AccessError("Altere a senha inicial para continuar.", 428);
  return { client, user: data.user };
}
export async function memberships(client: Awaited<ReturnType<typeof userClient>>, userId: string) {
  const { data, error } = await client.from("mobilog_memberships").select("*").eq("user_id", userId);
  if (error) throw new AccessError("O banco ainda não está configurado ou não foi possível consultar a equipe.", 503);
  return (data || []) as Membership[];
}
export async function requireMembership(adminOnly = false, request?: Request) {
  const {client,user} = await signedIn();
  const rows = await memberships(client,user.id);
  const store = await cookies();
  const explicit = request?.headers.get("X-MobiLog-Workspace");
  const membership = chooseMembership(rows,explicit,store.get("mobilog_workspace")?.value);
  if (!membership) throw new AccessError("Entre em uma equipe e aguarde a liberação do instrutor.", 403);
  if (adminOnly && membership.role !== "admin") throw new AccessError("Somente o instrutor pode administrar a equipe.", 403);
  const identity: Identity = {userId:user.id,name:membership.display_name,role:membership.role};
  return {client,user,membership,identity,admin:adminClient()};
}
export async function selectWorkspace(id: string) {
  const store = await cookies();
  store.set("mobilog_workspace",id,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV === "production",path:"/",maxAge:60*60*24*30});
}
