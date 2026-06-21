"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Booking, House } from "@/lib/types";
import { formatHuman, todayISO } from "@/lib/dates";
import { Hero } from "./Hero";
import { SiteNav } from "./SiteNav";
import { Timeline } from "./Timeline";
import { BookingDialog } from "./BookingDialog";
import { SettingsDialog } from "./SettingsDialog";
import { HouseInfoDialog } from "./HouseInfoDialog";

type Dialog =
  | { mode: "create"; houseId?: string; start?: string; end?: string }
  | { mode: "edit"; groupId: string }
  | null;

export function Planner() {
  const today = todayISO();
  const [houses, setHouses] = useState<House[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [scrollSignal, setScrollSignal] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    const [h, b] = await Promise.all([
      supabase.from("houses").select("*").order("sort_order"),
      supabase.from("bookings").select("*"),
    ]);
    if (h.error) return setError(h.error.message);
    if (b.error) return setError(b.error.message);
    setHouses(h.data as House[]);
    setBookings(b.data as Booking[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    load();
    const channel = supabase
      .channel("tylaouen-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "houses" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const arr = map.get(b.group_id);
      if (arr) arr.push(b);
      else map.set(b.group_id, [b]);
    }
    return [...map.values()]
      .filter((rows) => rows.some((r) => r.end_date > today))
      .sort((a, b) => a[0].start_date.localeCompare(b[0].start_date));
  }, [bookings, today]);

  function goToday() {
    setYear(Number(today.slice(0, 4)));
    setScrollSignal((s) => s + 1);
  }

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight">TyLaouen</h1>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Configuration requise</h2>
          <p className="mt-2 text-sm text-muted">
            Renseigne les variables Supabase pour activer l&apos;application :
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 text-xs">
            {`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
          </pre>
          <p className="mt-3 text-sm text-muted">
            En local : fichier <code className="font-mono">.env.local</code>. Sur
            Vercel : Project Settings → Environment Variables. Voir le README.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      {/* Bannière */}
      <Hero />

      <SiteNav active="maisons" />

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
            onClick={() => setInfoOpen(true)}
            aria-label="Infos pratiques (wifi, codes)"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted transition hover:text-text"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 9v4.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="10" cy="6.4" r="1" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Réglages des maisons"
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
        <Timeline
          houses={houses}
          bookings={bookings}
          year={year}
          todayISO={today}
          scrollSignal={scrollSignal}
          onBarClick={(groupId) => setDialog({ mode: "edit", groupId })}
          onCellClick={(houseId, dayISO) =>
            setDialog({ mode: "create", houseId, start: dayISO })
          }
        />
      )}

      {/* Séjours à venir */}
      {!loading && (
        <section className="mt-2">
          <h2 className="mb-3 text-sm font-semibold text-muted">Séjours à venir</h2>
          {groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
              Aucun séjour à venir.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((rows) => {
                const refYear = Number(rows[0].start_date.slice(0, 4));
                return (
                  <li key={rows[0].group_id}>
                    <button
                      onClick={() =>
                        setDialog({ mode: "edit", groupId: rows[0].group_id })
                      }
                      className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-left transition hover:border-accent/30 hover:shadow-sm"
                    >
                      <div className="w-28 shrink-0">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatHuman(rows[0].start_date, refYear)}
                        </div>
                        <div className="text-xs text-muted">
                          → {formatHuman(rows[0].end_date, refYear)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {rows[0].guest_name}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {rows.map((r) => {
                            const house = houses.find((h) => h.id === r.house_id);
                            return (
                              <span
                                key={r.id}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                                style={{ background: house?.color ?? "#888" }}
                              >
                                {house?.name ?? r.house_id}
                                <span className="rounded bg-white/25 px-1 font-bold tabular-nums">
                                  {r.occupants}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {rows[0].note && (
                        <span className="hidden max-w-[30%] truncate text-xs text-muted sm:block">
                          {rows[0].note}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {dialog?.mode === "create" && (
        <BookingDialog
          houses={houses}
          bookings={bookings}
          defaultHouseId={dialog.houseId}
          defaultStart={dialog.start}
          defaultEnd={dialog.end}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {dialog?.mode === "edit" && (
        <BookingDialog
          houses={houses}
          bookings={bookings}
          editGroupId={dialog.groupId}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {settingsOpen && (
        <SettingsDialog
          houses={houses}
          onClose={() => setSettingsOpen(false)}
          onSaved={load}
        />
      )}
      {infoOpen && (
        <HouseInfoDialog houses={houses} onClose={() => setInfoOpen(false)} />
      )}
    </div>
  );
}
