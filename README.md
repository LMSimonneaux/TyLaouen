# TyLaouen — réservations

Petit planning de réservation pour une/des voiture(s) et une/des maison(s) de vacances :
Comprends données seedées.

- 📅 Timeline annuelle, une ligne par maison / voiture (style Gantt)
- ➕ Réserver un séjour (maisons) ou une voiture sur plusieurs jours
- 👥 Maisons : nombre de personnes + **blocage si la maison est complète**
- 🚗 Voitures : état **fonctionnelle / au garage / réservée** + **blocage si déjà prise**
- ✏️ Modifier / annuler une réservation
- ⚙️ Capacités des maisons et état des voitures réglables dans l'app
- 🔄 Temps réel : tout le monde voit les réservations des autres instantanément
- 🔓 Sans compte : on tape son nom, accès par lien partagé

Navigation entre les deux plannings via les onglets **Maisons / Voitures**
(page voitures : `/voitures`).

Stack : Next.js (App Router) · React · Tailwind · Supabase · déploiement Vercel.

---

## 1. Bdd Supabase (à configurer soit même)

1. Créer un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Ouvrir **SQL Editor → New query**, coller le contenu de
   [`supabase/schema.sql`](./supabase/schema.sql) et cliquer sur **Run**.
   → Création des tables `houses` / `bookings` / `cars` / `car_bookings`, ajout
   des 3 maisons et les 2 voitures, et activation le temps réel.
   _Base déjà en place ?_ exécute plutôt
   [`supabase/migration_cars.sql`](./supabase/migration_cars.sql) pour n'ajouter
   que les voitures (sans danger si déjà appliqué).
3. Dans **Project Settings → API**, récupèrer :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Lancer en local

```bash
cp .env.example .env.local   # puis colle tes 2 valeurs Supabase
pnpm install
pnpm dev
```

http://localhost:3000.

## 3. Déployer sur Vercel

1. Pousser ce dossier vers GitHub.
2. Sur [vercel.com](https://vercel.com) → **Add New → Project**, importer le repo.
3. Dans **Environment Variables**, ajoute les deux mêmes variables :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. Partager l'URL aux proches — pas de compte à créer.

---

## Notes

- **Capacités** : modifiables via l'icône ⚙️. Le seed met 8 / 6 / 4 places ;
  à ajuster.
- **Dates** : la date de départ est le matin du départ (le jour de départ
  redevient donc disponible — logique « nuitées »).
- **Sécurité** : l'app est ouverte à toute personne ayant le lien (choix
  « nom seul, lien partagé »). Pour ajouter une barrière, on peut mettre un mot
  de passe partagé ou un login Supabase plus tard.
- Conflit d'écriture simultanée : le contrôle de capacité est fait côté client.
  Pour un usage familial c'est suffisant ; en cas de réservations vraiment
  concurrentes, on pourrait ajouter une contrainte côté base.
