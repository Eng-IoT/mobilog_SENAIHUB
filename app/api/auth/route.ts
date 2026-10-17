import { userClient } from "@/lib/supabase/server";
import { failure, json, sameOrigin, readBody, requiredText, email, password } from "@/lib/http";
export const dynamic="force-dynamic";
export async function POST(request:Request) {
  try {
    sameOrigin(request);
    const body=await readBody(request), client=await userClient();
    if(body.action==="logout") {
      const {error}=await client.auth.signOut();
      if(error)throw error;
      return json({ok:true});
    }
    const address=email(body.email),pass=password(body.password);
    if(body.action==="signup") {
      const name=requiredText(body.name,"nome");
      const {data,error}=await client.auth.signUp({email:address,password:pass,options:{data:{display_name:name},emailRedirectTo:new URL("/auth/confirm",request.url).toString()}});
      if(error)return json({error:"Não foi possível criar a conta. Confira os dados; se ela já existe, use Entrar. Se houver limite de e-mails, aguarde ou peça ao instrutor para cadastrar."},422);
      return json({ok:true,needsConfirmation:!data.session});
    }
    const {error}=await client.auth.signInWithPassword({email:address,password:pass});
    if(error)return json({error:"Não foi possível entrar. Confira e-mail, senha e confirmação da conta."},401);
    return json({ok:true});
  }catch(error){return failure(error);}
}
