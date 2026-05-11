import { notFound } from "next/navigation";
import { getPlayerById } from "@/lib/db/queries/players";
import { PlayerForm } from "@/components/roster/player-form";
import { ArchiveButton } from "@/components/roster/archive-button";
import { updatePlayerAction, archivePlayerAction } from "../../actions";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerById(id);
  if (!player) notFound();

  const update = updatePlayerAction.bind(null, id);
  const archive = archivePlayerAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">Edit Player</h2>
        <p className="text-sm text-pitch-700">Update details for {player.nickname}.</p>
      </div>
      <PlayerForm action={update} player={player} submitLabel="Save Changes" />
      <div className="border-t border-pitch-100 pt-6">
        <ArchiveButton archiveAction={archive} />
        <p className="mt-2 text-xs text-pitch-700">
          Archiving hides the player from future lineups but preserves past matches and stats.
        </p>
      </div>
    </div>
  );
}
