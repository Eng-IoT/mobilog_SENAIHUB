import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCommand, createDemoState, EMPTY_PRODUCT_DETAILS } from "../lib/production.ts";
import { buildProductPassport, passportSerial, stageTiming } from "../lib/product-passport.ts";

const token = "abc12345-0000-4000-8000-000000000001";
const now = new Date("2026-10-19T15:00:00Z");
test("a ficha publica somente os dados do produto e mantém a identidade por unidade", () => {
  const state = createDemoState(now), order = state.orders[0];
  order.client = "Destino privado"; order.notes = "Observação interna";
  order.productDetails = { ...EMPTY_PRODUCT_DETAILS, woodType: "MDF 18 mm", secret: "Não publicar" };
  state.events[0].fingerprint = "comando privado";
  for (const event of state.events) { event.performer = { userId: "uuid-interno", name: "Pessoa privada" }; event.detail = "Motivo interno"; }
  order.stages[0].assignedName = "Nome privado";
  const result = buildProductPassport(state, order.id, 1, token, true, now.toISOString(), now.getTime());
  assert.equal(result.details.woodType, "MDF 18 mm");
  assert.equal(result.serial, passportSerial(token, order.id, 1));
  const publicText = JSON.stringify(result);
  for (const privateValue of ["Destino privado", "Observação interna", "comando privado", "uuid-interno", "Pessoa privada", "Nome privado", "Motivo interno", "Não publicar"]) assert.ok(!publicText.includes(privateValue));
  assert.equal(buildProductPassport(state, order.id, 2, token, true, now.toISOString()), null);
  assert.equal(buildProductPassport(state, "OP-inexistente", 1, token, true, now.toISOString()), null);
  assert.equal(buildProductPassport(state, order.id, 0, token, true, now.toISOString()), null);
});
test("o tempo ativo desconsidera pausas e soma os ciclos de retrabalho", () => {
  const at = minute => new Date(now.getTime() + minute * 60000).toISOString();
  const kinds = [["stage-start", 0], ["stage-pause", 5], ["stage-resume", 10], ["stage-finish", 20], ["stage-start", 30], ["stage-finish", 40]];
  const events = kinds.map(([kind, minute]) => ({ kind, stageId: "finish", at: at(minute) }));
  const run = { stageId: "finish", status: "done", startedAt: at(30), completedAt: at(40), pauseMs: 0, pausedAt: null };
  assert.deepEqual(stageTiming(run, events, now.getTime() + 60 * 60000), { activeMs: 25 * 60000, pausedMs: 5 * 60000 });
});
test("uma pausa aberta não aumenta o tempo de execução", () => {
  const at = minute => new Date(now.getTime() + minute * 60000).toISOString();
  const run = { stageId: "assembly", status: "paused", startedAt: at(0), completedAt: null, pauseMs: 0, pausedAt: at(10) };
  const events = [{ stageId: "assembly", kind: "stage-start", at: at(0) }, { stageId: "assembly", kind: "stage-pause", at: at(10) }];
  assert.deepEqual(stageTiming(run, events, now.getTime() + 30 * 60000), { activeMs: 10 * 60000, pausedMs: 20 * 60000 });
});
test("a Logística completa a ficha sem alterar etapas ou consumir materiais", () => {
  const state = createDemoState(now), details = { ...EMPTY_PRODUCT_DETAILS, woodType: "Pinus", finish: "Verniz" };
  const command = { kind: "update-product-details", actorId: "gestao", eventId: "passport-edit-0001", orderId: "OP-001", productDetails: details };
  const result = applyCommand(state, command, now.toISOString(), { userId: "log", role: "logistica", name: "Logística" });
  assert.equal(result.state.orders[0].productDetails.woodType, "Pinus");
  assert.deepEqual(result.state.orders[0].stages, state.orders[0].stages);
  assert.deepEqual(result.state.materials, state.materials);
  assert.equal(applyCommand(result.state, command, now.toISOString(), { userId: "log", role: "logistica", name: "Logística" }).duplicate, true);
  assert.throws(() => applyCommand(state, { ...command, actorId: "corte" }, now.toISOString(), { userId: "worker", role: "corte", name: "Marceneiro" }), /Logística/);
  assert.throws(() => applyCommand(state, { ...command, productDetails: { ...details, woodType: "a".repeat(201) } }), /ficha/);
});
test("fim de fabricação e aprovação são datas distintas e campos ausentes ficam vazios", () => {
  const state = createDemoState(now), order = state.orders.find(o => o.id === "OP-004");
  const result = buildProductPassport(state, order.id, 1, token, false, now.toISOString(), now.getTime());
  assert.equal(result.manufacturedAt, order.stages[4].completedAt);
  assert.equal(result.qualityApprovedAt, null);
  assert.equal(result.details.woodType, "");
  assert.equal(result.training, false);
});
