import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { lineupSlots } from "@/lib/db/schema";
import type { Role } from "@/lib/formations";

export interface SlotRow {
  id: string;
  matchId: string;
  playerId: string | null;
  x: string; // numeric column comes back as string from postgres.js
  y: string;
  role: Role;
}

export async function listSlotsForMatch(matchId: string): Promise<SlotRow[]> {
  const rows = await db.select().from(lineupSlots).where(eq(lineupSlots.matchId, matchId));
  return rows.map((r) => ({
    id: r.id,
    matchId: r.matchId,
    playerId: r.playerId,
    x: r.x as unknown as string,
    y: r.y as unknown as string,
    role: r.role as Role,
  }));
}

export async function insertSlots(
  matchId: string,
  slots: { x: number; y: number; role: Role; playerId?: string | null }[],
): Promise<void> {
  if (slots.length === 0) return;
  await db.insert(lineupSlots).values(
    slots.map((s) => ({
      matchId,
      x: String(s.x),
      y: String(s.y),
      role: s.role,
      playerId: s.playerId ?? null,
    })),
  );
}

export async function updateSlotPosition(
  slotId: string,
  x: number,
  y: number,
): Promise<void> {
  await db
    .update(lineupSlots)
    .set({ x: String(x), y: String(y) })
    .where(eq(lineupSlots.id, slotId));
}

export async function assignPlayerToSlot(
  slotId: string,
  playerId: string | null,
): Promise<void> {
  await db.update(lineupSlots).set({ playerId }).where(eq(lineupSlots.id, slotId));
}

export async function deleteSlot(slotId: string): Promise<void> {
  await db.delete(lineupSlots).where(eq(lineupSlots.id, slotId));
}

export async function deleteAllSlotsForMatch(matchId: string): Promise<void> {
  await db.delete(lineupSlots).where(eq(lineupSlots.matchId, matchId));
}

export async function insertEmptySlot(
  matchId: string,
  x: number,
  y: number,
  role: Role,
): Promise<SlotRow> {
  const [row] = await db
    .insert(lineupSlots)
    .values({ matchId, x: String(x), y: String(y), role, playerId: null })
    .returning();
  return {
    id: row.id,
    matchId: row.matchId,
    playerId: row.playerId,
    x: row.x as unknown as string,
    y: row.y as unknown as string,
    role: row.role as Role,
  };
}
