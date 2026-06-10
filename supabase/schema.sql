-- ─────────────────────────────────────────────────────────────────────────────
-- SLUNEČNICE — Supabase schema
-- Spusť v Supabase SQL editoru (jednou). RLS je zatím otevřené (Fáze 1).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── spots ───────────────────────────────────────────────────────────────────
create table if not exists public.spots (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null default 'planting'
                    check (kind in ('planting', 'water')),
  name            text,
  lat             double precision not null,
  lon             double precision not null,
  status          text not null default 'navrzeno'
                    check (status in ('navrzeno','vhodne','zasazeno','kvete','zaniklo')),
  water_type      text check (water_type in ('tap','fountain','stream')),
  sunflower_count integer not null default 0,
  notes           text,
  photo_paths     text[] not null default '{}',
  created_by      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists spots_kind_idx on public.spots (kind);
create index if not exists spots_status_idx on public.spots (status);

-- ─── sunflowers ──────────────────────────────────────────────────────────────
create table if not exists public.sunflowers (
  id           uuid primary key default gen_random_uuid(),
  spot_id      uuid not null references public.spots(id) on delete cascade,
  index        integer not null,
  name         text,
  message      text,
  named_by     text,
  web_consent  boolean not null default false,
  photo_path   text,
  named_at     timestamptz,
  hidden       boolean not null default false,
  unique (spot_id, index)
);

create index if not exists sunflowers_spot_idx on public.sunflowers (spot_id);

-- ─── waterings ───────────────────────────────────────────────────────────────
create table if not exists public.waterings (
  id            uuid primary key default gen_random_uuid(),
  spot_id       uuid not null references public.spots(id) on delete cascade,
  sunflower_id  uuid references public.sunflowers(id) on delete set null,
  watered_by    text,
  note          text,
  photo_path    text,
  watered_at    timestamptz not null default now(),
  hidden        boolean not null default false
);

create index if not exists waterings_spot_idx on public.waterings (spot_id);
create index if not exists waterings_time_idx on public.waterings (watered_at desc);

-- ─── updated_at trigger on spots ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists spots_touch on public.spots;
create trigger spots_touch before update on public.spots
  for each row execute function public.touch_updated_at();

-- ─── helper: create N empty sunflower slots for a spot ───────────────────────
-- Idempotentní: vyplní jen chybějící indexy 1..n.
create or replace function public.ensure_sunflower_slots(p_spot uuid, p_count int)
returns void language plpgsql set search_path = '' as $$
declare i int;
begin
  for i in 1..p_count loop
    insert into public.sunflowers (spot_id, index)
    values (p_spot, i)
    on conflict (spot_id, index) do nothing;
  end loop;
end; $$;

-- ─── RLS — Fáze 1: plně otevřeno (sázení děláme jen my přes token v appce) ───
-- Pozn.: token na /scout/[token] je gate v Next.js, ne v DB. Pro veřejné
-- zápisy (zálivka, jméno) je to záměrně otevřené + moderace přes hidden.
alter table public.spots enable row level security;
alter table public.sunflowers enable row level security;
alter table public.waterings enable row level security;

-- spots: open writes for now (crew uses the anon client). FÁZE 2: zamknout na
-- read-only pro anon a crew zápisy přesunout na server route se service-role.
drop policy if exists spots_all on public.spots;
create policy spots_all on public.spots for all using (true) with check (true);

-- sunflowers: read-only from the public (naming flow not in use)
drop policy if exists sunflowers_all on public.sunflowers;
drop policy if exists sunflowers_select on public.sunflowers;
create policy sunflowers_select on public.sunflowers for select using (true);

-- waterings: public can read + insert only (no update/delete)
drop policy if exists waterings_all on public.waterings;
drop policy if exists waterings_select on public.waterings;
drop policy if exists waterings_insert on public.waterings;
create policy waterings_select on public.waterings for select using (true);
create policy waterings_insert on public.waterings for insert with check (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Live updates on the public map (spots appear / waterings tick in real time).
alter publication supabase_realtime add table public.spots;
alter publication supabase_realtime add table public.waterings;

-- ─── Storage bucket ──────────────────────────────────────────────────────────
-- Vytvoř bucket "slunecnice-photos" (public) v Storage UI, nebo:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slunecnice-photos', 'slunecnice-photos', true, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "slunecnice photos read" on storage.objects;
create policy "slunecnice photos read" on storage.objects
  for select using (bucket_id = 'slunecnice-photos');

drop policy if exists "slunecnice photos write" on storage.objects;
create policy "slunecnice photos write" on storage.objects
  for insert with check (bucket_id = 'slunecnice-photos');
