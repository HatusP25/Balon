import type { Player } from "@/types/player";

interface Props {
  player: Pick<Player, "id" | "nickname" | "jerseyNumber" | "avatarPath"> | null;
  placeholder?: React.ReactNode;
  size?: "sm" | "md";
}

export function PlayerChip({ player, placeholder, size = "md" }: Props) {
  const dimension = size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
  return (
    <div className="flex flex-col items-center pointer-events-none">
      <div
        className={`relative ${dimension} overflow-hidden rounded-full border-2 border-white bg-white shadow-md`}
      >
        {player?.avatarPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/avatars/${player.avatarPath.split("/").pop()}`}
            alt={player.nickname}
            className="h-full w-full object-cover"
          />
        ) : player ? (
          <div className="flex h-full w-full items-center justify-center bg-pitch-100 font-bold text-pitch-600">
            {player.nickname[0]?.toUpperCase() ?? "?"}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/20 text-white">
            {placeholder ?? "+"}
          </div>
        )}
        {player?.jerseyNumber !== null && player?.jerseyNumber !== undefined && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pitch-600 text-[10px] font-bold text-white">
            {player.jerseyNumber}
          </span>
        )}
      </div>
      {player && (
        <p className="mt-1 max-w-[80px] truncate text-center text-[10px] font-semibold text-white drop-shadow">
          {player.nickname}
        </p>
      )}
    </div>
  );
}
