import { requireMembership } from "@/lib/session";
import { failure,json,readBody,sameOrigin } from "@/lib/http";
import { applyCommand,isMaintenanceCommand,validateMaintenanceRevision,ProductionError,type ProductionState,type Command } from "@/lib/production";
import { actorFor } from "@/lib/access";
export const dynamic="force-dynamic";
type Row={revision:number;state:ProductionState;updated_at:string};
function snapshot(row:Row){return {state:row.state,revision:Number(row.revision),updatedAt:row.updated_at};}
export async function GET(request:Request) {
  try {
    const {client,membership}=await requireMembership(false,request);
    const {data,error}=await client.from("mobilog_states").select("state,revision,updated_at").eq("workspace_id",membership.workspace_id).single();
    if(error||!data)throw error||new Error("Missing workspace");
    return json(snapshot(data as Row));
  }catch(error){return failure(error);}
}
export async function POST(request:Request) {
  try {
    sameOrigin(request);
    const command=await readBody(request) as unknown as Command;
    const {admin,membership,identity}=await requireMembership(false,request);
    if(identity.role!=="admin")command.actorId=actorFor(identity.role);
    if(command.kind==="stage-reassign") {
      const {data,error}=await admin.from("mobilog_memberships").select("*").eq("workspace_id",membership.workspace_id).eq("user_id",command.targetUserId||"").eq("active",true).single();
      if(error||!data)throw new ProductionError("Selecione uma pessoa ativa desta equipe.");
      identity.assignment={userId:data.user_id,name:data.display_name,actorId:actorFor(data.role)};
    }
    for(let attempt=0;attempt<6;attempt++) {
      const {data,error}=await admin.from("mobilog_states").select("*").eq("workspace_id",membership.workspace_id).single();
      if(error||!data)throw error||new Error("Missing workspace");
      const row=data as Row;
      const result=applyCommand(row.state,command,new Date().toISOString(),identity);
      if(result.duplicate)return json({...snapshot(row),duplicate:true});
      validateMaintenanceRevision(command,Number(row.revision));
      const updatedAt=new Date().toISOString();
      const {data:updated,error:updateError}=await admin.from("mobilog_states").update({state:result.state,revision:Number(row.revision)+1,updated_at:updatedAt}).eq("workspace_id",membership.workspace_id).eq("revision",row.revision).select("state,revision,updated_at").maybeSingle();
      if(updateError)throw updateError;
      if(updated)return json({...snapshot(updated as Row),duplicate:false});
      if(isMaintenanceCommand(command.kind))return json({error:"A produção mudou em outro aparelho. Confira os dados e abra a confirmação novamente."},409);
    }
    return json({error:"Outro aparelho atualizou o pedido. A tentativa permanece guardada para sincronizar."},409);
  }catch(error){return failure(error);}
}
