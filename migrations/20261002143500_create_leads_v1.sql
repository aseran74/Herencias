create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  despacho_id text not null references public.despachos (id),
  created_at timestamptz not null default now(),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 120),
  email text not null check (char_length(btrim(email)) between 3 and 200),
  telefono text not null check (char_length(btrim(telefono)) between 6 and 32),
  consentimiento_rgpd boolean not null check (consentimiento_rgpd),
  consentimiento_at timestamptz not null default now(),
  estado_resultado text not null check (
    estado_resultado in ('ok', 'ok_con_avisos', 'revision_obligatoria', 'error')
  ),
  input_json jsonb not null check (jsonb_typeof(input_json) = 'object'),
  resultado_json jsonb not null check (jsonb_typeof(resultado_json) = 'object')
);

create index if not exists leads_despacho_created_idx
  on public.leads (despacho_id, created_at desc);

alter table public.leads enable row level security;

-- El visitante usa POST /api/leads. Solo el servidor con clave administrativa
-- accede a esta tabla; no hay acceso directo desde el navegador.
revoke all on public.leads from anon, authenticated;
