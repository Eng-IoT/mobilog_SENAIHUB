import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
test("PostgreSQL: esquema, isolamento, permissões e atualização concorrente",async t=>{
 const db=new PGlite();
 try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;");
  const one="00000000-0000-0000-0000-000000000001",two="00000000-0000-0000-0000-000000000002",three="00000000-0000-0000-0000-000000000003";
  await db.query("insert into auth.users(id)values($1),($2),($3)",[one,two,three]);
  await db.exec(await readFile(new URL("../database/01_estrutura.sql",import.meta.url),"utf8"));
  let id;
  await t.test("o servidor cria equipe, associação, estado e código em uma transação",async()=>{
   await db.exec("set role service_role");
   const result=await db.query("select public.mobilog_create_workspace($1,$2,$3,$4::jsonb,$5,true) as id",[one,"Instrutor","Turma de teste",JSON.stringify({orders:[],materials:[],events:[]}),"a".repeat(64)]);
   id=result.rows[0].id;assert.ok(id);
   await db.exec("reset role");assert.equal((await db.query("select count(*)::int as n from public.mobilog_states")).rows[0].n,1);
  });
  async function asUser(uid){await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec("set role authenticated");}
  await t.test("um integrante consulta o estado e somente sua associação",async()=>{
   await asUser(one);assert.equal((await db.query("select * from public.mobilog_states")).rows.length,1);assert.equal((await db.query("select * from public.mobilog_memberships")).rows.length,1);
  });
  await t.test("uma conta externa não enxerga os registros de outra equipe",async()=>{
   await asUser(three);assert.equal((await db.query("select * from public.mobilog_states")).rows.length,0);assert.equal((await db.query("select * from public.mobilog_workspaces")).rows.length,0);
  });
  await t.test("o navegador não altera o estado diretamente nem promove a própria função",async()=>{
   await asUser(one);await assert.rejects(db.query("update public.mobilog_states set revision=999"),/permission denied/);await assert.rejects(db.query("update public.mobilog_memberships set role='admin'"),/permission denied/);
  });
  await t.test("funções privilegiadas e códigos não são acessíveis ao navegador",async()=>{
   await asUser(one);await assert.rejects(db.query("select public.mobilog_rotate_code($1,$2)",[id,"b".repeat(64)]),/permission denied/);
   await assert.rejects(db.query("select * from mobilog_private.join_codes"),/permission denied/);
  });
  await t.test("solicitar acesso não libera os dados antes da aprovação",async()=>{
   await db.exec("reset role; set role service_role");
   const joined=await db.query("select public.mobilog_join_workspace($1,$2,$3) as id",[two,"Aluno","a".repeat(64)]);
   assert.equal(joined.rows[0].id,id);
   await asUser(two);assert.equal((await db.query("select * from public.mobilog_memberships")).rows.length,1);assert.equal((await db.query("select * from public.mobilog_states")).rows.length,0);
   await db.exec("reset role; set role service_role");await db.query("update public.mobilog_memberships set active=true,role='corte' where user_id=$1",[two]);
   await asUser(two);assert.equal((await db.query("select * from public.mobilog_states")).rows.length,1);
  });
  await t.test("a revisão impede uma gravação feita sobre dados desatualizados",async()=>{
   await db.exec("reset role; set role service_role");
   const first=await db.query("update public.mobilog_states set revision=revision+1 where workspace_id=$1 and revision=0 returning revision",[id]);
   const stale=await db.query("update public.mobilog_states set revision=revision+1 where workspace_id=$1 and revision=0 returning revision",[id]);
   assert.equal(Number(first.rows[0].revision),1);assert.equal(stale.rows.length,0);
  });
  await t.test("uma criação inválida não deixa equipe incompleta",async()=>{
   await db.exec("reset role; set role service_role");
   await assert.rejects(db.query("select public.mobilog_create_workspace($1,$2,$3,$4::jsonb,$5,true)",[one,"Instrutor","Equipe inválida","[]","c".repeat(64)]));
   await db.exec("reset role");assert.equal((await db.query("select count(*)::int as n from public.mobilog_workspaces")).rows[0].n,1);
  });
 }finally{await db.close();}
});
