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
});

export type RecipeGenerationRequest = z.infer<
  typeof RecipeGenerationRequestSchema
>;

// Nutrition profile schema
export const NutritionProfileSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  age: z.number().positive().optional(),
  height: z.number().positive().optional(), // in cm
  weight: z.number().positive().optional(), // in kg
  activityLevel: z
    .enum([
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active',
    ])
    .optional(),
  goals: z
    .enum([
      'lose_weight',
      'gain_weight',
      'maintain_weight',
      'gain_muscle',
      'improve_health',
    ])
    .optional(),
  dailyCalories: z.number().positive().optional(),
  macroProtein: z.number().nonnegative().optional(), // in grams
  macroCarbs: z.number().nonnegative().optional(), // in grams
  macroFat: z.number().nonnegative().optional(), // in grams
  allergies: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  cuisinePreferences: z.array(z.string()).optional(),
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
