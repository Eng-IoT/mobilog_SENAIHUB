import { requireMembership } from "@/lib/session";
import { failure,json,readBody,sameOrigin,requiredText,password,email } from "@/lib/http";
import { AccessError,validateRole } from "@/lib/access";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  try {
    const {membership,admin}=await requireMembership(false,request);
    const {data,error}=await admin.from("mobilog_memberships").select("user_id,display_name,role,active,created_at").eq("workspace_id",membership.workspace_id).order("created_at");
    if(error)throw error;
    return json({members:data});
  }catch(error){return failure(error);}
}
export async function POST(request:Request) {
  try {
    sameOrigin(request);const body=await readBody(request);
    const {membership,admin,user}=await requireMembership(true,request);
    if(body.action==="create-user") {
      const address=email(body.email),pass=password(body.password),name=requiredText(body.name,"nome");
      const role=validateRole(body.role);if(role==="admin")throw new AccessError("Cadastre os alunos com uma função operacional.");
      const {data,error}=await admin.auth.admin.createUser({email:address,password:pass,email_confirm:true,user_metadata:{display_name:name},app_metadata:{must_change_password:true,managed_by_workspace_id:membership.workspace_id}});
      if(error||!data.user)return json({error:"Não foi possível criar a conta. O e-mail pode já estar cadastrado; nesse caso, a pessoa deve entrar e solicitar acesso pelo código."},422);
      const {error:memberError}=await admin.from("mobilog_memberships").insert({workspace_id:membership.workspace_id,user_id:data.user.id,display_name:name,role,active:true});
      if(memberError){await admin.auth.admin.deleteUser(data.user.id);throw memberError;}
      return json({ok:true});
    }
    const target=requiredText(body.userId,"pessoa",8,100);
    const {data:existing,error:lookupError}=await admin.from("mobilog_memberships").select("*").eq("workspace_id",membership.workspace_id).eq("user_id",target).single();
    if(lookupError||!existing)throw new AccessError("Pessoa não encontrada nesta equipe.",404);
    if(target===user.id)throw new AccessError("A própria conta do instrutor não pode ser alterada por esta tela.",422);
    if(existing.role==="admin")throw new AccessError("A administração de outra conta de instrutor exige revisão do responsável.",422);
    if(body.action==="reset-password") {
      const {data:targetUser,error:userError}=await admin.auth.admin.getUserById(target);
      if(userError||!targetUser.user)throw userError||new Error("Missing user");
      if(targetUser.user.app_metadata?.managed_by_workspace_id!==membership.workspace_id)throw new AccessError("Esta conta não foi criada por esta equipe. O titular deve recuperar o acesso com o responsável pelo projeto Supabase.",422);
      const {error}=await admin.auth.admin.updateUserById(target,{password:password(body.password),app_metadata:{...targetUser.user.app_metadata,must_change_password:true}});
      if(error)throw error;
      return json({ok:true});
    }
    if(body.action!=="update")throw new AccessError("Operação inválida.",400);
    const role=validateRole(body.role);if(role==="admin")throw new AccessError("Use uma função operacional nesta tela.",422);
    const name=requiredText(body.name,"nome");
    const {error}=await admin.from("mobilog_memberships").update({display_name:name,role,active:body.active===true}).eq("workspace_id",membership.workspace_id).eq("user_id",target);
    if(error)throw error;
    return json({ok:true});
  }catch(error){return failure(error);}
}
