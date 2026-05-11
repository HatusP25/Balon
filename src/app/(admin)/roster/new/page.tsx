import { PlayerForm } from "@/components/roster/player-form";
import { createPlayerAction } from "../actions";

export default function NewPlayerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">Add Player</h2>
        <p className="text-sm text-pitch-700">New regular for the roster.</p>
      </div>
      <PlayerForm action={createPlayerAction} submitLabel="Add Player" />
    </div>
  );
}
