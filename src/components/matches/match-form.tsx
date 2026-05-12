"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormationPicker } from "./formation-picker";
import type { createMatchAction } from "@/app/(admin)/matches/actions";

export function MatchForm({ action }: { action: typeof createMatchAction }) {
  const [state, dispatch, pending] = useActionState(action, undefined);

  // default to today, 7pm local
  const now = new Date();
  now.setHours(19, 0, 0, 0);
  const defaultDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <form
      action={dispatch}
      className="max-w-md space-y-5 rounded-xl border border-pitch-100 bg-white p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="playedAt">Date and kickoff *</Label>
        <Input
          id="playedAt"
          name="playedAt"
          type="datetime-local"
          required
          defaultValue={defaultDateTime}
        />
        {state?.fieldErrors?.playedAt && (
          <p className="text-sm text-red-600">{state.fieldErrors.playedAt}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="opponentName">Opponent (optional)</Label>
        <Input
          id="opponentName"
          name="opponentName"
          type="text"
          maxLength={80}
          placeholder="e.g. Los Pumas"
        />
      </div>

      <div className="space-y-2">
        <Label>Formation</Label>
        <FormationPicker name="formation" defaultValue="3-3-2" />
        {state?.fieldErrors?.formation && (
          <p className="text-sm text-red-600">{state.fieldErrors.formation}</p>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full bg-pitch-600 hover:bg-pitch-700">
        {pending ? "Creating…" : "Create Match"}
      </Button>
    </form>
  );
}
