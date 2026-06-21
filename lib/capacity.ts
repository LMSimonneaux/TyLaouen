import type { Booking, House } from "./types";
import { datesOverlap, nightsRange } from "./dates";

/**
 * Places restantes pour une maison sur un intervalle donné.
 * = capacité − pic d'occupation sur les nuits de l'intervalle.
 * Si négatif (séjour déjà en surcapacité), on renvoie 0.
 */
export function remainingForRange(
  house: House,
  bookings: Booking[],
  startISO: string,
  endISO: string,
  excludeGroupId?: string
): number {
  const nights = nightsRange(startISO, endISO);
  if (nights.length === 0) return house.capacity;

  const relevant = bookings.filter(
    (b) =>
      b.house_id === house.id &&
      (!excludeGroupId || b.group_id !== excludeGroupId)
  );

  let peak = 0;
  for (const night of nights) {
    let occupied = 0;
    for (const b of relevant) {
      if (datesOverlap(night, addOneDay(night), b.start_date, b.end_date)) {
        occupied += b.occupants;
      }
    }
    if (occupied > peak) peak = occupied;
  }
  return Math.max(0, house.capacity - peak);
}

function addOneDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

/** Occupation d'une maison une nuit donnée (somme des personnes présentes). */
export function occupiedOn(
  houseId: string,
  bookings: Booking[],
  nightISO: string
): number {
  return bookings
    .filter(
      (b) =>
        b.house_id === houseId &&
        datesOverlap(nightISO, addOneDay(nightISO), b.start_date, b.end_date)
    )
    .reduce((sum, b) => sum + b.occupants, 0);
}
