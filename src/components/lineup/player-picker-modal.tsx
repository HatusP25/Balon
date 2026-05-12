"use client";

import { useState, useTransition } from "react";
import type { Player } from "@/types/player";

interface Props {
  open: boolean;
  onClose: () => void;
  availablePlayers: Player[];
  onPick: (playerId: string | null) => Promise<void> | void;
  onCreateGuest?: (nickname: string) => Promise<string>;
}

export function PlayerPickerModal({
  open,
  onClose,
  availablePlayers,
  onPick,
  onCreateGuest,
}: Props) {
  const [query, setQuery] = useState("");
  const [guestName, setGuestName] = useState("");
  const [, startTransition] = useTransition();

  if (!open) return null;

  const filtered = availablePlayers.filter((p) =>
    p.nickname.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-pitch-900">Pick a player</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-pitch-700 hover:bg-pitch-100"
          >
            ✕
          </button>
        </div>

        <input
          autoFocus
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 w-full rounded-md border border-pitch-100 px-3 py-2 text-sm focus:border-pitch-600 focus:outline-none"
        />

        <div className="max-h-72 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-pitch-100"
                  onClick={() => {
                    startTransition(() => {
                      void onPick(p.id);
                      onClose();
                    });
                  }}
                >
                  <span className="font-semibold text-pitch-900">{p.nickname}</span>
                  {p.jerseyNumber !== null && (
                    <span className="text-xs text-pitch-700">#{p.jerseyNumber}</span>
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-pitch-700">No players match.</li>
            )}
          </ul>
        </div>

        {onCreateGuest && (
          <div className="mt-4 border-t border-pitch-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pitch-700">
              Or add a guest
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Guest nickname"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="flex-1 rounded-md border border-pitch-100 px-3 py-2 text-sm focus:border-pitch-600 focus:outline-none"
              />
              <button
                type="button"
                disabled={guestName.trim().length === 0}
                className="rounded-md bg-pitch-600 px-3 py-2 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
                onClick={() => {
                  const name = guestName.trim();
                  if (name.length === 0) return;
                  startTransition(async () => {
                    const newId = await onCreateGuest(name);
                    await onPick(newId);
                    setGuestName("");
                    onClose();
                  });
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="text-sm text-pitch-700 hover:underline"
            onClick={() => {
              startTransition(() => {
                void onPick(null);
                onClose();
              });
            }}
          >
            Clear slot
          </button>
        </div>
      </div>
    </div>
  );
}
