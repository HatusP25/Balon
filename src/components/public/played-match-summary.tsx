import { listGoalsForMatch } from "@/lib/db/queries/goals";
import type { Player } from "@/types/player";

interface Props {
  matchId: string;
  ourScore: number;
  theirScore: number;
  players: Player[];
}

export async function PlayedMatchSummary({ matchId, ourScore, theirScore, players }: Props) {
  const goals = await listGoalsForMatch(matchId);
  const playerById = new Map(players.map((p) => [p.id, p]));
  const won = ourScore > theirScore;
  const drew = ourScore === theirScore;

  return (
    <section className="rounded-xl border border-pitch-100 bg-white p-6">
      <p className="text-center text-xs uppercase tracking-wide text-pitch-700">
        Final score
      </p>
      <p className="mt-1 text-center text-4xl font-bold text-pitch-900">
        {ourScore} – {theirScore}
      </p>
      <p
        className={`mt-1 text-center text-sm font-semibold ${
          won ? "text-pitch-600" : drew ? "text-pitch-700" : "text-red-600"
        }`}
      >
        {won ? "Win" : drew ? "Draw" : "Loss"}
      </p>

      {goals.length > 0 && (
        <div className="mt-5 border-t border-pitch-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pitch-700">
            Goalscorers
          </p>
          <ul className="space-y-1">
            {goals.map((g) => {
              const scorer = playerById.get(g.scorerId);
              const assister = g.assistId ? playerById.get(g.assistId) : null;
              return (
                <li key={g.id} className="text-sm text-pitch-900">
                  <span className="font-semibold">⚽ {scorer?.nickname ?? "Unknown"}</span>
                  {assister && (
                    <span className="text-pitch-700"> · assist {assister.nickname}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
