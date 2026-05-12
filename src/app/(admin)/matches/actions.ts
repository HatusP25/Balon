"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createMatch, deleteMatch, bumpLineupVersion } from "@/lib/db/queries/matches";
import { insertSlots } from "@/lib/db/queries/lineup-slots";
import { generateShortSlug } from "@/lib/slugs";
import { getFormation } from "@/lib/formations";

const MatchSchema = z.object({
  playedAt: z.string().min(1, "Date is required"),
  opponentName: z.string().trim().max(80).optional(),
  formation: z.enum(["3-3-2", "3-2-3", "4-3-1", "2-3-3", "custom"]),
});

type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function createMatchAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = {
    playedAt: String(fd.get("playedAt") ?? ""),
    opponentName: String(fd.get("opponentName") ?? "").trim() || undefined,
    formation: String(fd.get("formation") ?? "") as
      | "3-3-2"
      | "3-2-3"
      | "4-3-1"
      | "2-3-3"
      | "custom",
  };
  const parsed = MatchSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const playedAt = new Date(parsed.data.playedAt);
  if (isNaN(playedAt.getTime())) {
    return { fieldErrors: { playedAt: "Invalid date" } };
  }

  const match = await createMatch({
    shortSlug: generateShortSlug(),
    playedAt,
    opponentName: parsed.data.opponentName ?? null,
    formation: parsed.data.formation,
    status: "planned",
  });

  // Seed lineup slots from the preset
  const formation = getFormation(parsed.data.formation);
  if (formation && formation.slots.length > 0) {
    await insertSlots(
      match.id,
      formation.slots.map((s) => ({ x: s.x, y: s.y, role: s.role, playerId: null })),
    );
  }

  revalidatePath("/matches");
  redirect(`/matches/${match.id}/lineup`);
}

export async function deleteMatchAction(id: string): Promise<void> {
  await deleteMatch(id);
  revalidatePath("/matches");
  redirect("/matches");
}

export async function bumpVersionAction(matchId: string): Promise<void> {
  await bumpLineupVersion(matchId);
}
