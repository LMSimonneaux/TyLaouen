"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { supabase } from "@/lib/supabase";
import type { House } from "@/lib/types";

export function SettingsDialog({
  houses,
  onClose,
  onSaved,
}: {
  houses: House[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(
    houses.map((h) => ({
      id: h.id,
      name: h.name,
      capacity: h.capacity,
      color: h.color,
      wifi_network: h.wifi_network ?? "",
      wifi_password: h.wifi_password ?? "",
      info: h.info ?? "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(
    id: string,
    patch: Partial<{
      name: string;
      capacity: number;
      wifi_network: string;
      wifi_password: string;
      info: string;
    }>
  ) {
    setDraft((d) => d.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      for (const h of draft) {
        const { error: upErr } = await supabase
          .from("houses")
          .update({
            name: h.name.trim() || h.id,
            capacity: Math.max(0, h.capacity),
            wifi_network: h.wifi_network.trim() || null,
            wifi_password: h.wifi_password.trim() || null,
            info: h.info.trim() || null,
          })
          .eq("id", h.id);
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
      title="Réglages des maisons"
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
        Nombre de couchages par maison. Une réservation est bloquée si la maison
        est complète sur la période choisie.
      </p>
      <div className="space-y-3">
        {draft.map((h) => (
          <div key={h.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ background: h.color }}
              />
              <input
                value={h.name}
                onChange={(e) => update(h.id, { name: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => update(h.id, { capacity: Math.max(0, h.capacity - 1) })}
                    className="px-2.5 py-1.5 text-muted hover:text-text"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {h.capacity}
                  </span>
                  <button
                    type="button"
                    onClick={() => update(h.id, { capacity: h.capacity + 1 })}
                    className="px-2.5 py-1.5 text-muted hover:text-text"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-muted">places</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={h.wifi_network}
                onChange={(e) => update(h.id, { wifi_network: e.target.value })}
                placeholder="Réseau wifi"
                className="min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
              <input
                value={h.wifi_password}
                onChange={(e) => update(h.id, { wifi_password: e.target.value })}
                placeholder="Mot de passe wifi"
                className="min-w-0 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <textarea
              value={h.info}
              onChange={(e) => update(h.id, { info: e.target.value })}
              rows={2}
              placeholder="Autres infos : code du portail, une lampe HS, une fenêtre à réparer…"
              className="mt-2 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
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
