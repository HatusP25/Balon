import Link from "next/link";
import { getNextPlannedMatch } from "@/lib/db/queries/matches";
import { getLastPlayedMatch, listLeaderboard } from "@/lib/db/queries/stats";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const [next, last, leaderboard] = await Promise.all([
    getNextPlannedMatch(),
    getLastPlayedMatch(),
    listLeaderboard(),
  ]);

  const top3 = leaderboard
    .filter((r) => r.matchesPlayed > 0)
    .sort(
      (a, b) =>
        b.goalsScored - a.goalsScored ||
        b.matchesPlayed - a.matchesPlayed ||
        a.nickname.localeCompare(b.nickname),
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-pitch-900">Balon</h2>
        <p className="text-sm text-pitch-700">Lineups and updates from our games.</p>
      </header>

      {next ? (
        <Link
          href={`/p/match/${next.shortSlug}`}
          className="block rounded-xl border border-pitch-100 bg-white p-6 transition hover:border-pitch-600"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch-700">
            Next match
          </p>
          <p className="mt-2 text-xl font-bold text-pitch-900">
            {next.opponentName ? `vs ${next.opponentName}` : "Friendly match"}
          </p>
          <p className="mt-1 text-sm text-pitch-700">
            {new Date(next.playedAt).toLocaleString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · Formation {next.formation}
          </p>
          <p className="mt-3 text-sm font-medium text-pitch-600">View lineup →</p>
        </Link>
      ) : (
        <div className="rounded-xl border border-dashed border-pitch-100 bg-white p-12 text-center">
          <p className="text-pitch-700">No upcoming match yet. Check back later.</p>
        </div>
      )}

      {last && (
        <Link
          href={`/p/match/${last.shortSlug}`}
          className="block rounded-xl border border-pitch-100 bg-white p-6 transition hover:border-pitch-600"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-pitch-700">
            Last result
          </p>
          <p className="mt-2 text-xl font-bold text-pitch-900">
            {last.opponentName ? `vs ${last.opponentName}` : "Friendly match"}{" "}
            <span className="text-pitch-600">
              {last.ourScore}–{last.theirScore}
            </span>
          </p>
          <p className="mt-1 text-sm text-pitch-700">
            {new Date(last.playedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="mt-3 text-sm font-medium text-pitch-600">View recap →</p>
        </Link>
      )}

      {top3.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-pitch-700">
              Top scorers
            </p>
            <Link href="/p/stats" className="text-xs font-medium text-pitch-600 hover:underline">
              Full leaderboard →
            </Link>
          </div>
          <ul className="space-y-2">
            {top3.map((r, i) => (
              <li key={r.playerId}>
                <Link
                  href={`/p/player/${r.playerId}`}
                  className="flex items-center justify-between rounded-lg border border-pitch-100 bg-white p-3 transition hover:border-pitch-600"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-bold text-pitch-700">#{i + 1}</span>
                    <span className="text-sm font-semibold text-pitch-900">{r.nickname}</span>
                  </span>
                  <span className="text-sm text-pitch-900">
                    <span className="font-semibold">{r.goalsScored}</span>{" "}
                    <span className="text-xs text-pitch-700">goals</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
