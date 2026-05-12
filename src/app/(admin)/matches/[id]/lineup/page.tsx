import { notFound } from "next/navigation";
import { getMatchById } from "@/lib/db/queries/matches";
import { listSlotsForMatch } from "@/lib/db/queries/lineup-slots";
import { listAllAssignable } from "@/lib/db/queries/players";
import { LineupBuilder } from "@/components/lineup/lineup-builder";
import {
  moveSlotAction,
  assignPlayerAction,
  addSlotAction,
  removeSlotAction,
  updateFormationAction,
  createGuestAction,
} from "./actions";

export default async function LineupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const [slots, players] = await Promise.all([
    listSlotsForMatch(match.id),
    listAllAssignable(),
  ]);

  const actions = {
    move: moveSlotAction.bind(null, match.id),
    assign: assignPlayerAction.bind(null, match.id),
    addSlot: addSlotAction.bind(null, match.id),
    remove: removeSlotAction.bind(null, match.id),
    setFormation: updateFormationAction.bind(null, match.id) as (
      formationId: string,
    ) => Promise<void>,
    createGuest: async (nickname: string): Promise<string> => {
      "use server";
      const r = await createGuestAction(nickname);
      return r.id;
    },
  };

  const formattedDate = new Date(match.playedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const publicUrl = `/p/match/${match.shortSlug}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pitch-900">
            {match.opponentName ? `vs ${match.opponentName}` : "Lineup"}
          </h2>
          <p className="text-sm text-pitch-700">{formattedDate}</p>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-pitch-100 bg-white px-3 py-2 text-sm font-medium text-pitch-900 hover:border-pitch-600"
        >
          Public link →
        </a>
      </div>

      <LineupBuilder
        matchId={match.id}
        formation={match.formation}
        slots={slots}
        players={players}
        actions={actions}
      />
    </div>
  );
}
