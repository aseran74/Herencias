alter table public.leads add column if not exists urgente boolean not null default false;
alter table public.leads add column if not exists motivo_urgencia text not null default '';
alter table public.leads add column if not exists texto_urgencia text not null default '';
