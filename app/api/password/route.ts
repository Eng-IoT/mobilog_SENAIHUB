import { signedIn } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { failure,json,readBody,sameOrigin,password } from "@/lib/http";
export async function POST(request:Request) {
  try {
    sameOrigin(request);const body=await readBody(request);const {client,user}=await signedIn(true);
    const {error}=await client.auth.updateUser({password:password(body.password)});
    if(error) return json({error:"Não foi possível alterar a senha. Confira a política de senhas do projeto."},422);
    if(user.app_metadata?.must_change_password) {
      const {error:metaError}=await adminClient().auth.admin.updateUserById(user.id,{app_metadata:{...user.app_metadata,must_change_password:false}});
      if(metaError)throw metaError;
    }
    return json({ok:true});
  }catch(error){return failure(error);}
}
