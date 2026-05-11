CREATE TYPE "public"."match_status" AS ENUM('planned', 'played');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('FW', 'MF', 'DF', 'GK');--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"scorer_id" uuid NOT NULL,
	"assist_id" uuid,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lineup_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid,
	"x" numeric(5, 2) NOT NULL,
	"y" numeric(5, 2) NOT NULL,
	"role" "position" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_appearances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_slug" text NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"opponent_name" text,
	"our_score" integer,
	"their_score" integer,
	"formation" text NOT NULL,
	"status" "match_status" DEFAULT 'planned' NOT NULL,
	"lineup_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nickname" text NOT NULL,
	"jersey_number" integer,
	"avatar_path" text,
	"preferred_position" "position",
	"is_regular" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_scorer_id_players_id_fk" FOREIGN KEY ("scorer_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_assist_id_players_id_fk" FOREIGN KEY ("assist_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_slots" ADD CONSTRAINT "lineup_slots_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_slots" ADD CONSTRAINT "lineup_slots_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_appearances" ADD CONSTRAINT "match_appearances_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_appearances" ADD CONSTRAINT "match_appearances_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_match_idx" ON "goals" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "goals_scorer_idx" ON "goals" USING btree ("scorer_id");--> statement-breakpoint
CREATE INDEX "goals_assist_idx" ON "goals" USING btree ("assist_id");--> statement-breakpoint
CREATE INDEX "lineup_slots_match_idx" ON "lineup_slots" USING btree ("match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appearances_match_player_unique" ON "match_appearances" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE INDEX "appearances_player_idx" ON "match_appearances" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_short_slug_unique" ON "matches" USING btree ("short_slug");--> statement-breakpoint
CREATE INDEX "matches_played_at_idx" ON "matches" USING btree ("played_at");--> statement-breakpoint
CREATE UNIQUE INDEX "players_nickname_unique" ON "players" USING btree ("nickname");