import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true si les variables d'environnement Supabase sont présentes. */
export const supabaseConfigured = Boolean(url && anonKey);

// On crée toujours un client (avec un placeholder si non configuré) pour que le
// build passe ; l'UI affiche un message tant que les variables ne sont pas
// renseignées (voir le README, section Configuration).
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
  { auth: { persistSession: false } }
);
