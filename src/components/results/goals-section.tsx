"use client";

import type { Player } from "@/types/player";

export interface GoalEntry {
  scorerId: string;
  assistId: string | null;
}

interface Props {
  attendees: Player[];
  goals: GoalEntry[];
  onChange: (goals: GoalEntry[]) => void;
  expectedTotal: number;
}

export function GoalsSection({ attendees, goals, onChange, expectedTotal }: Props) {
  function update(i: number, patch: Partial<GoalEntry>) {
    const next = goals.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(goals.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...goals, { scorerId: attendees[0]?.id ?? "", assistId: null }]);
  }

  const mismatch = goals.length !== expectedTotal;

  return (
    <section className="rounded-xl border border-pitch-100 bg-white p-6">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-pitch-700">
        3 · Goalscorers
      </h3>
      <p className="mb-4 text-xs text-pitch-700">
        Add one entry per goal we scored. Assists are optional. Only players marked as attending appear here.
      </p>

      {attendees.length === 0 ? (
        <p className="rounded-lg bg-pitch-50 p-4 text-sm text-pitch-700">
          Mark attendance first — only attendees can score or assist.
        </p>
      ) : (
        <ul className="space-y-3">
          {goals.map((g, i) => (
            <li
              key={i}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-pitch-100 bg-pitch-50 p-3"
            >
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-semibold uppercase tracking-wide text-pitch-700">
                  Goal #{i + 1}
                </label>
                <select
                  value={g.scorerId}
                  onChange={(e) => update(i, { scorerId: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-pitch-100 bg-white px-2 text-sm"
                >
                  {attendees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-semibold uppercase tracking-wide text-pitch-700">
                  Assist (optional)
                </label>
                <select
                  value={g.assistId ?? ""}
                  onChange={(e) =>
                    update(i, { assistId: e.target.value === "" ? null : e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-pitch-100 bg-white px-2 text-sm"
                >
                  <option value="">— None —</option>
                  {attendees
                    .filter((p) => p.id !== g.scorerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nickname}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={add}
          disabled={attendees.length === 0}
          className="rounded-lg border border-pitch-100 bg-white px-3 py-2 text-sm font-medium text-pitch-900 hover:border-pitch-600 disabled:opacity-50"
        >
          + Add goal
        </button>
        {mismatch && (
          <p className="text-xs text-pitch-700">
            ⚠ Goals logged ({goals.length}) doesn&apos;t match score ({expectedTotal}). Save anyway if you want.
          </p>
        )}
      </div>

      <input type="hidden" name="goalsJson" value={JSON.stringify(goals)} />
    </section>
  );
}
