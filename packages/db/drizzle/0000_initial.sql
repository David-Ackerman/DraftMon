CREATE TABLE "accounts" (
	"username" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bug_reports" (
	"issue" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lobbies" (
	"code" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lobby_members" (
	"code" text NOT NULL,
	"player" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "lobby_members_code_player_pk" PRIMARY KEY("code","player")
);
--> statement-breakpoint
CREATE TABLE "pokedex" (
	"player" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"hash" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_matches" (
	"code" text NOT NULL,
	"round" integer NOT NULL,
	"slot" integer NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "tournament_matches_code_round_slot_pk" PRIMARY KEY("code","round","slot")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"code" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lobby_members" ADD CONSTRAINT "lobby_members_code_lobbies_code_fk" FOREIGN KEY ("code") REFERENCES "public"."lobbies"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_code_tournaments_code_fk" FOREIGN KEY ("code") REFERENCES "public"."tournaments"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_code_lobbies_code_fk" FOREIGN KEY ("code") REFERENCES "public"."lobbies"("code") ON DELETE cascade ON UPDATE no action;