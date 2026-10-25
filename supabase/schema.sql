-- ============================================================
-- WA Activity Monitor — Supabase schema (OPTIONAL)
-- Run this in the Supabase SQL editor ONLY if you want cloud sync.
-- Without it, the app runs fully in local mode (localStorage).
--
-- No WhatsApp data is involved: these tables store only contacts the
-- user added and status events the user logged manually (or demo rows
-- flagged source = 'demo').
-- ============================================================

-- Contacts added by the user, with a consent indicator.
create table if not exists public.contacts (
  id text primary key,
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null default '',
  consent_status text not null default 'pending'
    check (consent_status in ('granted', 'pending', 'revoked')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Manually logged (or demo) status events.
create table if not exists public.activity_events (
  id text primary key,
  owner_id uuid references auth.users (id) on delete cascade,
  contact_id text not null references public.contacts (id) on delete cascade,
  type text not null check (type in ('online', 'offline')),
  observed_at timestamptz not null,
  source text not null default 'manual'
    check (source in ('manual', 'demo')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists activity_events_contact_time_idx
  on public.activity_events (contact_id, observed_at);

-- ------------------------------------------------------------
-- Row Level Security: each user sees only their own rows.
-- (Enable RLS; policies below are owner-based.)
-- ------------------------------------------------------------
alter table public.contacts enable row level security;
alter table public.activity_events enable row level security;

create policy "contacts: owner can do everything"
  on public.contacts
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "activity_events: owner can do everything"
  on public.activity_events
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- NOTE: the app inserts rows without owner_id from the client; if you
-- enable the policies above, set owner_id from auth.uid() — either via a
-- database trigger or by passing owner_id in the insert. Example trigger:
--
--   create or replace function public.set_owner()
--   returns trigger as $$
--   begin
--     new.owner_id := auth.uid();
--     return new;
--   end;
--   $$ language plpgsql security definer;
--
--   create trigger contacts_set_owner before insert on public.contacts
--     for each row execute function public.set_owner();
--   create trigger events_set_owner before insert on public.activity_events
--     for each row execute function public.set_owner();
--
-- Until you add the trigger (or pass owner_id), inserts from an
-- authenticated client will fail RLS and the app shows the error while
-- keeping your local data intact.
