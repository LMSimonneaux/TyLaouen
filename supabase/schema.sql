-- TyLaouen — schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor > New query > Run).
-- Sans authentification : l'app utilise la clé "anon" et un accès partagé par lien.

-- =========================================================
-- Tables
-- =========================================================

create table if not exists houses (
  id            text primary key,
  name          text not null,
  capacity      int  not null default 0 check (capacity >= 0),
  color         text not null default '#888888',
  sort_order    int  not null default 0,
  wifi_network  text,                     -- nom du réseau wifi (SSID)
  wifi_password text,                     -- mot de passe wifi (copiable seul)
  info          text                      -- autres infos pratiques : codes, consignes…
);

-- Migration douce pour les bases créées avant ces champs
alter table houses add column if not exists wifi_network text;
alter table houses add column if not exists wifi_password text;
alter table houses add column if not exists info text;

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null default gen_random_uuid(), -- regroupe une résa multi-maisons
  house_id    text not null references houses(id) on delete cascade,
  guest_name  text not null,
  start_date  date not null,            -- arrivée (jour inclus)
  end_date    date not null,            -- départ (matin du départ, jour exclu)
  occupants   int  not null default 1 check (occupants >= 1),
  note        text,
  created_at  timestamptz not null default now(),
  check (end_date > start_date)
);

create index if not exists bookings_house_dates_idx
  on bookings (house_id, start_date, end_date);

-- =========================================================
-- Seed des 3 maisons (capacités modifiables ensuite dans l'app)
-- =========================================================

insert into houses (id, name, capacity, color, sort_order) values
  ('tylaouen',    'TyLaouen',    8, '#c2410c', 0),
  ('grand-penty', 'Grand Penty', 6, '#0f766e', 1),
  ('petit-penty', 'Petit Penty', 4, '#7c3aed', 2)
on conflict (id) do nothing;

-- =========================================================
-- Row Level Security : accès public (famille, lien partagé)
-- =========================================================

alter table houses   enable row level security;
alter table bookings enable row level security;

drop policy if exists "houses_select" on houses;
drop policy if exists "houses_update" on houses;
drop policy if exists "bookings_all"  on bookings;

create policy "houses_select" on houses
  for select using (true);

create policy "houses_update" on houses
  for update using (true) with check (true);

create policy "bookings_all" on bookings
  for all using (true) with check (true);

-- =========================================================
-- Temps réel (pour voir les créneaux des autres en direct)
-- Idempotent : on n'ajoute la table que si elle n'y est pas déjà.
-- =========================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table bookings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'houses'
  ) then
    alter publication supabase_realtime add table houses;
  end if;
end $$;
