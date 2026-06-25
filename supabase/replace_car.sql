-- Remplacer la ligne « Nouvelle voiture » (insérée par erreur) par la Peugeot 807.
-- À exécuter dans Supabase → SQL Editor.
--
-- delete cascade : si des réservations avaient été créées sur 'nouvelle-voiture',
-- elles seraient supprimées avec. Normalement il n'y en a aucune.

-- 1) Supprime la voiture créée par erreur
delete from cars where id = 'nouvelle-voiture';

-- 2) Ajoute la Peugeot 807 (vert ; sort_order 2 = après les 2 existantes)
insert into cars (id, name, status, color, sort_order) values
  ('peugeot-807', 'Peugeot 807', 'fonctionnelle', '#16a34a', 2)
on conflict (id) do nothing;
