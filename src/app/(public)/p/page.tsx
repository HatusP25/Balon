import Link from "next/link";
import { getNextPlannedMatch } from "@/lib/db/queries/matches";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const next = await getNextPlannedMatch();

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
    </div>
  );
}
