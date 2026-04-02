CREATE TYPE "public"."role" AS ENUM('ADMIN', 'PLAYER');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"suit" text NOT NULL,
	"base_power" integer NOT NULL,
	"edition_id" text NOT NULL,
	"bonus_rule" jsonb NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	CONSTRAINT "cards_name_edition_id_unique" UNIQUE("name","edition_id")
);
--> statement-breakpoint
CREATE TABLE "editions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "editions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hand_cards" (
	"session_player_id" text NOT NULL,
	"card_id" text NOT NULL,
	CONSTRAINT "hand_cards_session_player_id_card_id_pk" PRIMARY KEY("session_player_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"used_at" timestamp,
	"used_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "session_editions" (
	"session_id" text NOT NULL,
	"edition_id" text NOT NULL,
	CONSTRAINT "session_editions_session_id_edition_id_pk" PRIMARY KEY("session_id","edition_id")
);
--> statement-breakpoint
CREATE TABLE "session_players" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"final_score" integer,
	CONSTRAINT "session_players_session_id_user_id_unique" UNIQUE("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"status" "session_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'PLAYER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hand_cards" ADD CONSTRAINT "hand_cards_session_player_id_session_players_id_fk" FOREIGN KEY ("session_player_id") REFERENCES "public"."session_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hand_cards" ADD CONSTRAINT "hand_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_editions" ADD CONSTRAINT "session_editions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_editions" ADD CONSTRAINT "session_editions_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;