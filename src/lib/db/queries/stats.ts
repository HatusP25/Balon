import { sql, eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { players, matches, matchAppearances, goals } from "@/lib/db/schema";

export interface LeaderboardRow {
  playerId: string;
  nickname: string;
  jerseyNumber: number | null;
  avatarPath: string | null;
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  wins: number;
  losses: number;
  draws: number;
}

export async function listLeaderboard(): Promise<LeaderboardRow[]> {
  // Base aggregate: matches + scoring + W/L/D, joined via appearances.
  const base = await db
    .select({
      playerId: players.id,
      nickname: players.nickname,
      jerseyNumber: players.jerseyNumber,
      avatarPath: players.avatarPath,
      matchesPlayed: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' THEN ${matchAppearances.matchId} END)::int`,
      goalsScored: sql<number>`COUNT(DISTINCT ${goals.id})::int`,
      wins: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} > ${matches.theirScore} THEN ${matches.id} END)::int`,
      losses: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} < ${matches.theirScore} THEN ${matches.id} END)::int`,
      draws: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} = ${matches.theirScore} THEN ${matches.id} END)::int`,
    })
    .from(players)
    .leftJoin(matchAppearances, eq(matchAppearances.playerId, players.id))
    .leftJoin(matches, eq(matches.id, matchAppearances.matchId))
    .leftJoin(goals, and(eq(goals.matchId, matches.id), eq(goals.scorerId, players.id)))
    .where(eq(players.isActive, true))
    .groupBy(players.id, players.nickname, players.jerseyNumber, players.avatarPath);

  // Independent aggregate: assists per player (across played matches only).
  const assistRows = await db
    .select({
      playerId: players.id,
      assists: sql<number>`COUNT(${goals.id})::int`,
    })
    .from(players)
    .leftJoin(goals, eq(goals.assistId, players.id))
    .leftJoin(matches, and(eq(matches.id, goals.matchId), eq(matches.status, "played")))
    .where(eq(players.isActive, true))
    .groupBy(players.id);

  const assistsByPlayer = new Map(assistRows.map((r) => [r.playerId, r.assists]));

  return base.map((r) => ({
    ...r,
    assists: assistsByPlayer.get(r.playerId) ?? 0,
  }));
}

export interface PlayerProfile {
  player: {
    id: string;
    nickname: string;
    jerseyNumber: number | null;
    avatarPath: string | null;
    preferredPosition: string | null;
  };
  stats: {
    matchesPlayed: number;
    goalsScored: number;
    assists: number;
    wins: number;
    losses: number;
    draws: number;
  };
  recentMatches: Array<{
    matchId: string;
    shortSlug: string;
    playedAt: Date;
    opponentName: string | null;
    ourScore: number | null;
    theirScore: number | null;
    goalsInMatch: number;
    assistsInMatch: number;
  }>;
}

export async function getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
  const playerRow = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (playerRow.length === 0) return null;

  const baseRows = await db
    .select({
      matchesPlayed: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' THEN ${matchAppearances.matchId} END)::int`,
      goalsScored: sql<number>`COUNT(DISTINCT ${goals.id})::int`,
      wins: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} > ${matches.theirScore} THEN ${matches.id} END)::int`,
      losses: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} < ${matches.theirScore} THEN ${matches.id} END)::int`,
      draws: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} = ${matches.theirScore} THEN ${matches.id} END)::int`,
    })
    .from(matchAppearances)
    .leftJoin(matches, eq(matches.id, matchAppearances.matchId))
    .leftJoin(goals, and(eq(goals.matchId, matches.id), eq(goals.scorerId, playerId)))
    .where(eq(matchAppearances.playerId, playerId));

  const base = baseRows[0] ?? {
    matchesPlayed: 0,
    goalsScored: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };

  const assistRows = await db
    .select({
      assists: sql<number>`COUNT(${goals.id})::int`,
    })
    .from(goals)
    .innerJoin(matches, and(eq(matches.id, goals.matchId), eq(matches.status, "played")))
    .where(eq(goals.assistId, playerId));

  const assists = assistRows[0]?.assists ?? 0;

  const stats = { ...base, assists };

  const recent = await db
    .select({
      matchId: matches.id,
      shortSlug: matches.shortSlug,
      playedAt: matches.playedAt,
      opponentName: matches.opponentName,
      ourScore: matches.ourScore,
      theirScore: matches.theirScore,
      goalsInMatch: sql<number>`(SELECT COUNT(*)::int FROM ${goals} WHERE ${goals.matchId} = ${matches.id} AND ${goals.scorerId} = ${playerId})`,
      assistsInMatch: sql<number>`(SELECT COUNT(*)::int FROM ${goals} WHERE ${goals.matchId} = ${matches.id} AND ${goals.assistId} = ${playerId})`,
    })
    .from(matchAppearances)
    .innerJoin(matches, eq(matches.id, matchAppearances.matchId))
    .where(and(eq(matchAppearances.playerId, playerId), eq(matches.status, "played")))
    .orderBy(desc(matches.playedAt))
    .limit(10);

  const p = playerRow[0];
  return {
    player: {
      id: p.id,
      nickname: p.nickname,
      jerseyNumber: p.jerseyNumber,
      avatarPath: p.avatarPath,
      preferredPosition: p.preferredPosition,
    },
    stats,
    recentMatches: recent,
  };
}

export async function getLastPlayedMatch() {
  const rows = await db
    .select()
    .from(matches)
    .where(eq(matches.status, "played"))
    .orderBy(desc(matches.playedAt))
    .limit(1);
  return rows[0];
}
