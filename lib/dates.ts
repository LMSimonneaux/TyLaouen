import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";

// Les dates sont manipulées en chaînes "YYYY-MM-DD" pour éviter les soucis de
// fuseau horaire. On ne convertit en Date que pour l'affichage / les positions.

/** Parse "YYYY-MM-DD" en Date locale (minuit local), sans décalage de TZ. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Formate une Date locale en "YYYY-MM-DD". */
export function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Aujourd'hui en "YYYY-MM-DD" (heure locale). */
export function todayISO(): string {
  return toISO(new Date());
}

/** Ajoute n jours à une date ISO. */
export function addDaysISO(iso: string, n: number): string {
  return toISO(addDays(parseDay(iso), n));
}

/** Nombre de jours calendaires entre deux dates ISO (b - a). */
export function daysBetween(aISO: string, bISO: string): number {
  return differenceInCalendarDays(parseDay(bISO), parseDay(aISO));
}

/**
 * Deux séjours se chevauchent-ils ? end_date est exclusive (matin du départ).
 * La comparaison de chaînes "YYYY-MM-DD" équivaut à la comparaison chronologique.
 */
export function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Liste des jours [startISO, endISO[ (départ exclu). */
export function nightsRange(startISO: string, endISO: string): string[] {
  const last = addDaysISO(endISO, -1);
  if (last < startISO) return [];
  return eachDayOfInterval({
    start: parseDay(startISO),
    end: parseDay(last),
  }).map(toISO);
}

/** "21 juin", "21 juin 2026" si année différente de refYear. */
export function formatHuman(iso: string, refYear?: number): string {
  const d = parseDay(iso);
  const withYear = refYear !== undefined && d.getFullYear() !== refYear;
  return format(d, withYear ? "d MMM yyyy" : "d MMM", { locale: fr });
}

/** "lun.", "mar."… */
export function weekdayShort(iso: string): string {
  return format(parseDay(iso), "EEEEEE", { locale: fr });
}

/** Numéro du jour dans le mois. */
export function dayOfMonth(iso: string): number {
  return parseDay(iso).getDate();
}

/** "juin 2026" */
export function monthLabel(iso: string): string {
  return format(parseDay(iso), "MMMM yyyy", { locale: fr });
}

export function isWeekend(iso: string): boolean {
  const day = parseDay(iso).getDay();
  return day === 0 || day === 6;
}
