-- Identidade permanente de cada unidade. O acesso público passa pela API do servidor.
begin;

create table public.mobilog_product_passports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.mobilog_workspaces(id) on delete cascade,
  order_id text not null check (char_length(order_id) between 1 and 100),
  unit_number integer not null check (unit_number between 1 and 50),
  created_at timestamptz not null default now(),
  unique (workspace_id, order_id, unit_number)
);
alter table public.mobilog_product_passports enable row level security;
create policy mobilog_passports_no_browser_access on public.mobilog_product_passports
  for all to anon, authenticated using (false) with check (false);
revoke all on public.mobilog_product_passports from public, anon, authenticated;
grant all on public.mobilog_product_passports to service_role;

-- Somente o servidor já autorizado grava o estado. A mesma transação cria as
-- identidades novas, sem trocar os QR Codes das unidades existentes.
create function mobilog_private.sync_product_passports()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.mobilog_product_passports(workspace_id, order_id, unit_number)
  select new.workspace_id, item->>'id', unit_number
  from jsonb_array_elements(coalesce(new.state->'orders', '[]'::jsonb)) item
  cross join lateral generate_series(1, least(50, greatest(1, (item->>'quantity')::integer))) unit_number
  on conflict (workspace_id, order_id, unit_number) do nothing;
  return new;
end;
$$;
revoke all on function mobilog_private.sync_product_passports() from public, anon, authenticated;
grant execute on function mobilog_private.sync_product_passports() to service_role;
create trigger mobilog_sync_product_passports
after insert or update of state on public.mobilog_states
for each row execute function mobilog_private.sync_product_passports();

insert into public.mobilog_product_passports(workspace_id, order_id, unit_number)
select s.workspace_id, item->>'id', unit_number
from public.mobilog_states s
cross join lateral jsonb_array_elements(coalesce(s.state->'orders', '[]'::jsonb)) item
cross join lateral generate_series(1, least(50, greatest(1, (item->>'quantity')::integer))) unit_number
on conflict (workspace_id, order_id, unit_number) do nothing;

commit;
