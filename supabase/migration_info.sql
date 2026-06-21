-- Migration : champs wifi + info pratiques + temps réel idempotent
-- À exécuter dans Supabase SQL Editor. Sans danger même si déjà appliqué.

-- 1) Champs pratiques sur les maisons
alter table houses add column if not exists wifi_network text;   -- nom du réseau
alter table houses add column if not exists wifi_password text;  -- mot de passe (copiable seul)
alter table houses add column if not exists info text;           -- autres infos : codes, consignes…

-- 2) Temps réel : on n'ajoute la table que si elle n'y est pas déjà
--    (évite l'erreur 42710 "already member of publication")
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
