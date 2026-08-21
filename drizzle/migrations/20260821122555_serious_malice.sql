CREATE TABLE "discard_cards" (
	"session_id" text NOT NULL,
	"card_id" text NOT NULL,
	CONSTRAINT "discard_cards_session_id_card_id_pk" PRIMARY KEY("session_id","card_id")
);
--> statement-breakpoint
ALTER TABLE "discard_cards" ADD CONSTRAINT "discard_cards_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discard_cards" ADD CONSTRAINT "discard_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;