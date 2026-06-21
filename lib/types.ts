export type House = {
  id: string;
  name: string;
  capacity: number;
  color: string;
  sort_order: number;
  wifi_network: string | null; // nom du réseau wifi
  wifi_password: string | null; // mot de passe wifi
  info: string | null; // autres infos pratiques : codes, consignes…
};

export type Booking = {
  id: string;
  group_id: string;
  house_id: string;
  guest_name: string;
  start_date: string; // "YYYY-MM-DD" — arrivée (incluse)
  end_date: string; // "YYYY-MM-DD" — départ (matin, exclu)
  occupants: number;
  note: string | null;
  created_at: string;
};

// Une ligne de saisie dans le formulaire : une maison + un nb de personnes
export type HousePick = {
  house_id: string;
  occupants: number;
};

// =========================================================
// Voitures
// =========================================================

// État réglable manuellement. « réservée » n'est pas stocké : il est déduit
// du calendrier (une réservation couvre aujourd'hui).
export type CarStatus = "fonctionnelle" | "au_garage";

export type Car = {
  id: string;
  name: string;
  status: CarStatus;
  color: string;
  sort_order: number;
  info: string | null; // infos pratiques : assurance, où sont les clés, contrôle technique…
};

export type CarBooking = {
  id: string;
  car_id: string;
  guest_name: string;
  start_date: string; // "YYYY-MM-DD" — début (inclus)
  end_date: string; // "YYYY-MM-DD" — fin (matin, exclu)
  note: string | null;
  created_at: string;
};
