CREATE TABLE "nutrition_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"age" integer,
	"height_cm" integer,
	"weight_kg" integer,
	"activity_level" varchar(20),
	"goals" varchar(50),
	"daily_calories" integer,
	"macro_protein_g" integer,
	"macro_carbs_g" integer,
	"macro_fat_g" integer,
	"allergies" text[],
	"dietary_restrictions" text[],
	"cuisine_preferences" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nutrition_profiles" ADD CONSTRAINT "nutrition_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;