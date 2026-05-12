import { eq, desc, gte, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matches, type Match, type NewMatch } from "@/lib/db/schema";

export async function listMatches(): Promise<Match[]> {
  return db.select().from(matches).orderBy(desc(matches.playedAt));
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  const rows = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return rows[0];
}

export async function getMatchBySlug(slug: string): Promise<Match | undefined> {
  const rows = await db.select().from(matches).where(eq(matches.shortSlug, slug)).limit(1);
  return rows[0];
}

export async function createMatch(input: NewMatch): Promise<Match> {
  const [row] = await db.insert(matches).values(input).returning();
  return row;
}

export async function updateMatch(id: string, patch: Partial<NewMatch>): Promise<Match> {
  const [row] = await db
    .update(matches)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(matches.id, id))
    .returning();
  return row;
}

export async function deleteMatch(id: string): Promise<void> {
  await db.delete(matches).where(eq(matches.id, id));
}

export async function bumpLineupVersion(id: string): Promise<void> {
  const m = await getMatchById(id);
  if (!m) return;
  await db
    .update(matches)
    .set({ lineupVersion: m.lineupVersion + 1, updatedAt: new Date() })
    .where(eq(matches.id, id));
}

export async function getNextPlannedMatch(): Promise<Match | undefined> {
  const now = new Date();
  const rows = await db
    .select()
    .from(matches)
    .where(and(eq(matches.status, "planned"), gte(matches.playedAt, now)))
    .orderBy(matches.playedAt)
    .limit(1);
  return rows[0];
}
