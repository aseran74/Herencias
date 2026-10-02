create table public.despachos (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(id) between 3 and 64),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 120),
  created_at timestamptz not null default now()
);

create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  despacho_id text not null references public.despachos (id),
  created_at timestamptz not null default now(),
  contacto jsonb not null,
  expediente jsonb not null,
  resultado jsonb not null,
  constraint consultas_contacto_objeto check (jsonb_typeof(contacto) = 'object'),
  constraint consultas_expediente_objeto check (jsonb_typeof(expediente) = 'object'),
  constraint consultas_resultado_objeto check (jsonb_typeof(resultado) = 'object')
);

create index consultas_despacho_created_idx
  on public.consultas (despacho_id, created_at desc);

alter table public.despachos enable row level security;
alter table public.consultas enable row level security;

revoke all on public.despachos from anon, authenticated;
revoke all on public.consultas from anon, authenticated;

insert into public.despachos (id, nombre)
values ('despacho-demo', 'Despacho demo');
