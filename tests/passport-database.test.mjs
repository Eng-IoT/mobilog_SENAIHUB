import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("PostgreSQL: QR permanente por peça e tabela protegida", async t => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;");
    await db.exec(await readFile(new URL("../database/01_estrutura.sql", import.meta.url), "utf8"));
    const owner = "00000000-0000-0000-0000-000000000001";
    await db.query("insert into auth.users(id) values($1)", [owner]);
    const state = { orders: [{ id: "OP-001", quantity: 2 }], materials: [], events: [] };
    const first = (await db.query("select public.mobilog_create_workspace($1,'Docente','Equipe um',$2::jsonb,$3,true) as id", [owner, JSON.stringify(state), "a".repeat(64)])).rows[0].id;
    await db.exec(await readFile(new URL("../database/02_rastreabilidade.sql", import.meta.url), "utf8"));
    let identities;
    await t.test("pedidos existentes recebem uma identidade aleatória para cada unidade", async () => {
      identities = (await db.query("select id,unit_number from public.mobilog_product_passports where workspace_id=$1 order by unit_number", [first])).rows;
      assert.equal(identities.length, 2); assert.notEqual(identities[0].id, identities[1].id);
    });
    await t.test("novas revisões não trocam os QR Codes já impressos", async () => {
      await db.exec("set role service_role");
      await db.query("update public.mobilog_states set state=$1::jsonb,revision=revision+1 where workspace_id=$2", [JSON.stringify(state), first]);
      assert.deepEqual((await db.query("select id,unit_number from public.mobilog_product_passports where workspace_id=$1 order by unit_number", [first])).rows, identities);
    });
    await t.test("novo pedido e outra equipe com mesmo número recebem identidades próprias", async () => {
      const second = (await db.query("select public.mobilog_create_workspace($1,'Docente','Equipe dois',$2::jsonb,$3,true) as id", [owner, JSON.stringify(state), "b".repeat(64)])).rows[0].id;
      const ids = (await db.query("select id from public.mobilog_product_passports where workspace_id=$1", [second])).rows;
      assert.equal(ids.length, 2); assert.ok(!ids.some(item => identities.some(first => first.id === item.id)));
      const next = { ...state, orders: [...state.orders, { id: "OP-002", quantity: 1 }] };
      await db.query("update public.mobilog_states set state=$1::jsonb where workspace_id=$2", [JSON.stringify(next), first]);
      assert.equal((await db.query("select count(*)::int as n from public.mobilog_product_passports where workspace_id=$1", [first])).rows[0].n, 3);
    });
    await t.test("visitantes e contas autenticadas não listam nem alteram os identificadores", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec("reset role; set role " + role);
        await assert.rejects(db.query("select * from public.mobilog_product_passports"), /permission denied/);
        await assert.rejects(db.query("insert into public.mobilog_product_passports(workspace_id,order_id,unit_number) values($1,'OP-999',1)", [first]), /permission denied/);
        await assert.rejects(db.query("select mobilog_private.sync_product_passports()"), /permission denied/);
      }
    });
  } finally { await db.close(); }
});
