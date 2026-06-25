"use client";

import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { supabase } from "@/lib/supabase";
import type { Car, CarBooking } from "@/lib/types";
import { carBusyForRange } from "@/lib/cars";
import { addDaysISO, formatHuman } from "@/lib/dates";

const NAME_KEY = "tylaouen:name";

export function CarBookingDialog({
  cars,
  bookings,
  editId,
  defaultCarId,
  defaultStart,
  defaultEnd,
  onClose,
  onSaved,
}: {
  cars: Car[];
  bookings: CarBooking[];
  editId?: string | null;
  defaultCarId?: string;
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(editId);
  const editRow = useMemo(
    () => (editId ? bookings.find((b) => b.id === editId) ?? null : null),
    [bookings, editId]
  );

  const initial = useMemo(() => {
    if (editRow) {
      return {
        name: editRow.guest_name,
        note: editRow.note ?? "",
        start: editRow.start_date,
        // end stocké = matin exclu ; affiché = dernier jour inclus
        end: addDaysISO(editRow.end_date, -1),
        carId: editRow.car_id,
      };
    }
    const savedName =
      typeof window !== "undefined" ? localStorage.getItem(NAME_KEY) ?? "" : "";
    const start = defaultStart ?? new Date().toISOString().slice(0, 10);
    return {
      name: savedName,
      note: "",
      start,
      end: defaultEnd ?? start,
      carId: defaultCarId ?? cars[0]?.id ?? "",
    };
  }, [editRow, cars, defaultCarId, defaultStart, defaultEnd]);

  const [name, setName] = useState(initial.name);
  const [note, setNote] = useState(initial.note);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [carId, setCarId] = useState(initial.carId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `end` = dernier jour inclus (affiché/choisi). En base, la fin reste
  // exclusive (matin de restitution), donc on stocke le lendemain.
  const endExcl = addDaysISO(end, 1);
  const validRange = end >= start;

  function setStartSafe(v: string) {
    setStart(v);
    if (end < v) setEnd(v);
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError("Indique un nom.");
    if (!carId) return setError("Choisis une voiture.");
    if (!validRange) return setError("La date de fin ne peut pas précéder le début.");

    if (carBusyForRange(carId, bookings, start, endExcl, editId ?? undefined)) {
      const car = cars.find((c) => c.id === carId);
      return setError(
        `${car?.name ?? "Cette voiture"} est déjà réservée sur cette période.`
      );
    }

    setSaving(true);
    try {
      const payload = {
        car_id: carId,
        guest_name: name.trim(),
        start_date: start,
        end_date: endExcl,
        note: note.trim() || null,
      };

      if (editId) {
        const { error: upErr } = await supabase
          .from("car_bookings")
          .update(payload)
          .eq("id", editId);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase
          .from("car_bookings")
          .insert(payload);
        if (insErr) throw insErr;
      }

      if (typeof window !== "undefined")
        localStorage.setItem(NAME_KEY, name.trim());
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editId) return;
    setSaving(true);
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from("car_bookings")
        .delete()
        .eq("id", editId);
      if (delErr) throw delErr;
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la suppression.");
      setSaving(false);
    }
  }

  const refYear = Number(start.slice(0, 4));

  return (
    <Modal
      title={editing ? "Modifier la réservation" : "Nouvelle réservation"}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          {editing ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
            >
              Annuler cette réservation
            </button>
          ) : (
            <span className="text-xs text-muted">
              {validRange
                ? `${formatHuman(start, refYear)} → ${formatHuman(end, refYear)}`
                : ""}
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-bg disabled:opacity-50"
            >
              Fermer
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "…" : editing ? "Enregistrer" : "Réserver"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Nom (qui conduit ?)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Famille Marie"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Début</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStartSafe(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Fin</label>
            <input
              type="date"
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Voiture</label>
          <div className="space-y-2">
            {cars.map((c) => {
              const busy =
                carBusyForRange(c.id, bookings, start, endExcl, editId ?? undefined);
              const selected = carId === c.id;
              const blocked = busy && !selected;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => !blocked && setCarId(c.id)}
                  disabled={blocked}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${
                    selected
                      ? "border-accent/40 bg-accent/[0.03]"
                      : "border-border"
                  } ${blocked ? "opacity-55" : ""}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
                        selected
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface"
                      }`}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: c.color }}
                    />
                    <span className="text-sm font-medium">{c.name}</span>
                  </span>
                  {c.status === "au_garage" ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                      Au garage
                    </span>
                  ) : busy ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {selected ? "Cette résa" : "Déjà prise"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Libre</span>
                  )}
                </button>
              );
            })}
          </div>
          {cars.find((c) => c.id === carId)?.status === "au_garage" && (
            <p className="mt-2 text-xs text-amber-700">
              Cette voiture est notée au garage...
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Note <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ex. Plein fait, il y a un voyant orange allumé…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
