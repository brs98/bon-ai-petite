import { RecipeGenerationRequest } from '../../types/recipe';
import { normalizeUserContext } from './normalize-user-context';
import { PromptTemplate, UserContext } from './prompt-builder';

// Modular prompt builder for single meal recipe generation
export function buildSingleMealPrompt(
  request: RecipeGenerationRequest,
  userContext: UserContext,
): PromptTemplate & { temperature: number } {
  const ctx = normalizeUserContext(userContext || {});

  // Compose user prompt from modular sections, matching weekly builder style
  let user = `User Preferences:\n`;
  if (ctx.allergies.length > 0)
    user += `- Allergies: ${ctx.allergies.join(', ')}\n`;
  if (ctx.dietaryRestrictions.length > 0)
    user += `- Dietary restrictions: ${ctx.dietaryRestrictions.join(', ')}\n`;
  if (ctx.cuisinePreferences.length > 0)
    user += `- Cuisine preferences: ${ctx.cuisinePreferences.join(', ')}\n`;
  if (ctx.calories) user += `- Calories: ~${ctx.calories} kcal\n`;
  if (ctx.protein) user += `- Protein: ${ctx.protein}g or more\n`;
  if (ctx.carbs) user += `- Carbohydrates: ~${ctx.carbs}g\n`;
  if (ctx.fat) user += `- Fat: ~${ctx.fat}g\n`;
  if (ctx.preferredIngredients.length > 0)
    user += `- Preferred ingredients: ${ctx.preferredIngredients.join(', ')}\n`;
  if (ctx.avoidedIngredients.length > 0)
    user += `- Avoided ingredients: ${ctx.avoidedIngredients.join(', ')}\n`;
  if (ctx.userProfile) {
    if (ctx.userProfile.age) user += `- Age: ${ctx.userProfile.age}\n`;
    if (ctx.userProfile.weight)
      user += `- Weight: ${ctx.userProfile.weight} lbs\n`;
    if (ctx.userProfile.height)
      user += `- Height: ${ctx.userProfile.height} in\n`;
    if (ctx.userProfile.activityLevel)
      user += `- Activity level: ${ctx.userProfile.activityLevel}\n`;
    if (ctx.userProfile.goals)
      user += `- Goals: ${Array.isArray(ctx.userProfile.goals) ? ctx.userProfile.goals.join(', ') : ctx.userProfile.goals}\n`;
  }
  const reqWithCustom = request as typeof request & {
    servings?: number;
    timeToMake?: number;
    difficulty?: string;
  };
  if (typeof reqWithCustom.servings === 'number')
    user += `- Servings: ${reqWithCustom.servings}\n`;
  if (typeof reqWithCustom.timeToMake === 'number')
    user += `- Time to make: ${reqWithCustom.timeToMake} minutes\n`;
  if (typeof reqWithCustom.difficulty === 'string')
    user += `- Difficulty: ${reqWithCustom.difficulty}\n`;
  user += `- Desired meal complexity: ${ctx.mealComplexity}\n`;
  user += `\nRecipe Requirements:\n`;
  user += `- Meal type: ${request.mealType}\n`;
  user += `- The recipe must be unique and must match one of the user's cuisine preferences.\n`;
  user += `- The recipe must include: a base of fiber-rich carbs, at least one non-starchy vegetable, a clear lean protein source, and a healthy fat.\n`;
  user += `- Strictly avoid all allergens and dietary restrictions.\n`;
  user += `- The recipe difficulty should be: ${ctx.mealComplexity}.\n`;
  user += `- Return the result as a JSON object matching this TypeScript type:\n`;
  user += `type Recipe = { name, description, ingredients, instructions, nutrition, cuisineType, mealType, prepTime, cookTime, servings, difficulty, tags }\n`;

  const system = `You are an expert chef and nutritionist. Generate a recipe for a user with the following preferences and nutrition targets. The recipe must strictly match the user's dietary and cuisine preferences, and provide a healthy balance (fiber-rich carbs, non-starchy vegetables, lean protein, healthy fat).\n\nReturn a JSON object matching the requested schema exactly.`;

  return { system, user, temperature: 0.7 };
}
