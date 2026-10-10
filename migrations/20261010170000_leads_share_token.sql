alter table public.leads add column if not exists share_token text;
create unique index if not exists leads_share_token_uidx
  on public.leads (share_token)
  where share_token is not null;
