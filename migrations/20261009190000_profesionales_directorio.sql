create table if not exists public.profesionales (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(id) between 3 and 64),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 160),
  tipo text not null check (tipo in ('abogado', 'notaria')),
  localidad text not null check (char_length(btrim(localidad)) between 2 and 120),
  provincia text not null check (char_length(btrim(provincia)) between 2 and 120),
  telefono text not null default '',
  email text not null default '',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists profesionales_tipo_activo_idx
  on public.profesionales (tipo, activo, provincia, localidad);

alter table public.profesionales enable row level security;
revoke all on public.profesionales from anon, authenticated;

alter table public.leads add column if not exists profesional_id text;
alter table public.leads add column if not exists otorgante_dni text not null default '';
alter table public.leads add column if not exists otorgante_domicilio text not null default '';
alter table public.leads add column if not exists otorgante_localidad text not null default '';

insert into public.profesionales (id, nombre, tipo, localidad, provincia, telefono, email, activo) values
  ('ab-madrid-1', 'Demo Abogados Soler (Madrid)', 'abogado', 'Madrid', 'Madrid', '910000001', 'madrid1@demo-abogados.es', true),
  ('ab-madrid-2', 'Demo Herencias Centro (Madrid)', 'abogado', 'Madrid', 'Madrid', '910000002', 'madrid2@demo-abogados.es', true),
  ('ab-barcelona-1', 'Demo Sucesiones Eixample (Barcelona)', 'abogado', 'Barcelona', 'Barcelona', '930000001', 'bcn1@demo-abogados.es', true),
  ('ab-barcelona-2', 'Demo Bufete Diagonal (Barcelona)', 'abogado', 'Barcelona', 'Barcelona', '930000002', 'bcn2@demo-abogados.es', true),
  ('ab-valencia-1', 'Demo Abogados Turia (Valencia)', 'abogado', 'Valencia', 'Valencia', '960000001', 'vlc1@demo-abogados.es', true),
  ('ab-valencia-2', 'Demo Herencias Colón (Valencia)', 'abogado', 'Valencia', 'Valencia', '960000002', 'vlc2@demo-abogados.es', true),
  ('ab-sevilla-1', 'Demo Bufete Triana (Sevilla)', 'abogado', 'Sevilla', 'Sevilla', '950000001', 'sev1@demo-abogados.es', true),
  ('ab-sevilla-2', 'Demo Sucesiones Nervión (Sevilla)', 'abogado', 'Sevilla', 'Sevilla', '950000002', 'sev2@demo-abogados.es', true),
  ('ab-bilbao-1', 'Demo Abogados Abando (Bilbao)', 'abogado', 'Bilbao', 'Bizkaia', '940000001', 'bio1@demo-abogados.es', true),
  ('ab-zaragoza-1', 'Demo Herencias Pilar (Zaragoza)', 'abogado', 'Zaragoza', 'Zaragoza', '970000001', 'zgz1@demo-abogados.es', true),
  ('ab-malaga-1', 'Demo Bufete Larios (Málaga)', 'abogado', 'Málaga', 'Málaga', '950000011', 'aga1@demo-abogados.es', true),
  ('ab-murcia-1', 'Demo Sucesiones Segura (Murcia)', 'abogado', 'Murcia', 'Murcia', '960000011', 'mu1@demo-abogados.es', true),
  ('ab-palma-1', 'Demo Abogados Born (Palma)', 'abogado', 'Palma', 'Illes Balears', '970000011', 'pm1@demo-abogados.es', true),
  ('ab-coruna-1', 'Demo Herencias Riazor (A Coruña)', 'abogado', 'A Coruña', 'A Coruña', '980000001', 'lc1@demo-abogados.es', true),
  ('ab-granada-1', 'Demo Bufete Alhambra (Granada)', 'abogado', 'Granada', 'Granada', '950000021', 'gr1@demo-abogados.es', true),
  ('ab-valladolid-1', 'Demo Sucesiones Campo Grande (Valladolid)', 'abogado', 'Valladolid', 'Valladolid', '980000011', 'va1@demo-abogados.es', true),
  ('ab-alicante-1', 'Demo Abogados Explanada (Alicante)', 'abogado', 'Alicante', 'Alicante', '960000021', 'alc1@demo-abogados.es', true),
  ('ab-cordoba-1', 'Demo Herencias Mezquita (Córdoba)', 'abogado', 'Córdoba', 'Córdoba', '950000031', 'co1@demo-abogados.es', true),
  ('ab-oviedo-1', 'Demo Bufete Fontán (Oviedo)', 'abogado', 'Oviedo', 'Asturias', '980000021', 'ovd1@demo-abogados.es', true),
  ('ab-pamplona-1', 'Demo Sucesiones Castillo (Pamplona)', 'abogado', 'Pamplona', 'Navarra', '940000011', 'na1@demo-abogados.es', true),
  ('no-madrid-1', 'Notaría Demo Serrano (Madrid)', 'notaria', 'Madrid', 'Madrid', '910100001', 'madrid1@demo-notaria.es', true),
  ('no-madrid-2', 'Notaría Demo Retiro (Madrid)', 'notaria', 'Madrid', 'Madrid', '910100002', 'madrid2@demo-notaria.es', true),
  ('no-barcelona-1', 'Notaría Demo Rambla (Barcelona)', 'notaria', 'Barcelona', 'Barcelona', '930100001', 'bcn1@demo-notaria.es', true),
  ('no-barcelona-2', 'Notaría Demo Gràcia (Barcelona)', 'notaria', 'Barcelona', 'Barcelona', '930100002', 'bcn2@demo-notaria.es', true),
  ('no-valencia-1', 'Notaría Demo Ayuntamiento (Valencia)', 'notaria', 'Valencia', 'Valencia', '960100001', 'vlc1@demo-notaria.es', true),
  ('no-valencia-2', 'Notaría Demo Ruzafa (Valencia)', 'notaria', 'Valencia', 'Valencia', '960100002', 'vlc2@demo-notaria.es', true),
  ('no-sevilla-1', 'Notaría Demo Cathedral (Sevilla)', 'notaria', 'Sevilla', 'Sevilla', '950100001', 'sev1@demo-notaria.es', true),
  ('no-sevilla-2', 'Notaría Demo Macarena (Sevilla)', 'notaria', 'Sevilla', 'Sevilla', '950100002', 'sev2@demo-notaria.es', true),
  ('no-bilbao-1', 'Notaría Demo Gran Vía (Bilbao)', 'notaria', 'Bilbao', 'Bizkaia', '940100001', 'bio1@demo-notaria.es', true),
  ('no-zaragoza-1', 'Notaría Demo Independencia (Zaragoza)', 'notaria', 'Zaragoza', 'Zaragoza', '970100001', 'zgz1@demo-notaria.es', true),
  ('no-malaga-1', 'Notaría Demo Puerto (Málaga)', 'notaria', 'Málaga', 'Málaga', '950100011', 'aga1@demo-notaria.es', true),
  ('no-murcia-1', 'Notaría Demo Trapería (Murcia)', 'notaria', 'Murcia', 'Murcia', '960100011', 'mu1@demo-notaria.es', true),
  ('no-palma-1', 'Notaría Demo Paseo Marítimo (Palma)', 'notaria', 'Palma', 'Illes Balears', '970100011', 'pm1@demo-notaria.es', true),
  ('no-coruna-1', 'Notaría Demo Orzán (A Coruña)', 'notaria', 'A Coruña', 'A Coruña', '980100001', 'lc1@demo-notaria.es', true),
  ('no-granada-1', 'Notaría Demo Reyes Católicos (Granada)', 'notaria', 'Granada', 'Granada', '950100021', 'gr1@demo-notaria.es', true),
  ('no-valladolid-1', 'Notaría Demo Zorrilla (Valladolid)', 'notaria', 'Valladolid', 'Valladolid', '980100011', 'va1@demo-notaria.es', true),
  ('no-alicante-1', 'Notaría Demo Puerto (Alicante)', 'notaria', 'Alicante', 'Alicante', '960100021', 'alc1@demo-notaria.es', true),
  ('no-cordoba-1', 'Notaría Demo Tendillas (Córdoba)', 'notaria', 'Córdoba', 'Córdoba', '950100031', 'co1@demo-notaria.es', true),
  ('no-oviedo-1', 'Notaría Demo Escandalera (Oviedo)', 'notaria', 'Oviedo', 'Asturias', '980100021', 'ovd1@demo-notaria.es', true),
  ('no-pamplona-1', 'Notaría Demo Ensanche (Pamplona)', 'notaria', 'Pamplona', 'Navarra', '940100011', 'na1@demo-notaria.es', true)
on conflict (id) do nothing;
