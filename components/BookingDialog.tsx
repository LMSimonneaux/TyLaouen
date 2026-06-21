"use client";

import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { supabase } from "@/lib/supabase";
import type { Booking, House } from "@/lib/types";
import { remainingForRange } from "@/lib/capacity";
import { addDaysISO, formatHuman } from "@/lib/dates";

const NAME_KEY = "tylaouen:name";

type Pick = { selected: boolean; occupants: number };

export function BookingDialog({
  houses,
  bookings,
  editGroupId,
  defaultHouseId,
  defaultStart,
  defaultEnd,
  onClose,
  onSaved,
}: {
  houses: House[];
  bookings: Booking[];
  editGroupId?: string | null;
  defaultHouseId?: string;
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(editGroupId);
  const groupRows = useMemo(
    () =>
      editGroupId
        ? bookings.filter((b) => b.group_id === editGroupId)
        : [],
    [bookings, editGroupId]
  );

  const initial = useMemo(() => {
    if (editGroupId && groupRows.length) {
      const picks: Record<string, Pick> = {};
      for (const h of houses) {
        const row = groupRows.find((r) => r.house_id === h.id);
        picks[h.id] = {
          selected: Boolean(row),
          occupants: row?.occupants ?? 1,
        };
      }
      return {
        name: groupRows[0].guest_name,
        note: groupRows[0].note ?? "",
        start: groupRows[0].start_date,
        end: groupRows[0].end_date,
        picks,
      };
    }
    const picks: Record<string, Pick> = {};
    for (const h of houses) {
      picks[h.id] = { selected: h.id === defaultHouseId, occupants: 1 };
    }
    const savedName =
      typeof window !== "undefined" ? localStorage.getItem(NAME_KEY) ?? "" : "";
    const start = defaultStart ?? new Date().toISOString().slice(0, 10);
    return {
      name: savedName,
      note: "",
      start,
      end: defaultEnd ?? addDaysISO(start, 1),
      picks,
    };
  }, [editGroupId, groupRows, houses, defaultHouseId, defaultStart, defaultEnd]);

  const [name, setName] = useState(initial.name);
  const [note, setNote] = useState(initial.note);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [picks, setPicks] = useState<Record<string, Pick>>(initial.picks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validRange = end > start;

  function setStartSafe(v: string) {
    setStart(v);
    if (end <= v) setEnd(addDaysISO(v, 1));
  }

  function togglePick(id: string, remaining: number) {
    setPicks((p) => {
      const cur = p[id];
      const occ = Math.min(Math.max(1, cur.occupants), Math.max(1, remaining));
      return { ...p, [id]: { ...cur, selected: !cur.selected, occupants: occ } };
    });
  }

  function setOccupants(id: string, n: number) {
    setPicks((p) => ({ ...p, [id]: { ...p[id], occupants: n } }));
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError("Indique un nom.");
    if (!validRange) return setError("La date de départ doit suivre l'arrivée.");

    const chosen = houses.filter((h) => picks[h.id]?.selected);
    if (chosen.length === 0) return setError("Choisis au moins une maison.");

    for (const h of chosen) {
      const occ = picks[h.id].occupants;
      const remaining = remainingForRange(
        h,
        bookings,
        start,
        end,
        editGroupId ?? undefined
      );
      if (occ < 1) return setError(`${h.name} : au moins 1 personne.`);
      if (occ > remaining)
        return setError(
          `${h.name} : seulement ${remaining} place(s) libre(s) sur cette période.`
        );
    }

    setSaving(true);
    try {
      const groupId =
        editGroupId ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.round(Math.random() * 1e9)}`);

      if (editGroupId) {
        const { error: delErr } = await supabase
          .from("bookings")
          .delete()
          .eq("group_id", editGroupId);
        if (delErr) throw delErr;
      }

      const rows = chosen.map((h) => ({
        group_id: groupId,
        house_id: h.id,
        guest_name: name.trim(),
        start_date: start,
        end_date: end,
        occupants: picks[h.id].occupants,
        note: note.trim() || null,
      }));

      const { error: insErr } = await supabase.from("bookings").insert(rows);
      if (insErr) throw insErr;

      if (typeof window !== "undefined")
        localStorage.setItem(NAME_KEY, name.trim());
      onSaved();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Échec de l'enregistrement."
      );
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editGroupId) return;
    setSaving(true);
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from("bookings")
        .delete()
        .eq("group_id", editGroupId);
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
      title={editing ? "Modifier le séjour" : "Nouveau séjour"}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          {editing ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
            >
              Annuler ce séjour
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
            Nom (qui occupe ?)
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
            <label className="mb-1.5 block text-sm font-medium">Arrivée</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStartSafe(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Départ</label>
            <input
              type="date"
              value={end}
              min={addDaysISO(start, 1)}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Maison(s) — coche celles occupées
          </label>
          <div className="space-y-2">
            {houses.map((h) => {
              const remaining = remainingForRange(
                h,
                bookings,
                start,
                end,
                editGroupId ?? undefined
              );
              const pick = picks[h.id];
              const full = remaining <= 0 && !pick.selected;
              return (
                <div
                  key={h.id}
                  className={`rounded-xl border p-3 transition ${
                    pick.selected
                      ? "border-accent/40 bg-accent/[0.03]"
                      : "border-border"
                  } ${full ? "opacity-55" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => !full && togglePick(h.id, remaining)}
                      disabled={full}
                      className="flex flex-1 items-center gap-2.5 text-left disabled:cursor-not-allowed"
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                          pick.selected
                            ? "border-accent bg-accent text-white"
                            : "border-border bg-surface"
                        }`}
                      >
                        {pick.selected && (
                          <svg width="12" height="12" viewBox="0 0 12 12">
                            <path
                              d="M2.5 6.5l2.5 2.5 4.5-5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: h.color }}
                      />
                      <span className="text-sm font-medium">{h.name}</span>
                    </button>

                    {full ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                        Complet
                      </span>
                    ) : (
                      <span className="text-xs text-muted">
                        {remaining}/{h.capacity} libre
                        {remaining > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {pick.selected && (
                    <div className="mt-3 flex items-center gap-2 pl-7">
                      <span className="text-xs text-muted">Personnes :</span>
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            setOccupants(h.id, Math.max(1, pick.occupants - 1))
                          }
                          className="px-2.5 py-1 text-muted hover:text-text"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {pick.occupants}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setOccupants(
                              h.id,
                              Math.min(remaining, pick.occupants + 1)
                            )
                          }
                          disabled={pick.occupants >= remaining}
                          className="px-2.5 py-1 text-muted hover:text-text disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      {pick.occupants > remaining && (
                        <span className="text-xs font-medium text-red-600">
                          max {remaining}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Note <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ex. J'apporte une bilig, il y aura un chien..."
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
