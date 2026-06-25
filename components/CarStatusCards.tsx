"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Car, CarBooking } from "@/lib/types";
import { CAR_STATE_META, carState } from "@/lib/cars";
import { addDaysISO, formatHuman } from "@/lib/dates";

export function CarStatusCards({
  cars,
  bookings,
  todayISO,
  onSaved,
}: {
  cars: Car[];
  bookings: CarBooking[];
  todayISO: string;
  onSaved: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleGarage(car: Car) {
    setBusyId(car.id);
    const next = car.status === "au_garage" ? "fonctionnelle" : "au_garage";
    await supabase.from("cars").update({ status: next }).eq("id", car.id);
    onSaved();
    setBusyId(null);
  }

  const refYear = Number(todayISO.slice(0, 4));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cars.map((car) => {
        const state = carState(car, bookings, todayISO);
        const meta = CAR_STATE_META[state];
        const current = bookings
          .filter(
            (b) =>
              b.car_id === car.id &&
              b.start_date <= todayISO &&
              b.end_date > todayISO
          )
          .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

        return (
          <div
            key={car.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ background: car.color }}
                />
                <span className="text-base font-semibold">{car.name}</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: meta.dot }}
                />
                {meta.label}
              </span>
            </div>

            {state === "reservee" && current && (
              <p className="text-sm text-muted">
                Prise par{" "}
                <span className="font-medium text-text">
                  {current.guest_name}
                </span>{" "}
                jusqu&apos;au {formatHuman(addDaysISO(current.end_date, -1), refYear)}.
              </p>
            )}
            {car.status === "au_garage" && (
              <p className="text-sm text-muted">
                Indisponible (au garage / en réparation).
              </p>
            )}

            {car.info && (
              <p className="whitespace-pre-wrap break-words rounded-lg bg-bg p-2.5 text-sm text-text">
                {car.info}
              </p>
            )}

            <button
              onClick={() => toggleGarage(car)}
              disabled={busyId === car.id}
              className={`mt-auto rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                car.status === "au_garage"
                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-border bg-surface text-muted hover:text-text"
              }`}
            >
              {busyId === car.id
                ? "…"
                : car.status === "au_garage"
                ? "Marquer fonctionnelle"
                : "Mettre au garage"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
