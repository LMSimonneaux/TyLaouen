"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Car, CarBooking } from "@/lib/types";
import { formatHuman, todayISO } from "@/lib/dates";
import { SiteNav } from "./SiteNav";
import { CarTimeline } from "./CarTimeline";
import { CarStatusCards } from "./CarStatusCards";
import { CarBookingDialog } from "./CarBookingDialog";
import { CarSettingsDialog } from "./CarSettingsDialog";

type Dialog =
  | { mode: "create"; carId?: string; start?: string; end?: string }
  | { mode: "edit"; id: string }
  | null;

export function CarPlanner() {
  const today = todayISO();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<CarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [scrollSignal, setScrollSignal] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    const [c, b] = await Promise.all([
      supabase.from("cars").select("*").order("sort_order"),
      supabase.from("car_bookings").select("*"),
    ]);
    if (c.error) return setError(c.error.message);
    if (b.error) return setError(b.error.message);
    setCars(c.data as Car[]);
    setBookings(b.data as CarBooking[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    load();
    const channel = supabase
      .channel("tylaouen-cars")
      .on("postgres_changes", { event: "*", schema: "public", table: "car_bookings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "cars" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.end_date > today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [bookings, today]
  );

  function goToday() {
    setYear(Number(today.slice(0, 4)));
    setScrollSignal((s) => s + 1);
  }

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight">TyLaouen — voitures</h1>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Configuration requise</h2>
          <p className="mt-2 text-sm text-muted">
            Renseigne les variables Supabase pour activer l&apos;application :
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 text-xs">
            {`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Les voitures</h1>
          <p className="text-sm text-muted">Réservations — famille Simonneaux</p>
        </div>
        <SiteNav active="voitures" />
      </div>

      {/* Barre d'outils : navigation année + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              aria-label="Année précédente"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted transition hover:text-text"
            >
              ‹
            </button>
            <span className="w-16 text-center text-base font-bold tabular-nums">
              {year}
            </span>
            <button
              onClick={() => setYear((y) => y + 1)}
              aria-label="Année suivante"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted transition hover:text-text"
            >
              ›
            </button>
          </div>
          <button
            onClick={goToday}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition hover:text-text"
          >
            Aujourd&apos;hui
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Réglages des voitures"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted transition hover:text-text"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={() => setDialog({ mode: "create" })}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Réserver
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-border bg-surface text-sm text-muted">
          Chargement…
        </div>
      ) : (
        <>
          {/* État actuel des voitures */}
          <CarStatusCards
            cars={cars}
            bookings={bookings}
            todayISO={today}
            onSaved={load}
          />

          <CarTimeline
            cars={cars}
            bookings={bookings}
            year={year}
            todayISO={today}
            scrollSignal={scrollSignal}
            onBarClick={(id) => setDialog({ mode: "edit", id })}
            onCellClick={(carId, dayISO) =>
              setDialog({ mode: "create", carId, start: dayISO })
            }
          />

          {/* Réservations à venir */}
          <section className="mt-2">
            <h2 className="mb-3 text-sm font-semibold text-muted">
              Réservations à venir
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
                Aucune réservation à venir.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((b) => {
                  const refYear = Number(b.start_date.slice(0, 4));
                  const car = cars.find((c) => c.id === b.car_id);
                  return (
                    <li key={b.id}>
                      <button
                        onClick={() => setDialog({ mode: "edit", id: b.id })}
                        className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-left transition hover:border-accent/30 hover:shadow-sm"
                      >
                        <div className="w-28 shrink-0">
                          <div className="text-sm font-semibold tabular-nums">
                            {formatHuman(b.start_date, refYear)}
                          </div>
                          <div className="text-xs text-muted">
                            → {formatHuman(b.end_date, refYear)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {b.guest_name}
                          </div>
                          <div className="mt-1">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                              style={{ background: car?.color ?? "#888" }}
                            >
                              {car?.name ?? b.car_id}
                            </span>
                          </div>
                        </div>
                        {b.note && (
                          <span className="hidden max-w-[30%] truncate text-xs text-muted sm:block">
                            {b.note}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {dialog?.mode === "create" && (
        <CarBookingDialog
          cars={cars}
          bookings={bookings}
          defaultCarId={dialog.carId}
          defaultStart={dialog.start}
          defaultEnd={dialog.end}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {dialog?.mode === "edit" && (
        <CarBookingDialog
          cars={cars}
          bookings={bookings}
          editId={dialog.id}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {settingsOpen && (
        <CarSettingsDialog
          cars={cars}
          onClose={() => setSettingsOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
