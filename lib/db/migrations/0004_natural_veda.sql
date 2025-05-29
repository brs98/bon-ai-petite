CREATE TABLE "recipe_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"liked" boolean,
	"feedback" text,
	"reported_issues" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_feedback" ADD CONSTRAINT "recipe_feedback_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_feedback" ADD CONSTRAINT "recipe_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_feedback_recipe_user_idx" ON "recipe_feedback" USING btree ("recipe_id","user_id");