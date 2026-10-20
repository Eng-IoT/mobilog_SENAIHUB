import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCommand, availableQuantity, createDemoState, validateMaintenanceRevision } from "../lib/production.ts";
import { buildProductPassport } from "../lib/product-passport.ts";

const now = "2026-10-19T21:00:00.000Z";
const teacher = { userId: "teacher", name: "Docente", role: "admin" };
const logistics = { userId: "logistics", name: "Logística", role: "logistica" };
let serial = 0;
const command = (state, value) => ({ actorId: "gestao", eventId: "maintenance-" + (++serial), generation: state.generation || 0, ...value });
const perform = (state, value, identity = teacher) => applyCommand(state, command(state, value), now, identity).state;
const clear = (state, resetStock = true) => perform(state, { kind: "reset-production", confirmation: "LIMPAR", resetStock });
const createOrder = state => perform(state, { kind: "create-order", order: { name: "Mesa nova", client: "Destino didático", type: "mesa", quantity: 1, due: "2026-12-01", priority: "normal", notes: "" } });
const token = "abc12345-0000-4000-8000-000000000001";

test("a exclusão libera reservas sem devolver o material já consumido", () => {
  const initial = createDemoState(new Date(now));
  const available = availableQuantity(initial, "screws");
  const result = perform(initial, { kind: "delete-order", orderId: "OP-001", confirmation: "OP-001" }, logistics);
  assert.equal(result.orders.length, initial.orders.length - 1);
  assert.equal(result.orders.some(o => o.id === "OP-001"), false);
  assert.deepEqual(result.materials, initial.materials);
  assert.equal(availableQuantity(result, "screws"), available + 24);
  assert.equal(result.events.some(e => e.orderId === "OP-001"), false);
  assert.deepEqual(result.recovery.data.orders, initial.orders);
  assert.equal(initial.orders.some(o => o.id === "OP-001"), true);
});
test("reset com estoque zerado limpa o fluxo e mantém o catálogo de materiais", () => {
  const initial = createDemoState(new Date(now)), result = clear(initial);
  assert.deepEqual(result.orders, []); assert.deepEqual(result.events, []);
  assert.deepEqual(result.materials, initial.materials.map(m => ({ ...m, stock: 0 })));
  assert.equal(result.generation, 1);
  assert.deepEqual(result.recovery.data, { orders: initial.orders, materials: initial.materials, events: initial.events });
});
test("reset sem zerar estoque preserva saldos e libera as reservas", () => {
  const initial = createDemoState(new Date(now)), result = clear(initial, false);
  assert.deepEqual(result.materials, initial.materials);
  assert.equal(availableQuantity(result, "screws"), initial.materials.find(m => m.id === "screws").stock);
});
test("reset e restauração são restritos ao docente e cada ação exige confirmação exata", () => {
  const initial = createDemoState(new Date(now));
  for (const identity of [logistics, { userId: "worker", name: "Marceneiro", role: "corte" }]) {
    assert.throws(() => perform(initial, { kind: "reset-production", confirmation: "LIMPAR", resetStock: true }, identity), /docente|sua função/);
    assert.throws(() => perform(initial, { kind: "restore-production", confirmation: "RESTAURAR" }, identity), /docente|sua função/);
  }
  assert.throws(() => perform(initial, { kind: "delete-order", orderId: "OP-001", confirmation: "OP-002" }), /confirmação/);
  assert.throws(() => perform(initial, { kind: "reset-production", confirmation: "limpar", resetStock: true }), /confirmação/);
  assert.throws(() => perform(initial, { kind: "reset-production", confirmation: "LIMPAR" }), /saldos/);
  assert.throws(() => perform(initial, { kind: "delete-order", orderId: "OP-001", confirmation: "OP-001", actorId: "corte" }, { userId: "worker", name: "Marceneiro", role: "corte" }), /Logística/);
});
test("exclusão e reset não reutilizam números de pedidos ou QR antigos", () => {
  const initial = createDemoState(new Date(now));
  const afterDelete = createOrder(perform(initial, { kind: "delete-order", orderId: "OP-006", confirmation: "OP-006" }));
  assert.equal(afterDelete.orders.at(-1).id, "OP-007");
  const afterReset = createOrder(clear(afterDelete));
  assert.equal(afterReset.orders[0].id, "OP-008");
  assert.equal(buildProductPassport(afterReset, "OP-001", 1, token, true, now), null);
});
test("a restauração recupera produto, etapas, estoque e identidade sem regredir a numeração", () => {
  const initial = createDemoState(new Date(now));
  const before = buildProductPassport(initial, "OP-001", 1, token, true, now);
  let state = createOrder(clear(initial));
  state = perform(state, { kind: "restore-production", confirmation: "RESTAURAR" });
  assert.deepEqual(state.orders, initial.orders); assert.deepEqual(state.materials, initial.materials); assert.deepEqual(state.events, initial.events);
  assert.equal(state.generation, 2);
  assert.equal(buildProductPassport(state, "OP-001", 1, token, true, now).serial, before.serial);
  assert.equal(createOrder(state).orders.at(-1).id, "OP-008");
});
test("registros antigos não recriam pedidos nem alteram estoque depois do reset", () => {
  const initial = createDemoState(new Date(now)), state = clear(initial);
  const old = command(initial, { kind: "stock-receive", materialId: "mdf", quantity: 5, reason: "Tentativa antiga" });
  assert.throws(() => applyCommand(state, old, now, logistics), error => error.status === 410);
  const oldCreate = { ...old, kind: "create-order", order: { name: "Mesa antiga", client: "Destino", type: "mesa", quantity: 1, due: "2026-12-01", notes: "", priority: "normal" } };
  assert.throws(() => applyCommand(state, oldCreate, now, logistics), error => error.status === 410);
  const legacy = { ...old }; delete legacy.generation;
  assert.throws(() => applyCommand(state, legacy, now, logistics), error => error.status === 410);
  assert.deepEqual(state.orders, []); assert.ok(state.materials.every(m => m.stock === 0));
});
test("a repetição de um reset confirmado é idempotente e não troca a recuperação", () => {
  const initial = createDemoState(new Date(now));
  const op = command(initial, { kind: "reset-production", confirmation: "LIMPAR", resetStock: true });
  const first = applyCommand(initial, op, now, teacher);
  const retry = applyCommand(first.state, op, now, teacher);
  assert.equal(retry.duplicate, true); assert.deepEqual(retry.state, first.state);
  assert.throws(() => applyCommand(first.state, { ...op, resetStock: false }, now, teacher), /outra ação/);
});
test("a confirmação com revisão antiga é recusada e a produção já limpa não perde a cópia", () => {
  assert.throws(() => validateMaintenanceRevision({ kind: "reset-production", expectedRevision: 3 }, 4), error => error.status === 409);
  assert.throws(() => validateMaintenanceRevision({ kind: "delete-order" }, 4), error => error.status === 409);
  assert.doesNotThrow(() => validateMaintenanceRevision({ kind: "reset-production", expectedRevision: 4 }, 4));
  const empty = clear(createDemoState(new Date(now)));
  const backup = structuredClone(empty.recovery);
  assert.throws(() => clear(empty), /já está limpa/);
  assert.deepEqual(empty.recovery, backup);
});
test("a recuperação guarda somente uma cópia e não vaza na ficha pública", () => {
  const initial = createDemoState(new Date(now));
  initial.orders[0].notes = "Nota privada na cópia";
  const deleted = perform(initial, { kind: "delete-order", orderId: "OP-001", confirmation: "OP-001" });
  const next = perform(deleted, { kind: "delete-order", orderId: "OP-002", confirmation: "OP-002" });
  assert.equal("recovery" in next.recovery.data, false);
  assert.ok(!JSON.stringify(buildProductPassport(next, "OP-003", 1, token, true, now)).includes("Nota privada na cópia"));
});
