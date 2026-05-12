import { Pitch } from "@/components/lineup/pitch";
import { PlayerChip } from "@/components/lineup/player-chip";
import type { Player } from "@/types/player";
import type { SlotRow } from "@/lib/db/queries/lineup-slots";

interface Props {
  slots: SlotRow[];
  players: Player[];
}

export function PublicPitch({ slots, players }: Props) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  return (
    <Pitch>
      {slots.map((s) => {
        const player = s.playerId ? playerById.get(s.playerId) ?? null : null;
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${Number(s.x)}%`,
              top: `${Number(s.y)}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <PlayerChip player={player} />
          </div>
        );
      })}
    </Pitch>
  );
}
