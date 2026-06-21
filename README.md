# TyLaouen — réservations

Petit planning de réservation pour les maisons de la famille Simonneaux :
**TyLaouen**, **Grand Penty**, **Petit Penty**.

- 📅 Timeline annuelle, une ligne par maison (style Gantt)
- ➕ Réserver un séjour sur plusieurs jours, sur une ou plusieurs maisons
- 👥 Nombre de personnes par maison + **blocage si la maison est complète**
- ✏️ Modifier / annuler son séjour
- ⚙️ Capacités des maisons réglables dans l'app
- 🔄 Temps réel : tout le monde voit les séjours des autres instantanément
- 🔓 Sans compte : on tape son nom, accès par lien partagé

Stack : Next.js (App Router) · React · Tailwind · Supabase · déploiement Vercel.

---

## 1. Base de données (Supabase)

1. Crée un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Ouvre **SQL Editor → New query**, colle le contenu de
   [`supabase/schema.sql`](./supabase/schema.sql) et clique **Run**.
   → Ça crée les tables `houses` / `bookings`, ajoute les 3 maisons et active
   le temps réel.
3. Dans **Project Settings → API**, récupère :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Lancer en local

```bash
cp .env.example .env.local   # puis colle tes 2 valeurs Supabase
pnpm install
pnpm dev
```

Ouvre http://localhost:3000.

## 3. Déployer sur Vercel

1. Pousse ce dossier sur GitHub.
2. Sur [vercel.com](https://vercel.com) → **Add New → Project**, importe le repo.
3. Dans **Environment Variables**, ajoute les deux mêmes variables :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. Partage l'URL à la famille — pas de compte à créer.

---

## Notes

- **Capacités** : modifiables via l'icône ⚙️. Le seed met 8 / 6 / 4 places ;
  ajuste librement.
- **Dates** : la date de départ est le matin du départ (le jour de départ
  redevient donc disponible — logique « nuitées »).
- **Sécurité** : l'app est ouverte à toute personne ayant le lien (choix
  « nom seul, lien partagé »). Pour ajouter une barrière, on peut mettre un mot
  de passe partagé ou un login Supabase plus tard.
- Conflit d'écriture simultanée : le contrôle de capacité est fait côté client.
  Pour un usage familial c'est suffisant ; en cas de réservations vraiment
  concurrentes, on pourrait ajouter une contrainte côté base.
