import { RecipeGenerationRequest } from './recipe-generator';

export interface PromptTemplate {
  system: string;
  user: string;
}

export class PromptBuilderService {
  /**
   * Build a contextualized prompt for recipe generation
   */
  buildRecipePrompt(request: RecipeGenerationRequest): PromptTemplate {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request);

    return {
      system: systemPrompt,
      user: userPrompt,
    };
  }

  private buildSystemPrompt(): string {
    return `You are a professional chef and nutritionist with expertise in creating healthy, delicious recipes. Your role is to:

1. Create recipes that precisely match nutritional requirements
2. Respect all dietary restrictions and allergies (this is critical for safety)
3. Use accessible, common ingredients when possible
4. Provide clear, easy-to-follow cooking instructions
5. Ensure nutritional calculations are accurate
6. Return recipes in the exact JSON format requested

Key principles:
- NEVER include ingredients that conflict with stated allergies or dietary restrictions
- Prioritize nutritional accuracy while maintaining great taste
- Consider cooking skill level and time constraints
- Use seasonal and readily available ingredients when possible
- Provide helpful cooking tips within the instructions

Always respond with valid JSON that matches the requested schema exactly.`;
  }

  private buildUserPrompt(request: RecipeGenerationRequest): string {
    const {
      mealType,
      calories,
      protein,
      carbs,
      fat,
      allergies = [],
      dietaryRestrictions = [],
      cuisinePreferences = [],
      userProfile,
    } = request;

    let prompt = `Create a ${mealType} recipe with the following specifications:\n\n`;

    // Nutritional requirements
    prompt += '## Nutritional Targets:\n';
    if (calories) prompt += `- Calories: ~${calories} kcal\n`;
    if (protein) prompt += `- Protein: ${protein}g or more\n`;
    if (carbs) prompt += `- Carbohydrates: ~${carbs}g\n`;
    if (fat) prompt += `- Fat: ~${fat}g\n`;

    // Safety requirements (allergies)
    if (allergies.length > 0) {
      prompt += '\n## ⚠️ CRITICAL - ALLERGIES TO AVOID:\n';
      prompt += `- ${allergies.join('\n- ')}\n`;
      prompt += 'ABSOLUTELY NO ingredients containing these allergens!\n';
    }

    // Dietary preferences
    if (dietaryRestrictions.length > 0) {
      prompt += '\n## Dietary Restrictions:\n';
      prompt += `- ${dietaryRestrictions.join('\n- ')}\n`;
    }

    // Cuisine preferences
    if (cuisinePreferences.length > 0) {
      prompt += '\n## Preferred Cuisines:\n';
      prompt += `- ${cuisinePreferences.join('\n- ')}\n`;
    }

    // User context
    if (userProfile) {
      prompt += '\n## User Context:\n';
      if (userProfile.goals) prompt += `- Goal: ${userProfile.goals}\n`;
      if (userProfile.activityLevel)
        prompt += `- Activity Level: ${userProfile.activityLevel}\n`;
    }

    // Output format requirements
    prompt += `\n## Required Output Format:
Return ONLY a valid JSON object with this exact structure:

{
  "name": "Recipe Name",
  "description": "Brief appetizing description (1-2 sentences)",
  "ingredients": [
    {"name": "ingredient name", "quantity": number, "unit": "unit (e.g., cups, tbsp, oz)"}
  ],
  "instructions": [
    "Step 1: Clear instruction",
    "Step 2: Next instruction", 
    "Step 3: Continue..."
  ],
  "nutrition": {
    "calories": exact_number,
    "protein": exact_number_in_grams,
    "carbs": exact_number_in_grams,
    "fat": exact_number_in_grams
  },
  "prepTime": minutes_as_number,
  "cookTime": minutes_as_number,
  "servings": number_of_servings,
  "difficulty": "easy", "medium", or "hard",
  "mealType": "${mealType}"
}

## Additional Requirements:
- Ensure nutrition values are realistic and add up correctly
- Include specific quantities and units for all ingredients
- Make instructions clear and sequential
- Consider prep and cooking time accuracy
- Choose appropriate difficulty level based on techniques required`;

    return prompt;
  }

  /**
   * Build few-shot learning examples for better AI performance
   */
  getFewShotExamples(): Array<{ prompt: string; response: string }> {
    return [
      {
        prompt:
          'Create a breakfast recipe with 400 calories, 25g protein, for muscle gain',
        response: JSON.stringify(
          {
            name: 'Protein-Packed Scrambled Eggs with Spinach',
            description:
              'Fluffy scrambled eggs with fresh spinach and whole grain toast for a protein-rich start to your day.',
            ingredients: [
              { name: 'large eggs', quantity: 3, unit: 'whole' },
              { name: 'fresh spinach', quantity: 1, unit: 'cup' },
              { name: 'whole grain bread', quantity: 1, unit: 'slice' },
              { name: 'olive oil', quantity: 1, unit: 'tsp' },
              { name: 'salt', quantity: 0.25, unit: 'tsp' },
              { name: 'black pepper', quantity: 0.125, unit: 'tsp' },
            ],
            instructions: [
              'Heat olive oil in a non-stick pan over medium heat',
              'Add spinach and cook until wilted, about 2 minutes',
              'Beat eggs with salt and pepper in a bowl',
              'Add eggs to the pan and gently scramble with spinach',
              'Toast bread and serve alongside eggs',
            ],
            nutrition: {
              calories: 395,
              protein: 26,
              carbs: 15,
              fat: 18,
            },
            prepTime: 5,
            cookTime: 8,
            servings: 1,
            difficulty: 'easy',
            mealType: 'breakfast',
          },
          null,
          2,
        ),
      },
    ];
  }
}

// Export a default instance
export const promptBuilder = new PromptBuilderService();
