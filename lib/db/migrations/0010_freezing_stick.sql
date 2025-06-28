ALTER TABLE "nutrition_profiles" ADD COLUMN "height_in" integer;--> statement-breakpoint
ALTER TABLE "nutrition_profiles" ADD COLUMN "weight_lbs" integer;--> statement-breakpoint
ALTER TABLE "nutrition_profiles" DROP COLUMN "height_cm";--> statement-breakpoint
ALTER TABLE "nutrition_profiles" DROP COLUMN "weight_kg";