const required=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SECRET_KEY"];
let invalid=false;
for(const key of required){const present=!!process.env[key];console.log(key+": "+(present?"configurada":"ausente"));if(!present)invalid=true;}
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"";
let role="";
try{role=JSON.parse(Buffer.from(publicKey.split(".")[1]||"","base64url").toString()).role||"";}catch{}
if(publicKey.startsWith("sb_secret_")||role==="service_role"){console.error("A variável pública contém uma chave privada. Substitua pela chave publishable. Não publique esse valor no GitHub.");invalid=true;}
try{if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.endsWith(".supabase.co"))throw 0;}catch{console.error("Confira a URL do projeto Supabase.");invalid=true;}
if(invalid){console.error("Complete as variáveis no ambiente de execução. Nenhum valor foi exibido.");process.exitCode=1;}
