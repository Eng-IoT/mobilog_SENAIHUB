import { randomBytes,createHash } from "node:crypto";
import { signedIn,requireMembership,selectWorkspace } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { failure,json,readBody,sameOrigin,requiredText } from "@/lib/http";
import { createDemoState } from "@/lib/production";
import { AccessError } from "@/lib/access";
export const dynamic="force-dynamic";
function code(){return randomBytes(9).toString("base64url").toUpperCase();}
function hash(input:string){return createHash("sha256").update(input.trim().toUpperCase()).digest("hex");}
export async function POST(request:Request) {
  try {
    sameOrigin(request);const body=await readBody(request);
    if(body.action==="rotate-code") {
      const {membership,admin}=await requireMembership(true,request);
      const value=code();
      const {error}=await admin.rpc("mobilog_rotate_code",{p_workspace:membership.workspace_id,p_hash:hash(value)});
      if(error)throw error;
      return json({code:value});
    }
    const {user}=await signedIn();
    const admin=adminClient();
    const name=requiredText(body.displayName,"seu nome");
    if(body.action==="join") {
      const value=requiredText(body.code,"código da equipe",6,40);
      const {data,error}=await admin.rpc("mobilog_join_workspace",{p_user:user.id,p_name:name,p_invite_hash:hash(value)});
      if(error)return json({error:"Código inválido ou equipe indisponível. Confira com o instrutor."},422);
      return json({workspaceId:data,pending:true});
    }
    if(body.action!=="create")throw new AccessError("Operação inválida.",400);
    const groupName=requiredText(body.name,"nome da equipe");
    const {count,error:countError}=await admin.from("mobilog_workspaces").select("id",{head:true,count:"exact"}).eq("owner_user_id",user.id);
    if(countError)throw countError;
    if((count||0)>=15)throw new AccessError("Limite de 15 equipes por instrutor nesta versão.",422);
    const initial=createDemoState();
    if(body.samples!==true){initial.orders=[];initial.events=[];}
    const value=code();
    const {data,error}=await admin.rpc("mobilog_create_workspace",{p_owner:user.id,p_owner_name:name,p_name:groupName,p_state:initial,p_invite_hash:hash(value),p_training:body.training!==false});
    if(error)throw error;
    await selectWorkspace(data as string);
    return json({workspaceId:data,code:value});
  }catch(error){return failure(error);}
}
