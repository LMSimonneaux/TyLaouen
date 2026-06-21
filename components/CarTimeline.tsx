"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Car, CarBooking } from "@/lib/types";
import { CAR_STATE_META, carState } from "@/lib/cars";
import {
  addDaysISO,
  dayOfMonth,
  daysBetween,
  isWeekend,
  weekdayShort,
} from "@/lib/dates";

const DAY_W = 40; // largeur d'une colonne-jour (px)
const ROW_H = 26; // hauteur d'une barre
const ROW_GAP = 4;
const PAD_Y = 8;
const LEFT_W = 138; // colonne des voitures
const MIN_LANE = ROW_H + PAD_Y * 2;

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type Placed = { b: CarBooking; row: number };

function packLane(items: CarBooking[]): { placed: Placed[]; rows: number } {
  const sorted = [...items].sort((a, b) =>
    a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0
  );
  const rowEnds: string[] = [];
  const placed: Placed[] = [];
  for (const b of sorted) {
    let row = rowEnds.findIndex((end) => end <= b.start_date);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(b.end_date);
    } else {
      rowEnds[row] = b.end_date;
    }
    placed.push({ b, row });
  }
  return { placed, rows: Math.max(1, rowEnds.length) };
}

export function CarTimeline({
  cars,
  bookings,
  year,
  todayISO,
  scrollSignal,
  onBarClick,
  onCellClick,
}: {
  cars: Car[];
  bookings: CarBooking[];
  year: number;
  todayISO: string;
  scrollSignal: number;
  onBarClick: (id: string) => void;
  onCellClick: (carId: string, dayISO: string) => void;
}) {
  const yearStart = `${year}-01-01`;
  const yearEndExcl = `${year + 1}-01-01`;

  const days = useMemo(() => {
    const out: string[] = [];
    let d = yearStart;
    while (d < yearEndExcl) {
      out.push(d);
      d = addDaysISO(d, 1);
    }
    return out;
  }, [yearStart, yearEndExcl]);

  const months = useMemo(
    () =>
      MONTHS.map((name, m) => {
        const first = `${year}-${String(m + 1).padStart(2, "0")}-01`;
        const count = new Date(year, m + 1, 0).getDate();
        return { name, index: daysBetween(yearStart, first), count };
      }),
    [year, yearStart]
  );

  const totalW = days.length * DAY_W;
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // Au montage / changement d'année : centrer sur aujourd'hui (ou janvier)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cell = todayRef.current;
    if (cell && todayISO >= yearStart && todayISO < yearEndExcl) {
      const cellCenter =
        cell.getBoundingClientRect().left -
        el.getBoundingClientRect().left +
        el.scrollLeft +
        cell.clientWidth / 2;
      el.scrollLeft = Math.max(0, cellCenter - el.clientWidth / 2);
    } else {
      el.scrollLeft = 0;
    }
  }, [year, todayISO, yearStart, yearEndExcl, scrollSignal]);

  const lanes = useMemo(
    () =>
      cars.map((c) => {
        const items = bookings.filter((b) => b.car_id === c.id);
        const { placed, rows } = packLane(items);
        const height = Math.max(
          MIN_LANE,
          rows * (ROW_H + ROW_GAP) - ROW_GAP + PAD_Y * 2
        );
        return { car: c, placed, height };
      }),
    [cars, bookings]
  );

  return (
    <div
      ref={scrollRef}
      className="tl-scroll overflow-auto rounded-2xl border border-border bg-surface"
    >
      <div style={{ width: LEFT_W + totalW, minWidth: "100%" }}>
        {/* En-tête mois + jours */}
        <div className="sticky top-0 z-20 flex bg-surface">
          <div
            className="sticky left-0 z-30 shrink-0 border-b border-r border-border bg-surface"
            style={{ width: LEFT_W }}
          />
          <div style={{ width: totalW }}>
            <div className="flex h-7 border-b border-border">
              {months.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center overflow-hidden border-r border-border px-2 text-xs font-semibold text-text"
                  style={{ width: m.count * DAY_W }}
                >
                  {m.name}
                </div>
              ))}
            </div>
            <div className="flex border-b border-border">
              {days.map((iso) => {
                const today = iso === todayISO;
                return (
                  <div
                    key={iso}
                    ref={today ? todayRef : undefined}
                    className={`flex shrink-0 flex-col items-center justify-center border-r border-border py-1 ${
                      today ? "bg-accent text-white" : isWeekend(iso) ? "bg-bg" : ""
                    }`}
                    style={{ width: DAY_W }}
                  >
                    <span className="text-[10px] leading-none opacity-70">
                      {weekdayShort(iso)}
                    </span>
                    <span className="text-xs font-semibold leading-tight tabular-nums">
                      {dayOfMonth(iso)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lignes (voitures) */}
        {lanes.map(({ car, placed, height }) => {
          const state = carState(car, bookings, todayISO);
          const meta = CAR_STATE_META[state];
          return (
            <div key={car.id} className="flex border-b border-border last:border-b-0">
              <div
                className="sticky left-0 z-10 flex shrink-0 flex-col justify-center gap-0.5 border-r border-border bg-surface px-3"
                style={{ width: LEFT_W, height }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: car.color }}
                  />
                  <span className="truncate text-sm font-semibold">{car.name}</span>
                </div>
                <span className="flex items-center gap-1 pl-[18px] text-xs text-muted">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: meta.dot }}
                  />
                  {meta.label}
                </span>
              </div>

              <div className="relative" style={{ width: totalW, height }}>
                {/* Fond cliquable (créer une réservation) */}
                <div className="absolute inset-0 flex">
                  {days.map((iso) => {
                    const today = iso === todayISO;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => onCellClick(car.id, iso)}
                        aria-label={`Réserver ${car.name} le ${iso}`}
                        className={`shrink-0 border-r border-border transition hover:bg-accent/[0.04] ${
                          today ? "bg-accent/[0.06]" : isWeekend(iso) ? "bg-bg/60" : ""
                        }`}
                        style={{ width: DAY_W }}
                      />
                    );
                  })}
                </div>

                {/* Barres de réservation */}
                {placed.map(({ b, row }) => {
                  const vStart = b.start_date < yearStart ? yearStart : b.start_date;
                  const vEnd = b.end_date > yearEndExcl ? yearEndExcl : b.end_date;
                  const offset = daysBetween(yearStart, vStart);
                  const span = daysBetween(vStart, vEnd);
                  if (span <= 0) return null;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onBarClick(b.id)}
                      title={b.guest_name}
                      className="absolute flex items-center gap-1 overflow-hidden rounded-md px-2 text-left text-white shadow-sm ring-1 ring-black/5 transition hover:brightness-110"
                      style={{
                        left: offset * DAY_W + 2,
                        width: span * DAY_W - 4,
                        top: PAD_Y + row * (ROW_H + ROW_GAP),
                        height: ROW_H,
                        background: car.color,
                      }}
                    >
                      <span className="truncate text-xs font-semibold">
                        {b.guest_name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
