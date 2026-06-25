-- Ajouter la Peugeot 807
-- À exécuter dans Supabase → SQL Editor.
--
-- Couleur '#16a34a' = vert (bleu = #2563eb et orange = #b45309 sont déjà pris).
-- sort_order = 2 : la place après les 2 voitures existantes (0 et 1).
-- Le nom reste modifiable ensuite dans l'app (Réglages des voitures).

insert into cars (id, name, status, color, sort_order) values
  ('peugeot-807', 'Peugeot 807', 'fonctionnelle', '#16a34a', 2)
on conflict (id) do nothing;
