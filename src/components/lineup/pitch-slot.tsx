import { PlayerChip } from "./player-chip";
import type { Player } from "@/types/player";

interface Props {
  x: number;
  y: number;
  player: Pick<Player, "id" | "nickname" | "jerseyNumber" | "avatarPath"> | null;
  onClick?: () => void;
  isDragging?: boolean;
}

export function PitchSlot({ x, y, player, onClick, isDragging }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: `${x}%`, top: `${y}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${
        isDragging ? "z-20 scale-110" : "z-10"
      }`}
      aria-label={player ? `Edit ${player.nickname}` : "Add player"}
    >
      <PlayerChip player={player} />
    </button>
  );
}
