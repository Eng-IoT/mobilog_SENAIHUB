"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {applyCommand,createDemoState,type Command,type Snapshot} from "@/lib/production";
import type {Account} from "@/lib/access";
import {browserClient} from "@/lib/supabase/browser";
export type PendingRecord={command:Command;status:"pending"|"blocked";error?:string};
export type ActionResult={status:"synced"|"pending"|"blocked";message:string};
function valid(value:unknown):value is Snapshot{const s=value as Snapshot;return !!s&&Array.isArray(s.state?.orders)&&Array.isArray(s.state?.materials)&&Array.isArray(s.state?.events)&&typeof s.revision==="number";}
export function useProduction(account:Account,{readOnly=false}:{readOnly?:boolean}={}) {
  const demo=account.mode==="demo";
  const scope="mobilog-r01:"+account.userId+":"+account.workspaceId;
  const queueKey=scope+":queue",cacheKey=scope+":cache";
  const [snapshot,setSnapshot]=useState<Snapshot|null>(()=>demo?{state:createDemoState(),revision:0,updatedAt:new Date().toISOString()}:null);
  const [connection,setConnection]=useState(demo?"demo":"connecting");
  const [syncedAt,setSyncedAt]=useState<string|null>(null),[pending,setPending]=useState<PendingRecord[]>([]),[busy,setBusy]=useState(false),[storageError,setStorageError]=useState("");
  const snapshotRef=useRef(snapshot),busyRef=useRef(false),alive=useRef(true);
  const queue=useCallback(():PendingRecord[]=>{try{const value=JSON.parse(localStorage.getItem(queueKey)||"[]");return Array.isArray(value)?value.filter(item=>item?.command?.eventId):[];}catch{return [];}},[queueKey]);
  const saveQueue=useCallback((items:PendingRecord[])=>{try{localStorage.setItem(queueKey,JSON.stringify(items));if(alive.current){setPending(items);setStorageError("");}return true;}catch{setStorageError("O aparelho não conseguiu guardar a tentativa. Libere espaço e tente novamente.");return false;}},[queueKey]);
  const update=useCallback((next:Snapshot)=>{if(snapshotRef.current&&next.revision<=snapshotRef.current.revision)return;snapshotRef.current=next;if(alive.current)setSnapshot(next);try{localStorage.setItem(cacheKey,JSON.stringify(next));}catch{}},[cacheKey]);
  const refresh=useCallback(async()=>{
    if(demo)return;
    if(!navigator.onLine){setConnection("offline");return;}
    try{
      const r=await fetch("/api/workspace",{cache:"no-store",headers:{"X-MobiLog-Workspace":account.workspaceId},signal:AbortSignal.timeout(12000)});
      if(!r.ok)throw 0;const next:unknown=await r.json();if(!valid(next))throw 0;
      update(next);if(alive.current){setConnection("online");setSyncedAt(new Date().toISOString());}
    }catch{if(alive.current)setConnection("offline");}
  },[demo,update,account.workspaceId]);
  const flush=useCallback(async(targetId?:string):Promise<ActionResult>=>{
    if(readOnly)return {status:"blocked",message:"Esta tela permite apenas acompanhamento."};
    if(busyRef.current)return {status:"pending",message:"A sincronização já está em andamento."};
    if(!navigator.onLine){setConnection("offline");return {status:"pending",message:"Tentativa guardada neste aparelho. Aguarde a conexão para confirmar."};}
    busyRef.current=true;setBusy(true);let result:ActionResult={status:"synced",message:"Registros sincronizados."};
    try{
      for(const item of queue().filter(record=>record.status==="pending")){
        try{
          const r=await fetch("/api/workspace",{method:"POST",headers:{"Content-Type":"application/json","X-MobiLog-Workspace":account.workspaceId},body:JSON.stringify(item.command),signal:AbortSignal.timeout(15000)});
          const next:unknown=await r.json();
          const error=next&&typeof next==="object"&&"error"in next&&typeof next.error==="string"?next.error:"";
          if(r.ok&&valid(next)){
            update(next);setConnection("online");setSyncedAt(new Date().toISOString());saveQueue(queue().filter(record=>record.command.eventId!==item.command.eventId));
          }else if(r.status===409||r.status===401||r.status===428||r.status>=500){
            setConnection("offline");result={status:"pending",message:error||"Aguardando confirmação do servidor. Entre novamente se a sessão tiver expirado."};break;
          }else{
            const message=error||"Confira a tentativa antes de reenviar.";
            saveQueue(queue().map(record=>record.command.eventId===item.command.eventId?{...record,status:"blocked",error:message}:record));
            if(!targetId||targetId===item.command.eventId)result={status:"blocked",message};
          }
        }catch{setConnection("offline");result={status:"pending",message:"Tentativa guardada. A confirmação na nuvem ainda não chegou."};break;}
      }
      if(targetId){const remaining=queue().find(record=>record.command.eventId===targetId);if(remaining)result={status:remaining.status==="blocked"?"blocked":"pending",message:remaining.error||"Tentativa guardada neste aparelho; ainda não confirmada na nuvem."};else result={status:"synced",message:"Registro confirmado. O painel da equipe receberá a atualização."};}
    }finally{busyRef.current=false;if(alive.current)setBusy(false);}
    return result;
  },[queue,saveQueue,update,account.workspaceId,readOnly]);
  const run=useCallback(async(partial:Omit<Command,"eventId">):Promise<ActionResult>=>{
    if(readOnly)return {status:"blocked",message:"Esta tela permite apenas acompanhamento."};
    const command={...partial,eventId:crypto.randomUUID()};
    if(demo){
      try{const old=snapshotRef.current!;const {state}=applyCommand(old.state,command,new Date().toISOString(),{userId:"demo",name:"Demonstração local",role:"admin"});update({state,revision:old.revision+1,updatedAt:new Date().toISOString()});return {status:"synced",message:"Registro demonstrativo salvo neste navegador."};}
      catch(error){return {status:"blocked",message:error instanceof Error?error.message:"Confira a atividade."};}
    }
    if(!saveQueue([...queue(),{command,status:"pending"}]))return {status:"blocked",message:"Não foi possível guardar a tentativa no aparelho."};
    return flush(command.eventId);
  },[demo,flush,queue,saveQueue,update,readOnly]);
  const retry=useCallback(async()=>{if(readOnly)return {status:"blocked" as const,message:"Esta tela permite apenas acompanhamento."};saveQueue(queue().map(item=>({command:item.command,status:"pending"})));return flush();},[queue,saveQueue,flush,readOnly]);
  const dismiss=useCallback((id:string)=>{if(!readOnly)saveQueue(queue().filter(item=>item.command.eventId!==id));},[queue,saveQueue,readOnly]);
  const resetDemo=useCallback(()=>{if(!demo||readOnly)return;const old=snapshotRef.current;update({state:createDemoState(),revision:(old?.revision||0)+1,updatedAt:new Date().toISOString()});},[demo,update,readOnly]);
  useEffect(()=>{
    alive.current=true;
    setPending(queue());
    try{const cached:unknown=JSON.parse(localStorage.getItem(cacheKey)||"null");if(valid(cached))update(cached);}catch{}
    const resume=()=>{void refresh().then(()=>{if(!readOnly)void flush();});};
    if(!demo)resume();
    const timer=setInterval(()=>{if(!demo&&!document.hidden)resume();},6000);
    const storage=(event:StorageEvent)=>{if(event.key===queueKey)setPending(queue());if(demo&&event.key===cacheKey&&event.newValue){try{const value:unknown=JSON.parse(event.newValue);if(valid(value))update(value);}catch{}}};
    const visible=()=>{if(!document.hidden&&!demo)resume();};
    window.addEventListener("storage",storage);window.addEventListener("online",visible);window.addEventListener("offline",visible);document.addEventListener("visibilitychange",visible);
    let stopRealtime=()=>{};
    if(!demo){const client=browserClient();if(client){const channel=client.channel("mobilog-"+account.workspaceId).on("postgres_changes",{event:"UPDATE",schema:"public",table:"mobilog_states",filter:"workspace_id=eq."+account.workspaceId},()=>void refresh()).subscribe();stopRealtime=()=>{void client.removeChannel(channel);};}}
    if("serviceWorker"in navigator&&window.location.protocol!=="file:")void navigator.serviceWorker.register("/sw.js").catch(()=>{});
    return()=>{alive.current=false;clearInterval(timer);stopRealtime();window.removeEventListener("storage",storage);window.removeEventListener("online",visible);window.removeEventListener("offline",visible);document.removeEventListener("visibilitychange",visible);};
  },[account.workspaceId,demo,queue,queueKey,cacheKey,update,refresh,flush,readOnly]);
  return {state:snapshot?.state||null,revision:snapshot?.revision,connection,syncedAt,pending,busy,storageError,run,refresh,dismiss,retry,resetDemo};
}
