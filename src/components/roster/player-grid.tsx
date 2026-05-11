import type { Player } from "@/types/player";
import { PlayerCard } from "./player-card";

export function PlayerGrid({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-pitch-100 bg-white p-12 text-center">
        <p className="text-pitch-700">No regulars yet. Add your first player to get started.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {players.map((p) => (
        <PlayerCard key={p.id} player={p} />
      ))}
    </div>
  );
}
