import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/lib/db/queries/stats";
import { StatTile } from "@/components/stats/stat-tile";
import { RecentMatchesList } from "@/components/stats/recent-matches-list";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) notFound();

  const { player, stats, recentMatches } = profile;
  const winPct =
    stats.matchesPlayed > 0
      ? Math.round((stats.wins / stats.matchesPlayed) * 100)
      : null;

  return (
    <article className="space-y-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-pitch-100 shadow-md">
          {player.avatarPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/avatars/${player.avatarPath.split("/").pop()}`}
              alt={player.nickname}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-pitch-600">
              {player.nickname[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {player.jerseyNumber !== null && (
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-pitch-600 text-sm font-bold text-white">
              {player.jerseyNumber}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-pitch-900">{player.nickname}</h1>
          {player.preferredPosition && (
            <p className="text-sm text-pitch-700">{player.preferredPosition}</p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Matches" value={stats.matchesPlayed} />
        <StatTile label="Goals" value={stats.goalsScored} emphasis />
        <StatTile label="Assists" value={stats.assists} />
        <StatTile label="Win %" value={winPct === null ? "—" : `${winPct}%`} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-pitch-700">
          Recent matches
        </h2>
        <RecentMatchesList recentMatches={recentMatches} />
      </section>
    </article>
  );
}
