import Link from "next/link";
import { listMatches } from "@/lib/db/queries/matches";
import { MatchListRow } from "@/components/matches/match-list-row";

export default async function MatchesPage() {
  const matches = await listMatches();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pitch-900">Matches</h2>
          <p className="text-sm text-pitch-700">{matches.length} total</p>
        </div>
        <Link
          href="/matches/new"
          className="inline-flex items-center justify-center rounded-lg bg-pitch-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-pitch-700"
        >
          + New Match
        </Link>
      </div>
      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pitch-100 bg-white p-12 text-center">
          <p className="text-pitch-700">No matches yet. Create your first match.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => (
            <li key={m.id}>
              <MatchListRow match={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
