import Link from "next/link";
import type { PlayerProfile } from "@/lib/db/queries/stats";

interface Props {
  recentMatches: PlayerProfile["recentMatches"];
}

function fmtDate(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentMatchesList({ recentMatches }: Props) {
  if (recentMatches.length === 0) {
    return (
      <p className="rounded-lg bg-white p-4 text-center text-sm text-pitch-700">
        No matches played yet.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {recentMatches.map((m) => {
        const result =
          m.ourScore === null || m.theirScore === null
            ? "—"
            : m.ourScore > m.theirScore
              ? "W"
              : m.ourScore < m.theirScore
                ? "L"
                : "D";
        const resultColor =
          result === "W"
            ? "bg-pitch-600 text-white"
            : result === "L"
              ? "bg-red-600 text-white"
              : "bg-pitch-100 text-pitch-700";
        return (
          <li key={m.matchId}>
            <Link
              href={`/p/match/${m.shortSlug}`}
              className="flex items-center gap-3 rounded-lg border border-pitch-100 bg-white p-3 transition hover:border-pitch-600"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${resultColor}`}
              >
                {result}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-pitch-900">
                  {m.opponentName ? `vs ${m.opponentName}` : "Friendly match"}
                </p>
                <p className="text-xs text-pitch-700">
                  {fmtDate(m.playedAt)} · {m.ourScore ?? "?"}–{m.theirScore ?? "?"}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs text-pitch-700">
                {m.goalsInMatch > 0 && <span className="font-semibold">⚽ {m.goalsInMatch}</span>}
                {m.assistsInMatch > 0 && (
                  <span className="ml-1">A {m.assistsInMatch}</span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
