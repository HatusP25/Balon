import Link from "next/link";
import { listActiveRegulars } from "@/lib/db/queries/players";
import { PlayerGrid } from "@/components/roster/player-grid";

export default async function RosterPage() {
  const players = await listActiveRegulars();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pitch-900">Roster</h2>
          <p className="text-sm text-pitch-700">{players.length} active regulars</p>
        </div>
        <Link
          href="/roster/new"
          className="inline-flex items-center justify-center rounded-lg border border-transparent bg-pitch-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-pitch-700"
        >
          + Add Player
        </Link>
      </div>
      <PlayerGrid players={players} />
    </div>
  );
}
