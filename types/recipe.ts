import { z } from 'zod';

// Base recipe schema
export const RecipeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Recipe name is required'),
  description: z.string().min(1, 'Recipe description is required'),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
      }),
    )
    .min(1, 'At least one ingredient is required'),
  instructions: z
    .array(z.string())
    .min(1, 'At least one instruction is required'),
  nutrition: z.object({
    calories: z.number().positive(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fat: z.number().nonnegative(),
  }),
  prepTime: z.number().nonnegative(),
  cookTime: z.number().nonnegative(),
  servings: z.number().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  cuisineType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isSaved: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  userId: z.number().optional(),
  createdAt: z.date().optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// Schema specifically for AI generation (excludes database fields)
export const RecipeGenerationSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  description: z.string().min(1, 'Recipe description is required'),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
      }),
    )
    .min(1, 'At least one ingredient is required'),
  instructions: z
    .array(z.string())
    .min(1, 'At least one instruction is required'),
  nutrition: z.object({
    calories: z.number().positive(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fat: z.number().nonnegative(),
  }),
  prepTime: z.number().nonnegative(),
  cookTime: z.number().nonnegative(),
  servings: z.number().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  cuisineType: z.string(),
  tags: z.array(z.string()),
});

export type GeneratedRecipe = z.infer<typeof RecipeGenerationSchema>;

// Recipe generation request schema
export const RecipeGenerationRequestSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: z.number().positive().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  allergies: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  userProfile: z
    .object({
      age: z.number().positive().optional(),
      weight: z.number().positive().optional(),
      height: z.number().positive().optional(),
      activityLevel: z.string().optional(),
      goals: z.string().optional(),
    })
    .optional(),
  varietyBoost: z.boolean().optional(),
  avoidSimilarRecipes: z.boolean().optional(),
  sessionId: z.string().optional(),
  mealComplexity: z.enum(['simple', 'medium', 'hard']).optional(),
  servings: z.number().positive().optional(),
  timeToMake: z.number().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export type RecipeGenerationRequest = z.infer<
  typeof RecipeGenerationRequestSchema
>;

// Nutrition profile schema
export const NutritionProfileSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  age: z.number().positive({ message: 'Age is required and must be positive' }),
  height: z
    .number()
    .positive({ message: 'Height is required and must be positive' }), // in inches
  weight: z
    .number()
    .positive({ message: 'Weight is required and must be positive' }), // in lbs
  goalWeight: z.number().positive().optional(), // user's target weight in lbs (optional)
  activityLevel: z.enum(
    [
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active',
    ],
    { message: 'Activity level is required' },
  ),
  goals: z
    .array(
      z.enum([
        'lose_weight',
        'gain_weight',
        'maintain_weight',
        'gain_muscle',
        'improve_health',
      ]),
    )
    .min(1, { message: 'At least one goal is required' }), // now supports multiple goals
  dailyCalories: z.number().positive().optional(),
  macroProtein: z.number().nonnegative().optional(), // in grams
  macroCarbs: z.number().nonnegative().optional(), // in grams
  macroFat: z.number().nonnegative().optional(), // in grams
  allergies: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  gender: z.enum(['male', 'female']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type NutritionProfile = z.infer<typeof NutritionProfileSchema>;

// Recipe feedback schema
export const RecipeFeedbackSchema = z.object({
  id: z.number().optional(),
  recipeId: z.number(),
  userId: z.number(),
  liked: z.boolean(),
  feedback: z.string().optional(),
  reportedIssues: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
});

export type RecipeFeedback = z.infer<typeof RecipeFeedbackSchema>;

// Ingredient schema
export const IngredientSchema = z.object({
  name: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

// Nutrition information schema
export const NutritionSchema = z.object({
  calories: z.number().positive(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional(),
  sugar: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional(),
});

export type Nutrition = z.infer<typeof NutritionSchema>;

// Common dietary restrictions and allergens
export const COMMON_ALLERGIES = [
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree nuts',
  'Peanuts',
  'Wheat/Gluten',
  'Soy',
  'Sesame',
] as const;

export const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Keto',
  'Paleo',
  'Low-carb',
  'Low-fat',
  'Low-sodium',
  'Mediterranean',
  'Whole30',
] as const;

export const CUISINE_TYPES = [
  'American',
  'Italian',
  'Mexican',
  'Asian',
  'Chinese',
  'Japanese',
  'Thai',
  'Indian',
  'Mediterranean',
  'French',
  'Greek',
  'Middle Eastern',
  'Korean',
  'Vietnamese',
] as const;

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
  {
    value: 'lightly_active',
    label: 'Lightly active (light exercise 1-3 days/week)',
  },
  {
    value: 'moderately_active',
    label: 'Moderately active (moderate exercise 3-5 days/week)',
  },
  { value: 'very_active', label: 'Very active (hard exercise 6-7 days/week)' },
  {
    value: 'extremely_active',
    label: 'Extremely active (very hard exercise, physical job)',
  },
] as const;

export const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'gain_weight', label: 'Gain weight' },
  { value: 'maintain_weight', label: 'Maintain current weight' },
  { value: 'gain_muscle', label: 'Build muscle' },
  { value: 'improve_health', label: 'Improve overall health' },
] as const;

// Weekly Meal Planning Types and Schemas
export const WeeklyMealPlanSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  breakfastCount: z.number().min(0).max(7),
  lunchCount: z.number().min(0).max(7),
  dinnerCount: z.number().min(0).max(7),
  snackCount: z.number().min(0).max(7),
  totalMeals: z.number().min(0).max(28),
  status: z.enum(['in_progress', 'completed', 'archived']),
  globalPreferences: z
    .object({
      allergies: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      cuisinePreferences: z.array(z.string()).optional(),
      maxPrepTime: z.number().optional(),
      maxCookTime: z.number().optional(),
      difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
    })
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlanSchema>;

export const MealPlanItemSchema = z.object({
  id: z.number().optional(),
  planId: z.number(),
  recipeId: z.number().optional(),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  dayNumber: z.number().min(1).max(7),
  status: z.enum(['pending', 'generating', 'generated']),
  customPreferences: z
    .object({
      allergies: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      cuisinePreferences: z.array(z.string()).optional(),
      maxPrepTime: z.number().optional(),
      maxCookTime: z.number().optional(),
      difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
    })
    .optional(),
  lockedAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type MealPlanItem = z.infer<typeof MealPlanItemSchema>;

export const ShoppingListSchema = z.object({
  id: z.number().optional(),
  planId: z.number(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().positive(),
      unit: z.string(),
      category: z.string().optional(), // produce, dairy, meat, etc.
      checked: z.boolean().default(false),
    }),
  ),
  totalItems: z.number().min(0),
  checkedItems: z.number().min(0),
  exportMetadata: z
    .object({
      format: z.string().optional(),
      exportedAt: z.date().optional(),
      externalIds: z.record(z.string()).optional(),
    })
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ShoppingList = z.infer<typeof ShoppingListSchema>;

// Request schemas for API endpoints
export const CreateWeeklyMealPlanRequestSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  breakfastCount: z.number().min(0).max(7),
  lunchCount: z.number().min(0).max(7),
  dinnerCount: z.number().min(0).max(7),
  snackCount: z.number().min(0).max(7),
  globalPreferences: z
    .object({
      allergies: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      cuisinePreferences: z.array(z.string()).optional(),
      maxPrepTime: z.number().optional(),
      maxCookTime: z.number().optional(),
      difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
    })
    .optional(),
});

export type CreateWeeklyMealPlanRequest = z.infer<
  typeof CreateWeeklyMealPlanRequestSchema
>;

export const GenerateMealRequestSchema = z.object({
  customPreferences: z
    .object({
      allergies: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      cuisinePreferences: z.array(z.string()).optional(),
      maxPrepTime: z.number().optional(),
      maxCookTime: z.number().optional(),
      difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
    })
    .optional()
    .nullable(),
});

export type GenerateMealRequest = z.infer<typeof GenerateMealRequestSchema>;

export const LockMealRequestSchema = z.object({
  locked: z.boolean(),
});

export type LockMealRequest = z.infer<typeof LockMealRequestSchema>;

// Extended types for API responses
export type WeeklyMealPlanWithItems = WeeklyMealPlan & {
  mealPlanItems: (MealPlanItem & {
    recipe?: Recipe;
  })[];
  shoppingList?: ShoppingList;
};

export type MealPlanItemWithRecipe = MealPlanItem & {
  recipe?: Recipe;
};

// Schema for batch AI weekly meal plan output
export const WeeklyMealPlanAISchema = z.object({
  breakfasts: z.array(RecipeGenerationSchema).max(7),
  lunches: z.array(RecipeGenerationSchema).max(7),
  dinners: z.array(RecipeGenerationSchema).max(7),
  snacks: z.array(RecipeGenerationSchema).max(7),
});

export type WeeklyMealPlanAIResponse = z.infer<typeof WeeklyMealPlanAISchema>;

// Grocery categories for shopping list organization
export const GROCERY_CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'poultry',
  'seafood',
  'bakery',
  'deli',
  'frozen',
  'pantry',
  'spices',
  'beverages',
  'snacks',
  'health',
  'other',
] as const;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];
