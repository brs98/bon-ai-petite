import { NormalizedUserContext } from '../../types/normalized-user-context';
import { RecipeGenerationRequest } from '../../types/recipe';

// Returns nutrition requirements section
export function nutritionSection(ctx: NormalizedUserContext): string {
  return [
    '## Nutritional Targets:',
    `- Calories: ~${ctx.calories} kcal`,
    `- Protein: ${ctx.protein}g or more`,
    `- Carbohydrates: ~${ctx.carbs}g`,
    `- Fat: ~${ctx.fat}g`,
  ].join('\n');
}

// Returns allergies section
export function allergiesSection(ctx: NormalizedUserContext): string {
  if (!ctx.allergies.length) return '';
  return [
    '## ⚠️ CRITICAL - ALLERGIES TO AVOID:',
    ...ctx.allergies.map(a => `- ${a}`),
    'ABSOLUTELY NO ingredients containing these allergens!',
  ].join('\n');
}

// Returns dietary restrictions section
export function restrictionsSection(ctx: NormalizedUserContext): string {
  if (!ctx.dietaryRestrictions.length) return '';
  return [
    '## Dietary Restrictions:',
    ...ctx.dietaryRestrictions.map(r => `- ${r}`),
    'Strictly follow these dietary restrictions. Do not include any ingredients that violate these restrictions.',
  ].join('\n');
}

// Returns cuisine and ingredient preferences section
export function preferencesSection(ctx: NormalizedUserContext): string {
  let out = '';
  if (ctx.cuisinePreferences.length) {
    out += `\n## Preferred Cuisines (STRICT):\n- ${ctx.cuisinePreferences.join('\n- ')}\n`;
    out += `You MUST ONLY generate recipes that match one of the above cuisines. Do NOT generate recipes from any other cuisine unless the user explicitly overrides this preference for this meal.\n`;
  }
  if (ctx.preferredIngredients.length)
    out += `\n## Preferred Ingredients:\n- ${ctx.preferredIngredients.join(', ')}`;
  if (ctx.avoidedIngredients.length)
    out += `\n## Avoided Ingredients:\n- ${ctx.avoidedIngredients.join(', ')}`;
  return out.trim();
}

// Returns user profile context section
export function userProfileSection(ctx: NormalizedUserContext): string {
  const p = ctx.userProfile;
  if (!p) return '';
  let out = '\n## User Context:';
  if (p.age) out += `\n- Age: ${p.age}`;
  if (p.weight) out += `\n- Weight: ${p.weight} lbs`;
  if (p.height) out += `\n- Height: ${p.height} in`;
  if (p.activityLevel) out += `\n- Activity Level: ${p.activityLevel}`;
  if (p.goals)
    out += `\n- Goals: ${Array.isArray(p.goals) ? p.goals.join(', ') : p.goals}`;
  if (ctx.cuisinePreferences.length)
    out += `\n- Cuisine Preferences: ${ctx.cuisinePreferences.join(', ')}`;
  return out;
}

// Returns output format section
export function outputFormatSection(_req: RecipeGenerationRequest): string {
  return [
    '## Required Output Format:',
    'Return ONLY a valid JSON object with this exact structure:',
    '{',
    '  "name": "Recipe Name",',
    '  "description": "Brief appetizing description (1-2 sentences)",',
    '  "ingredients": [',
    '    {"name": "ingredient name", "quantity": number, "unit": "unit (e.g., cups, tbsp, oz)"}',
    '  ],',
    '  "instructions": [',
    '    "Step 1: Clear instruction",',
    '    "Step 2: Next instruction",',
    '    "Step 3: Continue..."',
    '  ],',
    '  "nutrition": {',
    '    "calories": exact_number,',
    '    "protein": exact_number_in_grams,',
    '    "carbs": exact_number_in_grams,',
    '    "fat": exact_number_in_grams',
    '  },',
    '  "prepTime": minutes_as_number,',
    '  "cookTime": minutes_as_number,',
    '  "servings": number_of_servings,',
    '  "difficulty": "easy", "medium", or "hard",',
    '  "mealType": "breakfast|lunch|dinner|snack"',
    '}',
    'Make the recipe easy to shop for and prepare, with simple, direct instructions and minimal specialty equipment.',
  ].join('\n');
}
