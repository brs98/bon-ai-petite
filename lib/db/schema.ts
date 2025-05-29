import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const nutritionProfiles = pgTable(
  'nutrition_profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    age: integer('age'),
    height: integer('height_cm'),
    weight: integer('weight_kg'),
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

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  nutritionProfile: one(nutritionProfiles),
  recipes: many(recipes),
  recipeFeedback: many(recipeFeedback),
  usageTracking: many(usageTracking),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
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
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

export type NutritionProfile = typeof nutritionProfiles.$inferSelect;
export type NewNutritionProfile = typeof nutritionProfiles.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type RecipeFeedback = typeof recipeFeedback.$inferSelect;
export type NewRecipeFeedback = typeof recipeFeedback.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type NewUsageTracking = typeof usageTracking.$inferInsert;
