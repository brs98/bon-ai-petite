ALTER TABLE "meal_plan_items" DROP CONSTRAINT "meal_plan_items_plan_id_weekly_meal_plans_id_fk";
--> statement-breakpoint
ALTER TABLE "shopping_lists" DROP CONSTRAINT "shopping_lists_plan_id_weekly_meal_plans_id_fk";
--> statement-breakpoint
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_plan_id_weekly_meal_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."weekly_meal_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_plan_id_weekly_meal_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."weekly_meal_plans"("id") ON DELETE cascade ON UPDATE no action;