import {test} from "node:test";
import assert from "node:assert/strict";
import {applyCommand,createDemoState} from "../lib/production.ts";
import {authorizeCommand,chooseMembership} from "../lib/access.ts";
let serial=0;
const cmd=value=>({...value,eventId:"security-"+(++serial)});
const worker={userId:"worker-one",name:"Aluno Um",role:"montagem"};
test("duas abas mantêm a equipe explícita mesmo após outra aba trocar a seleção",()=>{
 const rows=[{workspace_id:"turma-a",active:true},{workspace_id:"turma-b",active:true}];
 assert.equal(chooseMembership(rows,"turma-a","turma-b").workspace_id,"turma-a");
 assert.equal(chooseMembership(rows,"turma-b","turma-a").workspace_id,"turma-b");
});
test("uma equipe explícita não autorizada não recai em outra equipe",()=>{
 const rows=[{workspace_id:"turma-a",active:true},{workspace_id:"turma-b",active:false}];
 assert.equal(chooseMembership(rows,"turma-b","turma-a"),undefined);
 assert.equal(chooseMembership(rows,"turma-externa","turma-a"),undefined);
});
test("a confirmação na nuvem identifica a conta e protege a atividade de outra pessoa",()=>{
 let state=createDemoState();const claim=cmd({kind:"stage-claim",actorId:"montagem",orderId:"OP-001",stageId:"assembly"});
 state=applyCommand(state,claim,new Date().toISOString(),worker).state;
 assert.equal(state.orders[0].stages[3].assignedUserId,worker.userId);
 assert.equal(state.events.at(-1).performer.name,"Aluno Um");
 assert.throws(()=>applyCommand(state,cmd({kind:"stage-finish",actorId:"montagem",orderId:"OP-001",stageId:"assembly",checks:[true,true],completedQuantity:1}),undefined,{...worker,userId:"worker-two"}),/outra pessoa/);
});
test("uma conta de corte não assume Logística alterando o comando",()=>{
 const state=createDemoState();
 assert.throws(()=>applyCommand(state,cmd({kind:"stock-receive",actorId:"gestao",materialId:"mdf",quantity:1,reason:"Tentativa inválida"}),undefined,{userId:"cut",name:"Aluno",role:"corte"}),/sua função/);
});
test("visitantes não registram execução",()=>{
 assert.throws(()=>authorizeCommand(createDemoState(),cmd({kind:"stage-start",actorId:"montagem"}),{userId:"viewer",name:"Visitante",role:"viewer"}),/somente consulta/);
});
test("instrutor reatribui para uma pessoa verificada e mantém autoria",()=>{
 const original=createDemoState();const identity={userId:"teacher",name:"Instrutor",role:"admin",assignment:{userId:"new-worker",name:"Aluna Dois",actorId:"montagem"}};
 const result=applyCommand(original,cmd({kind:"stage-reassign",actorId:"montagem",orderId:"OP-001",stageId:"assembly",targetUserId:"new-worker"}),undefined,identity);
 assert.equal(result.state.orders[0].stages[3].assignedUserId,"new-worker");
 assert.equal(result.state.events.at(-1).performer.userId,"teacher");
});
test("o trabalhador só reenvia a própria tentativa já aceita",()=>{
 const state=createDemoState();const command=cmd({kind:"stage-claim",actorId:"montagem",orderId:"OP-001",stageId:"assembly"});
 const saved=applyCommand(state,command,undefined,worker).state;
 assert.equal(applyCommand(saved,command,undefined,worker).duplicate,true);
 assert.throws(()=>applyCommand(saved,command,undefined,{...worker,userId:"different"}),/outra conta/);
});
test("o retorno por retrabalho libera nova atribuição sem apagar o histórico",()=>{
 const state=createDemoState();const teacher={userId:"teacher",name:"Instrutor",role:"admin"};
 const updated=applyCommand(state,cmd({kind:"quality-rework",actorId:"qualidade",orderId:"OP-004",stageId:"quality",reason:"Revisar acabamento"}),undefined,teacher).state;
 const order=updated.orders.find(o=>o.id==="OP-004");
 assert.equal(order.stages[4].assignedUserId,null);
 assert.equal(order.stages[5].assignedUserId,null);
 assert.ok(updated.events.length>state.events.length);
});
