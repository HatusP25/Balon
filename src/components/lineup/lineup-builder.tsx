"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Player } from "@/types/player";
import type { SlotRow } from "@/lib/db/queries/lineup-slots";
import { Pitch } from "./pitch";
import { PlayerChip } from "./player-chip";
import { RosterPool } from "./roster-pool";
import { PlayerPickerModal } from "./player-picker-modal";
import { FormationTabs } from "./formation-tabs";

interface Props {
  matchId: string;
  formation: string;
  slots: SlotRow[];
  players: Player[];
  actions: {
    move: (slotId: string, x: number, y: number) => Promise<void>;
    assign: (slotId: string, playerId: string | null) => Promise<void>;
    addSlot: (
      x: number,
      y: number,
      role: "FW" | "MF" | "DF" | "GK",
      playerId: string | null,
    ) => Promise<{ id: string }>;
    remove: (slotId: string) => Promise<void>;
    setFormation: (formationId: string) => Promise<void>;
    createGuest: (nickname: string) => Promise<string>;
  };
}

function DroppablePitch({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "pitch", data: { type: "pitch" } });
  return (
    <div ref={setNodeRef} className="relative h-full w-full">
      {children}
    </div>
  );
}

function DraggablePitchSlot({
  slot,
  player,
  onClick,
}: {
  slot: SlotRow;
  player: Player | null;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `slot:${slot.id}`,
    data: { type: "slot", slotId: slot.id },
  });

  // Combine the centering translate (so the chip is centered on its anchor point)
  // with dnd-kit's drag transform (so the chip follows the cursor in real time).
  // Without combining, dnd-kit's transform gets clobbered and the chip stays put
  // visually — only updates after server roundtrip → feels stuttery.
  const dragTransform = transform
    ? ` translate3d(${transform.x}px, ${transform.y}px, 0)`
    : "";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        position: "absolute",
        left: `${Number(slot.x)}%`,
        top: `${Number(slot.y)}%`,
        transform: `translate(-50%, -50%)${dragTransform}`,
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 30 : 10,
        touchAction: "none",
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        aria-label={player ? `Edit ${player.nickname}` : "Add player"}
      >
        <PlayerChip player={player} />
      </button>
    </div>
  );
}

export function LineupBuilder({ matchId, formation, slots, players, actions }: Props) {
  const [pickingSlotId, setPickingSlotId] = useState<string | null>(null);
  // Optimistic local copy of slots: updated instantly on drag-end / assign,
  // then re-synced from server props after revalidation completes.
  const [localSlots, setLocalSlots] = useState<SlotRow[]>(slots);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Re-sync local state when the server returns fresh slot data (after revalidation,
  // or when the formation changes wholesale).
  useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  const slotsById = new Map(localSlots.map((s) => [s.id, s]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const selectedIds = new Set(localSlots.filter((s) => s.playerId).map((s) => s.playerId!));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const overRect = over.rect;
    if (!overRect) return;

    // Case 1: dragging an existing slot on the pitch → move it
    if (typeof active.id === "string" && active.id.startsWith("slot:")) {
      const slotId = active.id.slice("slot:".length);
      const slot = slotsById.get(slotId);
      if (!slot) return;
      const rect = active.rect.current.translated;
      if (!rect) return;
      const cx = rect.left + rect.width / 2 - overRect.left;
      const cy = rect.top + rect.height / 2 - overRect.top;
      const nx = Math.max(0, Math.min(100, (cx / overRect.width) * 100));
      const ny = Math.max(0, Math.min(100, (cy / overRect.height) * 100));

      // Optimistic: lock the new position into local state immediately.
      // Same render tick that dnd-kit clears its transform → no visible snap-back.
      setLocalSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, x: String(nx), y: String(ny) } : s)),
      );
      startTransition(() => {
        void actions.move(slotId, nx, ny);
      });
      return;
    }

    // Case 2: dragging a player from the pool onto the pitch → create slot at drop point
    if (typeof active.id === "string" && active.id.startsWith("pool:")) {
      const playerId = active.id.slice("pool:".length);
      const translated = active.rect.current.translated;
      if (!translated) return;
      const cx = translated.left + translated.width / 2 - overRect.left;
      const cy = translated.top + translated.height / 2 - overRect.top;
      const nx = Math.max(0, Math.min(100, (cx / overRect.width) * 100));
      const ny = Math.max(0, Math.min(100, (cy / overRect.height) * 100));
      const role: "FW" | "MF" | "DF" | "GK" =
        ny < 33 ? "FW" : ny < 66 ? "MF" : ny < 88 ? "DF" : "GK";

      // Optimistic: add a temp slot. Real id arrives on revalidation and useEffect
      // syncs localSlots back to the server-truthful set.
      const tempId = `temp-${Date.now()}`;
      setLocalSlots((prev) => [
        ...prev,
        { id: tempId, matchId, playerId, x: String(nx), y: String(ny), role },
      ]);
      startTransition(() => {
        void actions.addSlot(nx, ny, role, playerId);
      });
      return;
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <FormationTabs current={formation} onChange={actions.setFormation} />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <DroppablePitch>
              <Pitch>
                {localSlots.map((slot) => (
                  <DraggablePitchSlot
                    key={slot.id}
                    slot={slot}
                    player={slot.playerId ? playerById.get(slot.playerId) ?? null : null}
                    onClick={() => setPickingSlotId(slot.id)}
                  />
                ))}
              </Pitch>
            </DroppablePitch>
            <p className="mt-2 text-xs text-pitch-700">
              Tap a slot to assign a player. Drag from the roster onto the pitch to add new positions.
            </p>
          </div>

          <RosterPool available={players} selectedIds={selectedIds} />
        </div>

        <PlayerPickerModal
          open={pickingSlotId !== null}
          onClose={() => setPickingSlotId(null)}
          availablePlayers={players.filter(
            (p) =>
              !selectedIds.has(p.id) ||
              slotsById.get(pickingSlotId ?? "")?.playerId === p.id,
          )}
          onPick={(playerId) => {
            if (!pickingSlotId) return;
            // Optimistic: update assignment locally first.
            setLocalSlots((prev) =>
              prev.map((s) => (s.id === pickingSlotId ? { ...s, playerId } : s)),
            );
            startTransition(() => {
              void actions.assign(pickingSlotId, playerId);
            });
          }}
          onCreateGuest={actions.createGuest}
        />
      </div>
    </DndContext>
  );
}
