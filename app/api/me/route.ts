import { signedIn,memberships,selectWorkspace } from "@/lib/session";
import { adminClient,configured } from "@/lib/supabase/server";
import { failure,json,readBody,sameOrigin,requiredText } from "@/lib/http";
import { cookies } from "next/headers";
import { AccessError } from "@/lib/access";
export const dynamic="force-dynamic";
export async function GET() {
  try{
    if(!configured())return json({configured:false,user:null,workspaces:[]});
    const {client,user}=await signedIn(true);
    const rows=await memberships(client,user.id);
    const admin=adminClient();
    const ids=rows.map(row=>row.workspace_id);
    const groups=ids.length ? await admin.from("mobilog_workspaces").select("id,name,training").in("id",ids) : {data:[],error:null};
    if(groups.error)throw groups.error;
    const list=rows.map(row=>({id:row.workspace_id,name:groups.data?.find(g=>g.id===row.workspace_id)?.name||"Equipe",active:row.active,role:row.role}));
    const chosen=(await cookies()).get("mobilog_workspace")?.value;
    const current=rows.find(row=>row.workspace_id===chosen&&row.active)||rows.find(row=>row.active);
    return json({configured:true,user:{userId:user.id,name:current?.display_name||String(user.user_metadata?.display_name||user.email?.split("@")[0]||"Usuário"),email:user.email||"",mustChangePassword:!!user.app_metadata?.must_change_password,role:current?.role||"viewer",workspaceId:current?.workspace_id||"",workspaceName:list.find(g=>g.id===current?.workspace_id)?.name||"",workspaces:list,mode:"cloud"},workspaces:list});
  }catch(error){return failure(error);}
}
export async function POST(request:Request) {
  try{
    sameOrigin(request);const body=await readBody(request);const {client,user}=await signedIn();
    const id=requiredText(body.workspaceId,"equipe",8,100),rows=await memberships(client,user.id);
    if(!rows.some(row=>row.workspace_id===id&&row.active))throw new AccessError("Sua conta não está liberada para esta equipe.");
    await selectWorkspace(id);return json({ok:true});
  }catch(error){return failure(error);}
}
