import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const positionEnum = pgEnum("position", ["FW", "MF", "DF", "GK"]);
export const matchStatusEnum = pgEnum("match_status", ["planned", "played"]);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nickname: text("nickname").notNull(),
    jerseyNumber: integer("jersey_number"),
    avatarPath: text("avatar_path"),
    preferredPosition: positionEnum("preferred_position"),
    isRegular: boolean("is_regular").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nicknameUnique: uniqueIndex("players_nickname_unique").on(t.nickname),
  }),
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shortSlug: text("short_slug").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull(),
    opponentName: text("opponent_name"),
    ourScore: integer("our_score"),
    theirScore: integer("their_score"),
    formation: text("formation").notNull(),
    status: matchStatusEnum("status").notNull().default("planned"),
    lineupVersion: integer("lineup_version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    shortSlugUnique: uniqueIndex("matches_short_slug_unique").on(t.shortSlug),
    playedAtIdx: index("matches_played_at_idx").on(t.playedAt),
  }),
);

export const lineupSlots = pgTable(
  "lineup_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").references(() => players.id),
    x: numeric("x", { precision: 5, scale: 2 }).notNull(),
    y: numeric("y", { precision: 5, scale: 2 }).notNull(),
    role: positionEnum("role").notNull(),
  },
  (t) => ({
    matchIdx: index("lineup_slots_match_idx").on(t.matchId),
  }),
);

export const matchAppearances = pgTable(
  "match_appearances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
  },
  (t) => ({
    matchPlayerUnique: uniqueIndex("appearances_match_player_unique").on(t.matchId, t.playerId),
    playerIdx: index("appearances_player_idx").on(t.playerId),
  }),
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    scorerId: uuid("scorer_id")
      .notNull()
      .references(() => players.id),
    assistId: uuid("assist_id").references(() => players.id),
    orderIndex: integer("order_index").notNull(),
  },
  (t) => ({
    matchIdx: index("goals_match_idx").on(t.matchId),
    scorerIdx: index("goals_scorer_idx").on(t.scorerId),
    assistIdx: index("goals_assist_idx").on(t.assistId),
  }),
);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
