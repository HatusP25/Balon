import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matchAppearances } from "@/lib/db/schema";

export async function listAppearancesForMatch(matchId: string) {
  return db.select().from(matchAppearances).where(eq(matchAppearances.matchId, matchId));
}

export async function setAppearancesForMatch(
  matchId: string,
  playerIds: string[],
): Promise<void> {
  // Idempotent replace: clear then insert.
  await db.delete(matchAppearances).where(eq(matchAppearances.matchId, matchId));
  if (playerIds.length === 0) return;
  await db.insert(matchAppearances).values(playerIds.map((playerId) => ({ matchId, playerId })));
}
