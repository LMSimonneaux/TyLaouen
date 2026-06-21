import type { Car, CarBooking, CarStatus } from "./types";
import { datesOverlap } from "./dates";

// État affiché : « réservée » prime sur « fonctionnelle » mais pas sur
// « au garage » (si la voiture est au garage, elle ne peut pas servir).
export type CarState = CarStatus | "reservee";

export const CAR_STATE_META: Record<
  CarState,
  { label: string; dot: string; badge: string }
> = {
  fonctionnelle: {
    label: "Fonctionnelle",
    dot: "#16a34a",
    badge: "bg-green-50 text-green-700",
  },
  reservee: {
    label: "Réservée",
    dot: "#d97706",
    badge: "bg-amber-50 text-amber-700",
  },
  au_garage: {
    label: "Au garage",
    dot: "#dc2626",
    badge: "bg-red-50 text-red-700",
  },
};

/** Une réservation couvre-t-elle ce jour ? (start inclus, end exclu) */
export function isReservedOn(
  carId: string,
  bookings: CarBooking[],
  dayISO: string
): boolean {
  return bookings.some(
    (b) => b.car_id === carId && b.start_date <= dayISO && b.end_date > dayISO
  );
}

/** État courant d'une voiture (réglage manuel + réservation du jour). */
export function carState(
  car: Car,
  bookings: CarBooking[],
  todayISO: string
): CarState {
  if (car.status === "au_garage") return "au_garage";
  return isReservedOn(car.id, bookings, todayISO) ? "reservee" : "fonctionnelle";
}

/**
 * La voiture est-elle déjà prise sur [startISO, endISO[ ?
 * Une voiture = ressource unique, donc tout chevauchement bloque.
 */
export function carBusyForRange(
  carId: string,
  bookings: CarBooking[],
  startISO: string,
  endISO: string,
  excludeId?: string
): boolean {
  return bookings.some(
    (b) =>
      b.car_id === carId &&
      (!excludeId || b.id !== excludeId) &&
      datesOverlap(startISO, endISO, b.start_date, b.end_date)
  );
}
