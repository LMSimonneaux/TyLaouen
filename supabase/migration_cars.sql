-- Migration : voitures (Peugeot 206, Mercedes) + réservations + temps réel
-- À exécuter dans Supabase SQL Editor. Sans danger même si déjà appliqué.

-- 1) Tables
create table if not exists cars (
  id         text primary key,
  name       text not null,
  status     text not null default 'fonctionnelle'
             check (status in ('fonctionnelle', 'au_garage')),
  color      text not null default '#888888',
  sort_order int  not null default 0,
  info       text
);

create table if not exists car_bookings (
  id          uuid primary key default gen_random_uuid(),
  car_id      text not null references cars(id) on delete cascade,
  guest_name  text not null,
  start_date  date not null,
  end_date    date not null,
  note        text,
  created_at  timestamptz not null default now(),
  check (end_date > start_date)
);

create index if not exists car_bookings_car_dates_idx
  on car_bookings (car_id, start_date, end_date);

-- 2) Seed des 2 voitures (renommables ensuite dans l'app)
insert into cars (id, name, status, color, sort_order) values
  ('peugeot-206', 'Peugeot 206', 'fonctionnelle', '#2563eb', 0),
  ('mercedes',    'Mercedes',    'fonctionnelle', '#b45309', 1)
on conflict (id) do nothing;

-- 3) Row Level Security : accès public (famille, lien partagé)
alter table cars         enable row level security;
alter table car_bookings enable row level security;

drop policy if exists "cars_select"      on cars;
drop policy if exists "cars_update"      on cars;
drop policy if exists "car_bookings_all" on car_bookings;

create policy "cars_select" on cars
  for select using (true);

create policy "cars_update" on cars
  for update using (true) with check (true);

create policy "car_bookings_all" on car_bookings
  for all using (true) with check (true);

-- 4) Temps réel : on n'ajoute la table que si elle n'y est pas déjà
--    (évite l'erreur 42710 "already member of publication")
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'cars'
  ) then
    alter publication supabase_realtime add table cars;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'car_bookings'
  ) then
    alter publication supabase_realtime add table car_bookings;
  end if;
end $$;
