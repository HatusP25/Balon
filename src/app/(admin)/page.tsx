import Link from "next/link";
import { listActiveRegulars } from "@/lib/db/queries/players";
import { getNextPlannedMatch, getPendingResultMatch } from "@/lib/db/queries/matches";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [players, nextMatch, pendingResult] = await Promise.all([
    listActiveRegulars(),
    getNextPlannedMatch(),
    getPendingResultMatch(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">Today</h2>
        <p className="text-sm text-pitch-700">Welcome back.</p>
      </div>

      {pendingResult && (
        <Link
          href={`/matches/${pendingResult.id}/result`}
          className="block rounded-xl border border-amber-300 bg-amber-50 p-4 transition hover:border-amber-500"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Pending result
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-900">
            Enter result for {pendingResult.opponentName ? `vs ${pendingResult.opponentName}` : "the match"} on{" "}
            {new Date(pendingResult.playedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="mt-1 text-xs text-amber-700">Click to log score and goalscorers →</p>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Roster</p>
          <p className="mt-2 text-3xl font-bold text-pitch-900">{players.length}</p>
          <p className="mt-1 text-xs text-pitch-700">active regulars</p>
          <Link
            href="/roster"
            className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline"
          >
            Manage roster →
          </Link>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Next match</p>
          {nextMatch ? (
            <>
              <p className="mt-2 text-lg font-bold text-pitch-900">
                {nextMatch.opponentName ? `vs ${nextMatch.opponentName}` : "Friendly match"}
              </p>
              <p className="mt-1 text-xs text-pitch-700">
                {new Date(nextMatch.playedAt).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {nextMatch.formation}
              </p>
              <Link
                href={`/matches/${nextMatch.id}/lineup`}
                className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline"
              >
                Open lineup →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-pitch-700">No planned matches.</p>
              <Link
                href="/matches/new"
                className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline"
              >
                + Create match
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
