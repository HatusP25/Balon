import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { goals } from "@/lib/db/schema";

export interface GoalInput {
  scorerId: string;
  assistId: string | null;
}

export async function listGoalsForMatch(matchId: string) {
  return db
    .select()
    .from(goals)
    .where(eq(goals.matchId, matchId))
    .orderBy(asc(goals.orderIndex));
}

export async function setGoalsForMatch(matchId: string, input: GoalInput[]): Promise<void> {
  await db.delete(goals).where(eq(goals.matchId, matchId));
  if (input.length === 0) return;
  await db.insert(goals).values(
    input.map((g, i) => ({
      matchId,
      scorerId: g.scorerId,
      assistId: g.assistId,
      orderIndex: i,
    })),
  );
}
