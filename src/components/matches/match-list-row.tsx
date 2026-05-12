import Link from "next/link";
import type { Match } from "@/lib/db/schema";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MatchListRow({ match }: { match: Match }) {
  const isPlanned = match.status === "planned";
  return (
    <Link
      href={`/matches/${match.id}/lineup`}
      className="flex items-center justify-between rounded-xl border border-pitch-100 bg-white p-4 transition hover:border-pitch-600"
    >
      <div>
        <p className="text-sm font-semibold text-pitch-900">
          {match.opponentName ? `vs ${match.opponentName}` : "vs (no opponent)"}
        </p>
        <p className="text-xs text-pitch-700">
          {fmtDate(match.playedAt)} · {match.formation}
        </p>
      </div>
      {isPlanned ? (
        <span className="rounded-full bg-pitch-100 px-3 py-1 text-xs font-medium text-pitch-700">
          Planned
        </span>
      ) : (
        <span className="rounded-full bg-pitch-600 px-3 py-1 text-xs font-medium text-white">
          {match.ourScore}–{match.theirScore}
        </span>
      )}
    </Link>
  );
}
