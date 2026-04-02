ALTER TABLE "session_players" DROP CONSTRAINT "session_players_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "session_players" DROP CONSTRAINT "session_players_session_id_user_id_unique";--> statement-breakpoint
ALTER TABLE "session_players" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "session_players" ADD COLUMN "nickname" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "session_players" ALTER COLUMN "nickname" DROP DEFAULT;
