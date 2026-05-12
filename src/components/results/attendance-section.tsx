"use client";

import type { Player } from "@/types/player";

interface Props {
  players: Player[];
  selected: Set<string>;
  onToggle: (playerId: string) => void;
}

export function AttendanceSection({ players, selected, onToggle }: Props) {
  return (
    <section className="rounded-xl border border-pitch-100 bg-white p-6">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-pitch-700">
        2 · Who played?
      </h3>
      <p className="mb-4 text-xs text-pitch-700">
        Pre-checked from the planned lineup. Toggle to match who actually showed up.
        ({selected.size} selected)
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {players.map((p) => {
          const isChecked = selected.has(p.id);
          return (
            <li key={p.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                  isChecked
                    ? "border-pitch-600 bg-pitch-50"
                    : "border-pitch-100 bg-white hover:border-pitch-600"
                }`}
              >
                <input
                  type="checkbox"
                  name="attendance"
                  value={p.id}
                  checked={isChecked}
                  onChange={() => onToggle(p.id)}
                  className="h-4 w-4 accent-pitch-600"
                />
                <span className="text-sm font-semibold text-pitch-900">{p.nickname}</span>
                {p.jerseyNumber !== null && (
                  <span className="ml-auto text-xs text-pitch-700">#{p.jerseyNumber}</span>
                )}
                {!p.isRegular && (
                  <span className="rounded-full bg-pitch-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-pitch-700">
                    Guest
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
