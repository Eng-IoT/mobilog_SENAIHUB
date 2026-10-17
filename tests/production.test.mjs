import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand, createDemoState, activeStage, availableQuantity, reservedQuantity, recipe, STAGES, progress } from '../lib/production.ts';

let serial = 0;
const command = partial => ({ ...partial, eventId: 'test-event-' + (++serial) });
const perform = (state, partial, at) => applyCommand(state, command(partial), at).state;
const newOrder = (state, overrides = {}) => perform(state, { kind: 'create-order', actorId: 'gestao', order: { name:'Mesa de teste',client:'Destino didático',type:'mesa',quantity:1,due:'2026-12-01',priority:'normal',notes:'Simulação',...overrides } });
function planningFinished(state, id) {
  state=perform(state,{kind:'stage-start',actorId:'gestao',orderId:id,stageId:'planning'});
  return perform(state,{kind:'stage-finish',actorId:'gestao',orderId:id,stageId:'planning',checks:[true,true],completedQuantity:1});
}
test('a nova ordem só libera planejamento; corte exige a etapa anterior', () => {
  const state=newOrder(createDemoState(new Date('2026-10-14T18:00:00Z')));
  const order=state.orders.at(-1);
  assert.equal(activeStage(order).stageId,'planning');
  assert.equal(order.stages[1].status,'waiting');
  assert.throws(()=>perform(state,{kind:'stage-start',actorId:'corte',orderId:order.id,stageId:'cut'}),/anterior/);
});
test('um responsável não confirma a atividade atribuída a outro', () => {
  const state=createDemoState();
  assert.throws(()=>perform(state,{kind:'stage-finish',actorId:'corte',orderId:'OP-001',stageId:'assembly',checks:[true,true],completedQuantity:1}),/outro responsável/);
});
test('faltam materiais: planejamento permanece aberto e nenhum saldo é alterado', () => {
  let state=newOrder(createDemoState(),{materials:[{materialId:'mdf',quantity:999}]});
  const id=state.orders.at(-1).id;
  state=perform(state,{kind:'stage-start',actorId:'gestao',orderId:id,stageId:'planning'});
  const original=structuredClone(state);
  assert.throws(()=>perform(state,{kind:'stage-finish',actorId:'gestao',orderId:id,stageId:'planning',checks:[true,true],completedQuantity:1}),/insuficientes/);
  assert.deepEqual(state,original);
  assert.equal(state.orders.at(-1).stages[1].status,'waiting');
});
test('planejamento reserva; corte consome; retransmissão não desconta duas vezes', () => {
  let state=newOrder(createDemoState());const id=state.orders.at(-1).id;
  const physical=state.materials.find(m=>m.id==='mdf').stock;
  const reserved=reservedQuantity(state,'mdf');
  state=planningFinished(state,id);
  assert.equal(state.materials.find(m=>m.id==='mdf').stock,physical);
  assert.equal(reservedQuantity(state,'mdf'),reserved+2.4);
  state=perform(state,{kind:'stage-start',actorId:'corte',orderId:id,stageId:'cut'});
  const finish=command({kind:'stage-finish',actorId:'corte',orderId:id,stageId:'cut',checks:[true,true],completedQuantity:1});
  const accepted=applyCommand(state,finish);
  assert.equal(accepted.state.materials.find(m=>m.id==='mdf').stock,Math.round((physical-2.4)*1000)/1000);
  assert.equal(reservedQuantity(accepted.state,'mdf'),reserved);
  const repeated=applyCommand(accepted.state,finish);
  assert.equal(repeated.duplicate,true);
  assert.deepEqual(repeated.state,accepted.state);
});
test('checklist incompleto e quantidade parcial não concluem o lote', () => {
  let state=createDemoState();
  assert.throws(()=>perform(state,{kind:'stage-finish',actorId:'montagem',orderId:'OP-001',stageId:'assembly',checks:[true,false],completedQuantity:1}),/checklist/);
  assert.throws(()=>perform(state,{kind:'stage-finish',actorId:'montagem',orderId:'OP-001',stageId:'assembly',checks:[true,true],completedQuantity:0}),/quantidade/);
});
test('pausa preserva bloqueio; retomada registra o intervalo', () => {
  let state=createDemoState(new Date('2026-10-14T18:00:00Z'));
  state=perform(state,{kind:'stage-pause',actorId:'montagem',orderId:'OP-001',stageId:'assembly',reason:'Material em conferência'},'2026-10-14T18:00:00Z');
  assert.equal(state.orders[0].stages[4].status,'waiting');
  state=perform(state,{kind:'stage-resume',actorId:'montagem',orderId:'OP-001',stageId:'assembly'},'2026-10-14T18:05:00Z');
  assert.equal(state.orders[0].stages[3].pauseMs,300000);
});
test('retrabalho devolve ao acabamento, exige nova inspeção e mantém histórico e consumo', () => {
  let state=createDemoState();
  const eventCount=state.events.length;
  const stock=structuredClone(state.materials);
  state=perform(state,{kind:'quality-rework',actorId:'qualidade',orderId:'OP-004',stageId:'quality',reason:'Revisar a superfície'});
  const o=state.orders.find(o=>o.id==='OP-004');
  assert.equal(activeStage(o).stageId,'finish');assert.equal(o.stages[5].status,'waiting');
  assert.equal(o.stages[6].status,'waiting');assert.equal(o.stages[7].status,'waiting');
  assert.equal(o.reworks,1);assert.equal(o.materialState,'consumed');
  assert.deepEqual(state.materials,stock);assert.equal(state.events.length,eventCount+1);
});
test('recebimento altera o disponível; uma entrega exige todas as etapas anteriores', () => {
  let state=createDemoState();
  const before=availableQuantity(state,'hinges');
  state=perform(state,{kind:'stock-receive',actorId:'gestao',materialId:'hinges',quantity:8,reason:'Recebimento didático'});
  assert.equal(availableQuantity(state,'hinges'),before+8);
  assert.throws(()=>perform(state,{kind:'stage-start',actorId:'gestao',orderId:'OP-003',stageId:'delivery'}),/anterior/);
  assert.equal(progress(state.orders.find(o=>o.id==='OP-006')),100);
});
test('fluxo completo conclui o pedido e preserva um evento por confirmação', () => {
  let state=newOrder(createDemoState());const id=state.orders.at(-1).id;const before=state.events.length;
  for(const stage of STAGES) {
    state=perform(state,{kind:'stage-start',actorId:stage.owner,orderId:id,stageId:stage.id});
    state=perform(state,{kind:'stage-finish',actorId:stage.owner,orderId:id,stageId:stage.id,checks:[true,true],completedQuantity:1});
  }
  const order=state.orders.at(-1);
  assert.equal(progress(order),100);assert.equal(activeStage(order),undefined);
  assert.equal(state.events.length,before+16);
  assert.equal(state.events.at(-1).title,'Entrega confirmada');
});
test('um identificador usado não aceita outro comando', () => {
  const state=createDemoState();const op=command({kind:'stock-receive',actorId:'gestao',materialId:'hinges',quantity:2,reason:'Teste de retransmissão'});
  const updated=applyCommand(state,op).state;
  assert.throws(()=>applyCommand(updated,{...op,quantity:3}),/outra ação/);
});
