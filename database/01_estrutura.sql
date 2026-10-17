-- MobiLog R01 - instalação em um projeto Supabase exclusivo.
-- Não contém senhas, contas prontas nem dados de clientes.
begin;

create schema if not exists mobilog_private;

create table public.mobilog_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  owner_user_id uuid not null references auth.users(id),
  training boolean not null default true,
  created_at timestamptz not null default now()
);
create index mobilog_workspaces_owner_idx on public.mobilog_workspaces(owner_user_id);

create table public.mobilog_memberships (
  workspace_id uuid not null references public.mobilog_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 100),
  role text not null default 'viewer' check (role in ('admin','logistica','corte','montagem','acabamento','qualidade','viewer')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);
create index mobilog_memberships_user_idx on public.mobilog_memberships(user_id,active,workspace_id);

create table public.mobilog_states (
  workspace_id uuid primary key references public.mobilog_workspaces(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);
create table mobilog_private.join_codes (
  workspace_id uuid primary key references public.mobilog_workspaces(id) on delete cascade,
  code_hash text unique not null check (char_length(code_hash) = 64),
  updated_at timestamptz not null default now()
);

alter table public.mobilog_workspaces enable row level security;
alter table public.mobilog_memberships enable row level security;
alter table public.mobilog_states enable row level security;
alter table mobilog_private.join_codes enable row level security;
create policy mobilog_join_codes_no_browser_access on mobilog_private.join_codes
  for all to anon,authenticated using (false) with check (false);

revoke all on public.mobilog_workspaces, public.mobilog_memberships, public.mobilog_states from anon, authenticated;
revoke all on mobilog_private.join_codes from public, anon, authenticated;
grant select on public.mobilog_workspaces, public.mobilog_memberships, public.mobilog_states to authenticated;
grant all on public.mobilog_workspaces, public.mobilog_memberships, public.mobilog_states to service_role;
grant usage on schema mobilog_private to service_role;
grant all on mobilog_private.join_codes to service_role;

create policy mobilog_own_membership_read on public.mobilog_memberships
  for select to authenticated using (user_id = (select auth.uid()));

create policy mobilog_workspace_member_read on public.mobilog_workspaces
  for select to authenticated using (
    owner_user_id = (select auth.uid()) or
    exists (select 1 from public.mobilog_memberships m
            where m.workspace_id = mobilog_workspaces.id and m.user_id = (select auth.uid()) and m.active)
  );
create policy mobilog_state_member_read on public.mobilog_states
  for select to authenticated using (
    exists (select 1 from public.mobilog_memberships m
            where m.workspace_id = mobilog_states.workspace_id and m.user_id = (select auth.uid()) and m.active)
  );

-- Operações atômicas chamadas apenas pelo servidor, após validar a conta.
-- SECURITY INVOKER: não elevam o privilégio de quem chama.
create function public.mobilog_create_workspace(
  p_owner uuid, p_owner_name text, p_name text, p_state jsonb,
  p_invite_hash text, p_training boolean default true
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.mobilog_workspaces(name,owner_user_id,training)
    values (p_name,p_owner,p_training) returning id into v_id;
  insert into public.mobilog_memberships(workspace_id,user_id,display_name,role,active)
    values (v_id,p_owner,p_owner_name,'admin',true);
  insert into public.mobilog_states(workspace_id,state) values (v_id,p_state);
  insert into mobilog_private.join_codes(workspace_id,code_hash) values(v_id,p_invite_hash);
  return v_id;
end;
$$;

create function public.mobilog_join_workspace(
  p_user uuid, p_name text, p_invite_hash text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  select workspace_id into v_id from mobilog_private.join_codes where code_hash=p_invite_hash;
  if v_id is null then raise exception 'Código de equipe inválido.'; end if;
  insert into public.mobilog_memberships(workspace_id,user_id,display_name,role,active)
    values(v_id,p_user,p_name,'viewer',false)
    on conflict(workspace_id,user_id) do nothing;
  return v_id;
end;
$$;

create function public.mobilog_rotate_code(p_workspace uuid,p_hash text)
returns void language sql security invoker set search_path = '' as $$
  update mobilog_private.join_codes set code_hash=p_hash,updated_at=now() where workspace_id=p_workspace;
$$;

revoke all on function public.mobilog_create_workspace(uuid,text,text,jsonb,text,boolean) from public,anon,authenticated;
revoke all on function public.mobilog_join_workspace(uuid,text,text) from public,anon,authenticated;
revoke all on function public.mobilog_rotate_code(uuid,text) from public,anon,authenticated;
grant execute on function public.mobilog_create_workspace(uuid,text,text,jsonb,text,boolean) to service_role;
grant execute on function public.mobilog_join_workspace(uuid,text,text) to service_role;
grant execute on function public.mobilog_rotate_code(uuid,text) to service_role;

-- A leitura em tempo real continua sujeita às políticas de associação à equipe.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='mobilog_states') then
      alter publication supabase_realtime add table public.mobilog_states;
    end if;
  end if;
end;
$$;

commit;
