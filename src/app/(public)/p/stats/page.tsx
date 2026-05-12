import { listLeaderboard } from "@/lib/db/queries/stats";
import { LeaderboardTable } from "@/components/stats/leaderboard-table";

export const dynamic = "force-dynamic";

export default async function PublicStatsPage() {
  const rows = await listLeaderboard();
  return (
    <article className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-pitch-900">Leaderboard</h1>
        <p className="text-sm text-pitch-700">
          All-time stats across recorded matches. MP · matches played · G · goals · A · assists · W% · win rate.
        </p>
      </header>
      <LeaderboardTable rows={rows} />
    </article>
  );
}
