import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const nutritionProfiles = pgTable(
  'nutrition_profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    age: integer('age'),
    height: integer('height_in'), // height in inches
    weight: integer('weight_lbs'), // weight in pounds
    activityLevel: varchar('activity_level', { length: 20 }),
    goals: varchar('goals', { length: 50 }), // lose_weight, gain_muscle, maintain
    dailyCalories: integer('daily_calories'),
    macroProtein: integer('macro_protein_g'),
    macroCarbs: integer('macro_carbs_g'),
    macroFat: integer('macro_fat_g'),
    allergies: text('allergies').array(),
    dietaryRestrictions: text('dietary_restrictions').array(),
    cuisinePreferences: text('cuisine_preferences').array(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    userIdIdx: index('nutrition_profiles_user_id_idx').on(table.userId),
    createdAtIdx: index('nutrition_profiles_created_at_idx').on(
      table.createdAt,
    ),
  }),
);

export const recipes = pgTable(
  'recipes',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    ingredients: jsonb('ingredients').notNull(), // [{ name, quantity, unit }]
    instructions: text('instructions').array().notNull(),
    nutrition: jsonb('nutrition').notNull(), // { calories, protein, carbs, fat }
    prepTime: integer('prep_time_minutes'),
    cookTime: integer('cook_time_minutes'),
    servings: integer('servings'),
    difficulty: varchar('difficulty', { length: 20 }),
    cuisineType: varchar('cuisine_type', { length: 50 }),
    mealType: varchar('meal_type', { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
    tags: text('tags').array(),
    isSaved: boolean('is_saved').notNull().default(false),
    rating: integer('rating'), // 1-5 stars
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => ({
    userIdIdx: index('recipes_user_id_idx').on(table.userId),
    mealTypeIdx: index('recipes_meal_type_idx').on(table.mealType),
    createdAtIdx: index('recipes_created_at_idx').on(table.createdAt),
    isSavedIdx: index('recipes_is_saved_idx').on(table.isSaved),
    nameSearchIdx: index('recipes_name_search_idx').on(table.name),
    descriptionSearchIdx: index('recipes_description_search_idx').on(
      table.description,
    ),
  }),
);

export const recipeFeedback = pgTable(
  'recipe_feedback',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    liked: boolean('liked'),
    feedback: text('feedback'), // reasons for dislike
    reportedIssues: text('reported_issues').array(), // too_complex, bad_ingredients, etc
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => ({
    recipeUserIdx: index('recipe_feedback_recipe_user_idx').on(
      table.recipeId,
      table.userId,
    ),
  }),
);

export const usageTracking = pgTable(
  'usage_tracking',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    action: varchar('action', { length: 50 }).notNull(), // recipe_generation, meal_plan_creation
    date: date('date').notNull(),
    count: integer('count').notNull().default(1),
  },
  table => ({
    userDateActionIdx: index('usage_tracking_user_date_action_idx').on(
      table.userId,
      table.date,
      table.action,
    ),
  }),
);

export const usersRelations = relations(users, ({ many, one }) => ({
  nutritionProfile: one(nutritionProfiles),
  recipes: many(recipes),
  recipeFeedback: many(recipeFeedback),
  usageTracking: many(usageTracking),
  weeklyMealPlans: many(weeklyMealPlans),
}));

export const nutritionProfilesRelations = relations(
  nutritionProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [nutritionProfiles.userId],
      references: [users.id],
    }),
  }),
);

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  recipeFeedback: many(recipeFeedback),
  mealPlanItems: many(mealPlanItems),
}));

export const recipeFeedbackRelations = relations(recipeFeedback, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeFeedback.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeFeedback.userId],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NutritionProfile = typeof nutritionProfiles.$inferSelect;
export type NewNutritionProfile = typeof nutritionProfiles.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type RecipeFeedback = typeof recipeFeedback.$inferSelect;
export type NewRecipeFeedback = typeof recipeFeedback.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type NewUsageTracking = typeof usageTracking.$inferInsert;

// Weekly Meal Planning Tables
export const weeklyMealPlans = pgTable(
  'weekly_meal_plans',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    breakfastCount: integer('breakfast_count').notNull().default(0),
    lunchCount: integer('lunch_count').notNull().default(0),
    dinnerCount: integer('dinner_count').notNull().default(0),
    snackCount: integer('snack_count').notNull().default(0),
    totalMeals: integer('total_meals').notNull().default(0),
    status: varchar('status', { length: 20 }).notNull().default('in_progress'), // in_progress, completed, archived
    globalPreferences: jsonb('global_preferences'), // Override preferences for entire plan
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    userIdIdx: index('weekly_meal_plans_user_id_idx').on(table.userId),
    statusIdx: index('weekly_meal_plans_status_idx').on(table.status),
    createdAtIdx: index('weekly_meal_plans_created_at_idx').on(table.createdAt),
    startDateIdx: index('weekly_meal_plans_start_date_idx').on(table.startDate),
  }),
);

export const mealPlanItems = pgTable(
  'meal_plan_items',
  {
    id: serial('id').primaryKey(),
    planId: integer('plan_id')
      .notNull()
      .references(() => weeklyMealPlans.id, { onDelete: 'cascade' }),
    recipeId: integer('recipe_id').references(() => recipes.id), // null when not yet generated
    category: varchar('category', { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
    dayNumber: integer('day_number').notNull(), // 1-7 for days of week
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, generating, generated, locked
    customPreferences: jsonb('custom_preferences'), // Override preferences for this specific meal
    lockedAt: timestamp('locked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    planIdIdx: index('meal_plan_items_plan_id_idx').on(table.planId),
    categoryIdx: index('meal_plan_items_category_idx').on(table.category),
    statusIdx: index('meal_plan_items_status_idx').on(table.status),
    planCategoryDayIdx: index('meal_plan_items_plan_category_day_idx').on(
      table.planId,
      table.category,
      table.dayNumber,
    ),
  }),
);

export const shoppingLists = pgTable(
  'shopping_lists',
  {
    id: serial('id').primaryKey(),
    planId: integer('plan_id')
      .notNull()
      .references(() => weeklyMealPlans.id, { onDelete: 'cascade' }),
    ingredients: jsonb('ingredients').notNull(), // [{ name, quantity, unit, category, checked }]
    totalItems: integer('total_items').notNull().default(0),
    checkedItems: integer('checked_items').notNull().default(0),
    exportMetadata: jsonb('export_metadata'), // For future integrations (Instacart, etc.)
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    planIdIdx: index('shopping_lists_plan_id_idx').on(table.planId),
    createdAtIdx: index('shopping_lists_created_at_idx').on(table.createdAt),
  }),
);

// Weekly Meal Planning Relations
export const weeklyMealPlansRelations = relations(
  weeklyMealPlans,
  ({ one, many }) => ({
    user: one(users, {
      fields: [weeklyMealPlans.userId],
      references: [users.id],
    }),
    mealPlanItems: many(mealPlanItems),
    shoppingList: one(shoppingLists),
  }),
);

export const mealPlanItemsRelations = relations(mealPlanItems, ({ one }) => ({
  plan: one(weeklyMealPlans, {
    fields: [mealPlanItems.planId],
    references: [weeklyMealPlans.id],
  }),
  recipe: one(recipes, {
    fields: [mealPlanItems.recipeId],
    references: [recipes.id],
  }),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ one }) => ({
  plan: one(weeklyMealPlans, {
    fields: [shoppingLists.planId],
    references: [weeklyMealPlans.id],
  }),
}));

// Weekly Meal Planning Types
export type WeeklyMealPlan = typeof weeklyMealPlans.$inferSelect;
export type NewWeeklyMealPlan = typeof weeklyMealPlans.$inferInsert;
export type MealPlanItem = typeof mealPlanItems.$inferSelect;
export type NewMealPlanItem = typeof mealPlanItems.$inferInsert;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type NewShoppingList = typeof shoppingLists.$inferInsert;

// Extended types for complex queries
export type WeeklyMealPlanWithItems = WeeklyMealPlan & {
  mealPlanItems: (MealPlanItem & {
    recipe?: Recipe;
  })[];
  shoppingList?: ShoppingList;
};

export type MealPlanItemWithRecipe = MealPlanItem & {
  recipe?: Recipe;
};
