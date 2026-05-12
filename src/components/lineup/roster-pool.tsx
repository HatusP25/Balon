"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Player } from "@/types/player";
import { PlayerChip } from "./player-chip";

function DraggablePlayer({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${player.id}`,
    data: { type: "pool", playerId: player.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex shrink-0 cursor-grab flex-col items-center rounded-lg p-2 transition ${
        isDragging ? "opacity-50" : "hover:bg-pitch-50"
      }`}
    >
      <PlayerChip player={player} size="sm" />
    </div>
  );
}

export function RosterPool({
  available,
  selectedIds,
}: {
  available: Player[];
  selectedIds: Set<string>;
}) {
  const remaining = available.filter((p) => !selectedIds.has(p.id));
  return (
    <div className="rounded-xl border border-pitch-100 bg-white p-3">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-pitch-700">
        Available ({remaining.length})
      </p>
      <div className="flex flex-wrap gap-1">
        {remaining.map((p) => (
          <DraggablePlayer key={p.id} player={p} />
        ))}
        {remaining.length === 0 && (
          <p className="px-2 py-4 text-xs text-pitch-700">All players placed.</p>
        )}
      </div>
    </div>
  );
}
