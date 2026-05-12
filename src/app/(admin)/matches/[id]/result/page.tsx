import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatchById } from "@/lib/db/queries/matches";
import { listAppearancesForMatch } from "@/lib/db/queries/appearances";
import { listGoalsForMatch } from "@/lib/db/queries/goals";
import { listSlotsForMatch } from "@/lib/db/queries/lineup-slots";
import { listAllAssignable } from "@/lib/db/queries/players";
import { ResultForm } from "@/components/results/result-form";
import { saveResultAction, clearResultAction } from "./actions";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const [appearances, goalsRows, slots, players] = await Promise.all([
    listAppearancesForMatch(match.id),
    listGoalsForMatch(match.id),
    listSlotsForMatch(match.id),
    listAllAssignable(),
  ]);

  const defaultAttendance =
    appearances.length > 0
      ? appearances.map((a) => a.playerId)
      : Array.from(
          new Set(slots.map((s) => s.playerId).filter((id): id is string => id !== null)),
        );

  const defaultGoals = goalsRows.map((g) => ({
    scorerId: g.scorerId,
    assistId: g.assistId,
  }));

  const save = saveResultAction.bind(null, match.id);
  const clear = clearResultAction.bind(null, match.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pitch-900">
            Result · {match.opponentName ? `vs ${match.opponentName}` : "Friendly match"}
          </h2>
          <p className="text-sm text-pitch-700">
            {new Date(match.playedAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link
          href={`/matches/${match.id}/lineup`}
          className="text-sm font-medium text-pitch-600 hover:underline"
        >
          ← Back to lineup
        </Link>
      </div>

      <ResultForm
        matchId={match.id}
        initialOurScore={match.ourScore ?? 0}
        initialTheirScore={match.theirScore ?? 0}
        initialAttendance={defaultAttendance}
        initialGoals={defaultGoals}
        allPlayers={players}
        saveAction={save}
        clearAction={clear}
      />
    </div>
  );
}
