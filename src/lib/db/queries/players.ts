import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players, type Player, type NewPlayer } from "@/lib/db/schema";

export async function listActiveRegulars(): Promise<Player[]> {
  return db
    .select()
    .from(players)
    .where(and(eq(players.isRegular, true), eq(players.isActive, true)))
    .orderBy(desc(players.createdAt));
}

export async function listArchivedAndGuests(): Promise<Player[]> {
  return db
    .select()
    .from(players)
    .where(and(eq(players.isActive, false)))
    .orderBy(desc(players.createdAt));
}

export async function getPlayerById(id: string): Promise<Player | undefined> {
  const rows = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return rows[0];
}

export async function createPlayer(input: NewPlayer): Promise<Player> {
  const [row] = await db.insert(players).values(input).returning();
  return row;
}

export async function updatePlayer(id: string, patch: Partial<NewPlayer>): Promise<Player> {
  const [row] = await db
    .update(players)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(players.id, id))
    .returning();
  return row;
}

export async function archivePlayer(id: string): Promise<void> {
  await db
    .update(players)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(players.id, id));
}

export async function listAllAssignable(): Promise<Player[]> {
  // For Plan 2 simplicity: just active regulars.
  // Guests created on the fly will appear since they have isRegular=false, isActive=true; we don't filter for that yet.
  return listActiveRegulars();
}

export async function createGuest(nickname: string): Promise<Player> {
  return createPlayer({ nickname, isRegular: false, isActive: true });
}
