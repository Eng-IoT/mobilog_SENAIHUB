"use client";
import {useEffect,useState} from "react";
import {UserRoundCog} from "lucide-react";
import {actorFor,type Account,type Membership} from "@/lib/access";
import {activeStage,type Command,type Order} from "@/lib/production";
import type {ActionResult} from "@/hooks/use-production";
export default function StageAssignment({account,order,busy,run,onMessage}:{account:Account;order:Order;busy:boolean;run:(c:Omit<Command,"eventId">)=>Promise<ActionResult>;onMessage:(s:string)=>void}) {
  const [members,setMembers]=useState<Membership[]>([]),[target,setTarget]=useState(""),[error,setError]=useState("");
  const stage=activeStage(order);
  useEffect(()=>{let active=true;void fetch("/api/team",{cache:"no-store",headers:{"X-MobiLog-Workspace":account.workspaceId}}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);if(active)setMembers(data.members||[]);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[account.workspaceId]);
  useEffect(()=>setTarget(stage?.assignedUserId||""),[order.id,stage?.stageId,stage?.assignedUserId]);
  if(!stage)return null;
  const candidates=members.filter(m=>m.active&&actorFor(m.role)===stage.assignedTo);
  return <section className="assignment-box"><div><UserRoundCog size={19}/><strong>Responsável pela etapa atual</strong></div><p>{stage.assignedName||"Atividade ainda sem uma pessoa atribuída."}</p><label className="field">Atribuir ou trocar pessoa<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Selecione alguém desta função</option>{candidates.map(m=><option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select></label><button className="btn secondary full" disabled={busy||!target||target===stage.assignedUserId} onClick={()=>void run({kind:"stage-reassign",actorId:stage.assignedTo,orderId:order.id,stageId:stage.stageId,targetUserId:target}).then(result=>onMessage(result.message))}>Confirmar responsável</button>{!candidates.length&&<p className="small-text muted">Cadastre ou libere uma pessoa com a função correspondente em Equipe.</p>}{error&&<p className="form-error" role="alert">{error}</p>}</section>;
}
