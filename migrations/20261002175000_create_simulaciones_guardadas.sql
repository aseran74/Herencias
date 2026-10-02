create table if not exists public.simulaciones_guardadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 2 and 100),
  input_json jsonb not null check (jsonb_typeof(input_json) = 'object'),
  paso smallint not null default 11 check (paso between 1 and 11),
  version smallint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists simulaciones_guardadas_user_updated_idx
  on public.simulaciones_guardadas (user_id, updated_at desc);

drop trigger if exists simulaciones_guardadas_updated_at on public.simulaciones_guardadas;
create trigger simulaciones_guardadas_updated_at
  before update on public.simulaciones_guardadas
  for each row execute function system.update_updated_at();

alter table public.simulaciones_guardadas enable row level security;

drop policy if exists "simulaciones propias leer" on public.simulaciones_guardadas;
create policy "simulaciones propias leer" on public.simulaciones_guardadas
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "simulaciones propias crear" on public.simulaciones_guardadas;
create policy "simulaciones propias crear" on public.simulaciones_guardadas
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "simulaciones propias renombrar" on public.simulaciones_guardadas;
create policy "simulaciones propias renombrar" on public.simulaciones_guardadas
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "simulaciones propias eliminar" on public.simulaciones_guardadas;
create policy "simulaciones propias eliminar" on public.simulaciones_guardadas
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.simulaciones_guardadas from anon, authenticated;
grant select, insert, delete on public.simulaciones_guardadas to authenticated;
grant update (titulo) on public.simulaciones_guardadas to authenticated;
