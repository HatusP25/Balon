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
  const rows = await db
    .select({
      playerId: players.id,
      nickname: players.nickname,
      jerseyNumber: players.jerseyNumber,
      avatarPath: players.avatarPath,
      matchesPlayed: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' THEN ${matchAppearances.matchId} END)::int`,
      goalsScored: sql<number>`COUNT(DISTINCT ${goals.id})::int`,
      assists: sql<number>`COALESCE(SUM(CASE WHEN ${goals.assistId} = ${players.id} THEN 1 ELSE 0 END), 0)::int`,
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

  return rows;
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

  const aggregates = await db
    .select({
      matchesPlayed: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' THEN ${matchAppearances.matchId} END)::int`,
      goalsScored: sql<number>`COUNT(DISTINCT ${goals.id})::int`,
      assists: sql<number>`COALESCE(SUM(CASE WHEN ${goals.assistId} = ${playerId} THEN 1 ELSE 0 END), 0)::int`,
      wins: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} > ${matches.theirScore} THEN ${matches.id} END)::int`,
      losses: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} < ${matches.theirScore} THEN ${matches.id} END)::int`,
      draws: sql<number>`COUNT(DISTINCT CASE WHEN ${matches.status} = 'played' AND ${matches.ourScore} = ${matches.theirScore} THEN ${matches.id} END)::int`,
    })
    .from(matchAppearances)
    .leftJoin(matches, eq(matches.id, matchAppearances.matchId))
    .leftJoin(goals, and(eq(goals.matchId, matches.id), eq(goals.scorerId, playerId)))
    .where(eq(matchAppearances.playerId, playerId));

  const stats = aggregates[0] ?? {
    matchesPlayed: 0,
    goalsScored: 0,
    assists: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };

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
