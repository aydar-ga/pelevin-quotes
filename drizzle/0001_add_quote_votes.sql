CREATE TABLE IF NOT EXISTS "quote_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quote_id" integer NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quote_votes" ADD CONSTRAINT "quote_votes_value_check" CHECK ("quote_votes"."value" in (-1, 1));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quote_votes" ADD CONSTRAINT "quote_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quote_votes" ADD CONSTRAINT "quote_votes_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quote_votes_user_quote_idx" ON "quote_votes" USING btree ("user_id","quote_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quote_votes_quote_updated_idx" ON "quote_votes" USING btree ("quote_id","updated_at");
