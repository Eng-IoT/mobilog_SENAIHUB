import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, MeshStandardMaterial, Vector3 } from 'three';
import { applyCommand, createDemoState, STAGES, TYPES } from '../lib/production.ts';
import { trackingAccount, trackingHref, trackingStage } from '../lib/tracking.ts';
import { createFurnitureModel } from '../lib/furniture-model.ts';

const account = {
  userId: 'teacher', name: 'Docente', email: 'docente@example.test', role: 'admin',
  workspaceId: 'team-a', workspaceName: 'Turma A', mustChangePassword: false, mode: 'cloud',
  workspaces: [
    { id: 'team-a', name: 'Turma A', active: true, role: 'admin' },
    { id: 'team-b', name: 'Turma B', active: true, role: 'viewer' },
    { id: 'team-c', name: 'Turma C', active: false, role: 'admin' },
  ],
};

test('a apresentação identifica a equipe do link sem trocar a equipe da conta', () => {
  const selected = trackingAccount(account, 'team-b');
  assert.equal(selected.workspaceId, 'team-b');
  assert.equal(selected.workspaceName, 'Turma B');
  assert.equal(selected.role, 'viewer');
  assert.equal(account.workspaceId, 'team-a');
  assert.equal(trackingAccount(account, 'team-c'), null);
  assert.equal(trackingAccount(account, 'unknown'), null);
  assert.equal(trackingAccount({ ...account, mode: 'demo' }, 'team-b'), null);
});

test('o link preserva pedido e equipe mesmo com espaços e caracteres reservados', () => {
  const href = trackingHref('OP-001 & teste', 'team b/+');
  const params = new URLSearchParams(href.slice(1));
  assert.equal(params.get('view'), 'acompanhamento');
  assert.equal(params.get('order'), 'OP-001 & teste');
  assert.equal(params.get('equipe'), 'team b/+');
  assert.ok(href.startsWith('?'));
});

test('a TV diferencia execução, pausa e espera sem avançar a fabricação', () => {
  const state = createDemoState();
  const before = structuredClone(state);
  assert.equal(trackingStage(state.orders[0]).title, 'Montagem');
  assert.equal(trackingStage(state.orders[0]).status, 'Em execução');
  assert.equal(trackingStage(state.orders[1]).title, 'Acabamento');
  assert.equal(trackingStage(state.orders[1]).status, 'Atividade pausada');
  assert.equal(trackingStage(state.orders[2]).status, 'Aguardando início');
  assert.deepEqual(state, before);
});

test('retrabalho retorna o destaque ao acabamento e atualiza a contagem de etapas', () => {
  let state = createDemoState();
  const command = (kind, stageId, reason) => ({ eventId: `tv-${kind}-event`, kind, actorId: 'qualidade', orderId: 'OP-004', stageId, reason });
  state = applyCommand(state, command('stage-start', 'quality')).state;
  state = applyCommand(state, command('quality-rework', 'quality', 'Ajustar as bordas antes de aprovar.')).state;
  const presentation = trackingStage(state.orders.find(order => order.id === 'OP-004'));
  assert.equal(presentation.title, 'Acabamento');
  assert.equal(presentation.index, 4);
  assert.equal(presentation.completed, 4);
  assert.equal(presentation.next, 'Qualidade');
});

test('o móvel só aparece entregue após a confirmação da última etapa', () => {
  const order = structuredClone(createDemoState().orders[5]);
  assert.equal(trackingStage(order).title, 'Móvel entregue');
  assert.equal(trackingStage(order).completed, STAGES.length);
  assert.equal(trackingStage(order).next, '');
  order.stages[7].status = 'in_progress';
  const presentation = trackingStage(order);
  assert.equal(presentation.title, 'Entrega');
  assert.equal(presentation.status, 'Em execução');
  assert.equal(presentation.completed, 7);
});

test('as quatro categorias geram modelos 3D válidos com volume e coordenadas finitas', () => {
  const material = new MeshStandardMaterial();
  for (const { value } of TYPES) {
    const model = createFurnitureModel(value, material, material, material);
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    assert.ok(size.x > 0.5 && size.y > 0.5 && size.z > 0.4, value);
    assert.ok(size.x < 4 && size.y < 4 && size.z < 4, value);
    model.traverse(object => {
      if (!object.isMesh) return;
      for (const attribute of Object.values(object.geometry.attributes)) {
        assert.ok(Array.from(attribute.array).every(Number.isFinite), `Geometria inválida: ${value}`);
      }
      object.geometry.dispose();
    });
  }
  material.dispose();
});
