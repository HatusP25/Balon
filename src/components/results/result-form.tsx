"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Player } from "@/types/player";
import { ScoreSection } from "./score-section";
import { AttendanceSection } from "./attendance-section";
import { GoalsSection, type GoalEntry } from "./goals-section";

interface Props {
  matchId: string;
  initialOurScore: number;
  initialTheirScore: number;
  initialAttendance: string[];
  initialGoals: GoalEntry[];
  allPlayers: Player[];
  saveAction: (
    prev: { error?: string; fieldErrors?: Record<string, string> } | undefined,
    fd: FormData,
  ) => Promise<{ error?: string; fieldErrors?: Record<string, string> } | undefined>;
  clearAction: () => Promise<void>;
}

export function ResultForm({
  initialOurScore,
  initialTheirScore,
  initialAttendance,
  initialGoals,
  allPlayers,
  saveAction,
  clearAction,
}: Props) {
  const [state, dispatch, pending] = useActionState(saveAction, undefined);
  const [our, setOur] = useState(initialOurScore);
  const [their, setTheir] = useState(initialTheirScore);
  const [attendance, setAttendance] = useState<Set<string>>(new Set(initialAttendance));
  const [goals, setGoals] = useState<GoalEntry[]>(initialGoals);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const attendees = allPlayers.filter((p) => attendance.has(p.id));
  const sanitizedGoals = goals.filter((g) => attendance.has(g.scorerId));
  if (sanitizedGoals.length !== goals.length) {
    setTimeout(() => setGoals(sanitizedGoals), 0);
  }

  return (
    <form action={dispatch} className="space-y-4">
      <ScoreSection our={our} their={their} onChange={(u, t) => { setOur(u); setTheir(t); }} />

      <AttendanceSection
        players={allPlayers}
        selected={attendance}
        onToggle={(pid) => {
          const next = new Set(attendance);
          if (next.has(pid)) next.delete(pid);
          else next.add(pid);
          setAttendance(next);
        }}
      />

      <GoalsSection
        attendees={attendees}
        goals={sanitizedGoals}
        onChange={setGoals}
        expectedTotal={our}
      />

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="bg-pitch-600 hover:bg-pitch-700"
        >
          {pending ? "Saving…" : "Save Result"}
        </Button>

        {confirmingClear ? (
          <span className="inline-flex items-center gap-2">
            <Button
              type="button"
              onClick={async () => {
                await clearAction();
                setConfirmingClear(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm clear
            </Button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="text-sm text-pitch-700 hover:underline"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="ml-auto text-sm text-red-600 hover:underline"
          >
            Clear result (revert to planned)
          </button>
        )}
      </div>
    </form>
  );
}
