CREATE TABLE "meal_plan_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"recipe_id" integer,
	"category" varchar(20) NOT NULL,
	"day_number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"custom_preferences" jsonb,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"ingredients" jsonb NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"checked_items" integer DEFAULT 0 NOT NULL,
	"export_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_meal_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"breakfast_count" integer DEFAULT 0 NOT NULL,
	"lunch_count" integer DEFAULT 0 NOT NULL,
	"dinner_count" integer DEFAULT 0 NOT NULL,
	"snack_count" integer DEFAULT 0 NOT NULL,
	"total_meals" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"global_preferences" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_plan_id_weekly_meal_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."weekly_meal_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_plan_id_weekly_meal_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."weekly_meal_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_meal_plans" ADD CONSTRAINT "weekly_meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_plan_items_plan_id_idx" ON "meal_plan_items" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "meal_plan_items_category_idx" ON "meal_plan_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "meal_plan_items_status_idx" ON "meal_plan_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meal_plan_items_plan_category_day_idx" ON "meal_plan_items" USING btree ("plan_id","category","day_number");--> statement-breakpoint
CREATE INDEX "shopping_lists_plan_id_idx" ON "shopping_lists" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "shopping_lists_created_at_idx" ON "shopping_lists" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "weekly_meal_plans_user_id_idx" ON "weekly_meal_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_meal_plans_status_idx" ON "weekly_meal_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "weekly_meal_plans_created_at_idx" ON "weekly_meal_plans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "weekly_meal_plans_start_date_idx" ON "weekly_meal_plans" USING btree ("start_date");