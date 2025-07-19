CREATE TABLE "waitlist_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100),
	"reason_for_interest" text NOT NULL,
	"feature_priorities" text[],
	"dietary_goals" text[],
	"dietary_restrictions" text[],
	"cooking_experience" varchar(20),
	"household_size" integer,
	"referral_source" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"status" varchar(20) DEFAULT 'waiting' NOT NULL,
	"priority_score" integer,
	"invited_at" timestamp,
	"joined_at" timestamp,
	"declined_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entries_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "waitlist_entries_email_idx" ON "waitlist_entries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_entries_status_idx" ON "waitlist_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waitlist_entries_priority_score_idx" ON "waitlist_entries" USING btree ("priority_score");--> statement-breakpoint
CREATE INDEX "waitlist_entries_created_at_idx" ON "waitlist_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "waitlist_entries_reason_for_interest_idx" ON "waitlist_entries" USING btree ("reason_for_interest");