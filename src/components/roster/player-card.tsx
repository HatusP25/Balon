import Link from "next/link";
import type { Player } from "@/types/player";

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/roster/${player.id}/edit`}
      className="group flex flex-col items-center rounded-xl border border-pitch-100 bg-white p-4 transition hover:border-pitch-600"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-pitch-100">
        {player.avatarPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/avatars/${encodePath(player.avatarPath)}`}
            alt={player.nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-pitch-600">
            {player.nickname[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        {player.jerseyNumber !== null && (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-pitch-600 text-xs font-bold text-white">
            {player.jerseyNumber}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-pitch-900">{player.nickname}</p>
      {player.preferredPosition && (
        <p className="text-xs text-pitch-700">{player.preferredPosition}</p>
      )}
    </Link>
  );
}

function encodePath(p: string) {
  return p.split("/").pop() ?? p;
}
