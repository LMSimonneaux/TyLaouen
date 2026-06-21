"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import type { House } from "@/lib/types";

export function HouseInfoDialog({
  houses,
  onClose,
}: {
  houses: House[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      // presse-papier indisponible : on ignore silencieusement
    }
  }

  return (
    <Modal title="Infos pratiques" onClose={onClose}>
      <div className="space-y-3">
        {houses.map((h) => {
          const hasWifi = Boolean(h.wifi_network || h.wifi_password);
          return (
            <div key={h.id} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: h.color }}
                />
                <span className="text-sm font-semibold">{h.name}</span>
              </div>

              {hasWifi && (
                <div className="rounded-lg bg-bg p-2.5">
                  {h.wifi_network && (
                    <div className="text-xs text-muted">
                      Réseau :{" "}
                      <span className="font-medium text-text">
                        {h.wifi_network}
                      </span>
                    </div>
                  )}
                  {h.wifi_password && (
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-xs text-muted">Mot de passe</span>
                        <code className="block truncate font-mono text-sm text-text">
                          {h.wifi_password}
                        </code>
                      </div>
                      <button
                        onClick={() => copy(`${h.id}:wifi`, h.wifi_password ?? "")}
                        className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        {copied === `${h.id}:wifi` ? "Copié ✓" : "Copier le mot de passe"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {h.info && (
                <div className="mt-2 flex items-start justify-between gap-2">
                  <p className="min-w-0 whitespace-pre-wrap break-words text-sm text-text">
                    {h.info}
                  </p>
                </div>
              )}

              {!hasWifi && !h.info && (
                <p className="text-sm text-muted">
                  Aucune info.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
