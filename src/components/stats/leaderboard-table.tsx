import Link from "next/link";
import type { LeaderboardRow } from "@/lib/db/queries/stats";

interface Props {
  rows: LeaderboardRow[];
}

export function LeaderboardTable({ rows }: Props) {
  const sorted = rows
    .slice()
    .sort(
      (a, b) =>
        b.goalsScored - a.goalsScored ||
        b.matchesPlayed - a.matchesPlayed ||
        a.nickname.localeCompare(b.nickname),
    );

  if (sorted.every((r) => r.matchesPlayed === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-pitch-100 bg-white p-12 text-center">
        <p className="text-pitch-700">No matches recorded yet. Stats will appear after a result is entered.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-pitch-100 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-pitch-100 text-xs uppercase tracking-wide text-pitch-700">
            <th className="px-3 py-3 text-left">#</th>
            <th className="px-3 py-3 text-left">Player</th>
            <th className="px-2 py-3 text-right">MP</th>
            <th className="px-2 py-3 text-right">G</th>
            <th className="px-2 py-3 text-right">A</th>
            <th className="px-2 py-3 text-right">W%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const winPct =
              r.matchesPlayed > 0
                ? Math.round((r.wins / r.matchesPlayed) * 100)
                : null;
            return (
              <tr key={r.playerId} className="border-b border-pitch-100 last:border-b-0">
                <td className="px-3 py-3 text-pitch-700">{i + 1}</td>
                <td className="px-3 py-3">
                  <Link
                    href={`/p/player/${r.playerId}`}
                    className="font-semibold text-pitch-900 hover:text-pitch-600"
                  >
                    {r.nickname}
                  </Link>
                  {r.jerseyNumber !== null && (
                    <span className="ml-2 text-xs text-pitch-700">#{r.jerseyNumber}</span>
                  )}
                </td>
                <td className="px-2 py-3 text-right font-medium text-pitch-900">
                  {r.matchesPlayed}
                </td>
                <td className="px-2 py-3 text-right font-medium text-pitch-900">
                  {r.goalsScored}
                </td>
                <td className="px-2 py-3 text-right font-medium text-pitch-900">
                  {r.assists}
                </td>
                <td className="px-2 py-3 text-right font-medium text-pitch-900">
                  {winPct === null ? "—" : `${winPct}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
