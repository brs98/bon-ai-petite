// This file provides prompt template utilities for AI prompt building.
// The getRecipeSchemaString function should return a string representation of the Recipe TypeScript type.
// In production, use a build step (e.g., with typescript-to-json-schema or ts-to-zod) to auto-generate the schema string from types/recipe.ts.
// For now, this is a placeholder. Replace with an auto-generated string in your build pipeline.

// import { Recipe } from '../../types/recipe'; // <-- Used for type reference only

export function getRecipeSchemaString(): string {
  // TODO: Replace this with an auto-generated schema string from the Recipe type
  return `type Recipe = {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  cuisineType: string;
  mealType: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}`;
}

/**
 * Returns a string template for the weekly meal plan prompt.
 * Use placeholders like {{breakfasts}}, {{lunches}}, etc. for dynamic values.
 * Replace these placeholders at runtime in buildWeeklyMealPlanPrompt.
 */
export function getWeeklyMealPlanPromptTemplate(): string {
  return `User Preferences:
{{userPreferences}}

Meal Plan Requirements:
- breakfasts: {{breakfasts}}, lunches: {{lunches}}, dinners: {{dinners}}, snacks: {{snacks}}
- Each meal must be unique and not repeat the same cuisine more than once per meal type.
- Each recipe must include: a base of fiber-rich carbs, at least one non-starchy vegetable, a clear lean protein source, and a healthy fat.
- Strictly avoid all allergens and dietary restrictions.
- The recipe difficulty should be: {{mealComplexity}}.
- Return the result as a JSON object matching this TypeScript type:
{{schema}}
`;
}

// To automate: Use a script to extract the Recipe type and update this function's return value during your build process. 