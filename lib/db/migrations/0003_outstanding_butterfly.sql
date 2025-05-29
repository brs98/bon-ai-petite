CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"ingredients" jsonb NOT NULL,
	"instructions" text[] NOT NULL,
	"nutrition" jsonb NOT NULL,
	"prep_time_minutes" integer,
	"cook_time_minutes" integer,
	"servings" integer,
	"difficulty" varchar(20),
	"cuisine_type" varchar(50),
	"meal_type" varchar(20) NOT NULL,
	"tags" text[],
	"is_saved" boolean DEFAULT false NOT NULL,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipes_user_id_idx" ON "recipes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipes_meal_type_idx" ON "recipes" USING btree ("meal_type");--> statement-breakpoint
CREATE INDEX "recipes_created_at_idx" ON "recipes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "recipes_is_saved_idx" ON "recipes" USING btree ("is_saved");--> statement-breakpoint
CREATE INDEX "recipes_name_search_idx" ON "recipes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "recipes_description_search_idx" ON "recipes" USING btree ("description");