import { NormalizedUserContext } from '../../types/normalized-user-context';
import { NutritionProfile } from '../db/schema';
import { UserContext } from './prompt-builder';

export function normalizeUserContext(
  raw: UserContext,
  overrides?: Partial<NormalizedUserContext>,
): NormalizedUserContext {
  // NutritionProfile fields from schema
  const profile = (raw.nutritionProfile || {}) as Partial<NutritionProfile>;

  return {
    calories:
      typeof profile.dailyCalories === 'number' ? profile.dailyCalories : 500,
    protein:
      typeof profile.macroProtein === 'number' ? profile.macroProtein : 20,
    carbs: typeof profile.macroCarbs === 'number' ? profile.macroCarbs : 50,
    fat: typeof profile.macroFat === 'number' ? profile.macroFat : 15,
    allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
    dietaryRestrictions: Array.isArray(profile.dietaryRestrictions)
      ? profile.dietaryRestrictions
      : [],
    cuisinePreferences: Array.isArray(profile.cuisinePreferences)
      ? profile.cuisinePreferences
      : [],
    preferredIngredients: Array.isArray(raw.preferredIngredients)
      ? raw.preferredIngredients
      : [],
    avoidedIngredients: Array.isArray(raw.avoidedIngredients)
      ? raw.avoidedIngredients
      : [],
    userProfile: raw.nutritionProfile || null,
    feedback: Array.isArray(raw.recentFeedback) ? raw.recentFeedback : [],
    mealComplexity:
      (profile.mealComplexity as 'simple' | 'medium' | 'hard') || 'simple',
    ...overrides,
  };
}
