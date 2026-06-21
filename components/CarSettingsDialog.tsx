"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { supabase } from "@/lib/supabase";
import type { Car, CarStatus } from "@/lib/types";

export function CarSettingsDialog({
  cars,
  onClose,
  onSaved,
}: {
  cars: Car[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(
    cars.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      color: c.color,
      info: c.info ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(
    id: string,
    patch: Partial<{ name: string; status: CarStatus; info: string }>
  ) {
    setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      for (const c of draft) {
        const { error: upErr } = await supabase
          .from("cars")
          .update({
            name: c.name.trim() || c.id,
            status: c.status,
            info: c.info.trim() || null,
          })
          .eq("id", c.id);
        if (upErr) throw upErr;
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Réglages des voitures"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
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
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Nom, état et infos pratiques de chaque voiture. L&apos;état « réservée »
        s&apos;affiche automatiquement quand une réservation est en cours.
      </p>
      <div className="space-y-3">
        {draft.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <input
                value={c.name}
                onChange={(e) => update(c.id, { name: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            <div className="mt-3 inline-flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => update(c.id, { status: "fonctionnelle" })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  c.status === "fonctionnelle"
                    ? "bg-green-600 text-white"
                    : "text-muted hover:text-text"
                }`}
              >
                Fonctionnelle
              </button>
              <button
                type="button"
                onClick={() => update(c.id, { status: "au_garage" })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  c.status === "au_garage"
                    ? "bg-red-600 text-white"
                    : "text-muted hover:text-text"
                }`}
              >
                Au garage
              </button>
            </div>

            <textarea
              value={c.info}
              onChange={(e) => update(c.id, { info: e.target.value })}
              rows={2}
              placeholder="Infos : assurance, où sont les clés, contrôle technique, carburant…"
              className="mt-3 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </Modal>
  );
}
