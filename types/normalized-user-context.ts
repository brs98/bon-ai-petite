import { NutritionProfile } from '../lib/db/schema';

export interface NormalizedUserContext {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allergies: string[];
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  preferredIngredients: string[];
  avoidedIngredients: string[];
  userProfile: NutritionProfile | null;
  feedback: Array<{
    liked: boolean;
    feedback?: string;
    reportedIssues?: string[];
  }>;
  mealComplexity: 'simple' | 'medium' | 'hard';
}
