import { MatchForm } from "@/components/matches/match-form";
import { createMatchAction } from "../actions";

export default function NewMatchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">New Match</h2>
        <p className="text-sm text-pitch-700">Pick a date and formation to start.</p>
      </div>
      <MatchForm action={createMatchAction} />
    </div>
  );
}
