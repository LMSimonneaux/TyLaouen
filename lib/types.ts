export type House = {
  id: string;
  name: string;
  capacity: number;
  color: string;
  sort_order: number;
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
