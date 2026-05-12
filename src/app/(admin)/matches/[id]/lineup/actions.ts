"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  insertEmptySlot,
  assignPlayerToSlot,
  updateSlotPosition,
  deleteSlot,
} from "@/lib/db/queries/lineup-slots";
import { bumpLineupVersion, updateMatch } from "@/lib/db/queries/matches";
import { createPlayer } from "@/lib/db/queries/players";

const PositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export async function moveSlotAction(
  matchId: string,
  slotId: string,
  x: number,
  y: number,
): Promise<void> {
  const parsed = PositionSchema.safeParse({ x, y });
  if (!parsed.success) return;
  await updateSlotPosition(slotId, parsed.data.x, parsed.data.y);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}

export async function assignPlayerAction(
  matchId: string,
  slotId: string,
  playerId: string | null,
): Promise<void> {
  await assignPlayerToSlot(slotId, playerId);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}

export async function addSlotAction(
  matchId: string,
  x: number,
  y: number,
  role: "FW" | "MF" | "DF" | "GK",
  playerId: string | null,
): Promise<{ id: string }> {
  const parsed = PositionSchema.safeParse({ x, y });
  if (!parsed.success) throw new Error("Invalid position");
  const slot = await insertEmptySlot(matchId, parsed.data.x, parsed.data.y, role);
  if (playerId) await assignPlayerToSlot(slot.id, playerId);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
  return { id: slot.id };
}

export async function removeSlotAction(matchId: string, slotId: string): Promise<void> {
  await deleteSlot(slotId);
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}

export async function updateFormationAction(
  matchId: string,
  formation: "3-3-2" | "3-2-3" | "4-3-1" | "2-3-3" | "custom",
): Promise<void> {
  await updateMatch(matchId, { formation });
  await bumpLineupVersion(matchId);
  revalidatePath(`/matches/${matchId}/lineup`);
}

export async function createGuestAction(nickname: string): Promise<{ id: string }> {
  const cleaned = nickname.trim();
  if (cleaned.length === 0) throw new Error("nickname required");
  const guest = await createPlayer({ nickname: cleaned, isRegular: false, isActive: true });
  return { id: guest.id };
}
