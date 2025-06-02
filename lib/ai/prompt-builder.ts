import { type RecipeGenerationRequest } from '../../types/recipe';
import { type NutritionProfile } from '../db/schema';

export interface PromptTemplate {
  system: string;
  user: string;
}

export interface UserContext {
  nutritionProfile?: NutritionProfile | null;
  recentFeedback?: Array<{
    liked: boolean;
    feedback?: string;
    reportedIssues?: string[];
  }>;
  preferredIngredients?: string[];
  avoidedIngredients?: string[];
}

export class PromptBuilderService {
  /**
   * Build a contextualized prompt for recipe generation with user history and preferences
   */
  buildRecipePrompt(
    request: RecipeGenerationRequest,
    userContext?: UserContext,
  ): PromptTemplate {
    const systemPrompt = this.buildSystemPrompt(userContext);
    const userPrompt = this.buildUserPrompt(request, userContext);

    return {
      system: systemPrompt,
      user: userPrompt,
    };
  }

  private buildSystemPrompt(userContext?: UserContext): string {
    let systemPrompt = `You are a professional chef and nutritionist with expertise in creating healthy, delicious recipes. Your role is to:

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
- Provide helpful cooking tips within the instructions`;

    // Add user-specific context if available
    if (userContext?.recentFeedback && userContext.recentFeedback.length > 0) {
      const dislikes = userContext.recentFeedback.filter(f => !f.liked);
      if (dislikes.length > 0) {
        systemPrompt += `\n\n## User Preference Context:
Based on recent feedback, the user has expressed concerns about:`;

        dislikes.forEach(feedback => {
          if (feedback.feedback) {
            systemPrompt += `\n- ${feedback.feedback}`;
          }
          if (feedback.reportedIssues) {
            systemPrompt += `\n- Issues: ${feedback.reportedIssues.join(', ')}`;
          }
        });

        systemPrompt += `\nPlease take these preferences into account when creating recipes.`;
      }
    }

    if (
      userContext?.preferredIngredients &&
      userContext.preferredIngredients.length > 0
    ) {
      systemPrompt += `\n\n## Preferred Ingredients:
The user tends to enjoy recipes containing: ${userContext.preferredIngredients.join(', ')}`;
    }

    if (
      userContext?.avoidedIngredients &&
      userContext.avoidedIngredients.length > 0
    ) {
      systemPrompt += `\n\n## Ingredients to Minimize:
The user prefers to avoid (when possible): ${userContext.avoidedIngredients.join(', ')}`;
    }

    systemPrompt += `\n\nAlways respond with valid JSON that matches the requested schema exactly.`;

    return systemPrompt;
  }

  private buildUserPrompt(
    request: RecipeGenerationRequest,
    userContext?: UserContext,
  ): string {
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

    // Enhanced nutritional requirements with user profile context
    prompt += '## Nutritional Targets:\n';
    if (calories) prompt += `- Calories: ~${calories} kcal\n`;
    if (protein) prompt += `- Protein: ${protein}g or more\n`;
    if (carbs) prompt += `- Carbohydrates: ~${carbs}g\n`;
    if (fat) prompt += `- Fat: ~${fat}g\n`;

    // Add macro ratio context if user has a nutrition profile
    if (userContext?.nutritionProfile) {
      const profile = userContext.nutritionProfile;
      if (profile.dailyCalories) {
        const _mealCalories = calories || Math.round(profile.dailyCalories / 4); // Rough quarter of daily
        prompt += `- Context: User's daily target is ${profile.dailyCalories} kcal\n`;
      }
      if (profile.goals) {
        prompt += `- User goal: ${profile.goals.replace('_', ' ')}\n`;
      }
    }

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

    // Enhanced user context with activity level consideration
    if (userProfile || userContext?.nutritionProfile) {
      prompt += '\n## User Context:\n';

      const profile = userProfile || userContext?.nutritionProfile;
      if (profile?.goals)
        prompt += `- Goal: ${profile.goals.replace('_', ' ')}\n`;
      if (profile?.activityLevel) {
        prompt += `- Activity Level: ${profile.activityLevel.replace('_', ' ')}\n`;

        // Add cooking complexity based on activity level
        if (
          profile.activityLevel === 'very_active' ||
          profile.activityLevel === 'extremely_active'
        ) {
          prompt += `- Prefer quick, energy-dense recipes for active lifestyle\n`;
        }
      }

      if (userContext?.nutritionProfile?.age) {
        const age = userContext.nutritionProfile.age;
        if (age >= 65) {
          prompt += `- Consider recipes that are easy to digest and nutrient-dense\n`;
        } else if (age <= 25) {
          prompt += `- Consider recipes that are filling and budget-friendly\n`;
        }
      }
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
   * Enhanced few-shot learning examples covering various scenarios
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
      {
        prompt:
          'Create a vegan lunch recipe with 500 calories, dairy-free, Mediterranean cuisine',
        response: JSON.stringify(
          {
            name: 'Mediterranean Chickpea and Quinoa Bowl',
            description:
              'A vibrant, nutrient-dense bowl with protein-rich quinoa, chickpeas, and fresh Mediterranean vegetables.',
            ingredients: [
              { name: 'cooked quinoa', quantity: 0.75, unit: 'cup' },
              { name: 'canned chickpeas', quantity: 0.5, unit: 'cup' },
              { name: 'cucumber', quantity: 0.5, unit: 'cup diced' },
              { name: 'cherry tomatoes', quantity: 0.5, unit: 'cup halved' },
              { name: 'red onion', quantity: 0.25, unit: 'cup diced' },
              { name: 'kalamata olives', quantity: 0.25, unit: 'cup' },
              { name: 'fresh parsley', quantity: 0.25, unit: 'cup chopped' },
              { name: 'olive oil', quantity: 2, unit: 'tbsp' },
              { name: 'lemon juice', quantity: 1, unit: 'tbsp' },
              { name: 'dried oregano', quantity: 1, unit: 'tsp' },
              { name: 'salt', quantity: 0.5, unit: 'tsp' },
            ],
            instructions: [
              'Rinse and drain chickpeas, then pat dry',
              'In a large bowl, combine quinoa and chickpeas',
              'Add diced cucumber, cherry tomatoes, and red onion',
              'Whisk together olive oil, lemon juice, oregano, and salt',
              'Pour dressing over the bowl and toss to combine',
              'Top with olives and fresh parsley before serving',
            ],
            nutrition: {
              calories: 498,
              protein: 18,
              carbs: 58,
              fat: 22,
            },
            prepTime: 15,
            cookTime: 0,
            servings: 1,
            difficulty: 'easy',
            mealType: 'lunch',
          },
          null,
          2,
        ),
      },
      {
        prompt:
          'Create a low-carb dinner recipe with 350 calories, 30g protein, keto diet',
        response: JSON.stringify(
          {
            name: 'Herb-Crusted Baked Salmon with Asparagus',
            description:
              'Tender, flaky salmon with a crispy herb crust served with roasted asparagus - perfect for keto.',
            ingredients: [
              { name: 'salmon fillet', quantity: 5, unit: 'oz' },
              { name: 'fresh asparagus', quantity: 8, unit: 'spears' },
              { name: 'olive oil', quantity: 1.5, unit: 'tbsp' },
              { name: 'fresh dill', quantity: 1, unit: 'tbsp chopped' },
              { name: 'fresh parsley', quantity: 1, unit: 'tbsp chopped' },
              { name: 'garlic powder', quantity: 0.5, unit: 'tsp' },
              { name: 'lemon zest', quantity: 0.5, unit: 'tsp' },
              { name: 'salt', quantity: 0.5, unit: 'tsp' },
              { name: 'black pepper', quantity: 0.25, unit: 'tsp' },
            ],
            instructions: [
              'Preheat oven to 400°F (200°C)',
              'Trim woody ends from asparagus and place on baking sheet',
              'Drizzle asparagus with half the olive oil and season with salt',
              'Pat salmon dry and place on the same baking sheet',
              'Mix herbs, garlic powder, lemon zest, salt, and pepper',
              'Brush salmon with remaining oil and press herb mixture on top',
              'Bake for 12-15 minutes until salmon flakes easily',
              'Serve immediately with the roasted asparagus',
            ],
            nutrition: {
              calories: 352,
              protein: 31,
              carbs: 6,
              fat: 22,
            },
            prepTime: 10,
            cookTime: 15,
            servings: 1,
            difficulty: 'medium',
            mealType: 'dinner',
          },
          null,
          2,
        ),
      },
    ];
  }

  /**
   * Build prompts for specific dietary goals with enhanced context
   */
  buildGoalSpecificPrompt(
    goal: string,
    _mealType: string,
    _userContext?: UserContext,
  ): string {
    const goalPrompts = {
      lose_weight: `Focus on high-volume, low-calorie ingredients. Emphasize vegetables, lean proteins, and foods that promote satiety. Avoid excessive fats and refined carbohydrates.`,
      gain_weight: `Include calorie-dense, nutritious ingredients. Focus on healthy fats, complex carbohydrates, and quality proteins. Consider adding nuts, seeds, and healthy oils.`,
      gain_muscle: `Prioritize high-protein ingredients with complete amino acid profiles. Include post-workout recovery foods if this is a post-exercise meal.`,
      maintain_weight: `Create a balanced meal with appropriate portions of all macronutrients. Focus on sustainable, satisfying ingredients.`,
      improve_health: `Emphasize nutrient-dense, anti-inflammatory ingredients. Include colorful vegetables, lean proteins, and foods rich in vitamins and minerals.`,
    };

    return goalPrompts[goal as keyof typeof goalPrompts] || '';
  }

  /**
   * Generate cooking complexity guidance based on user profile
   */
  private getCookingComplexityGuidance(userContext?: UserContext): string {
    if (!userContext?.nutritionProfile) return '';

    const profile = userContext.nutritionProfile;

    // Very active people might need quick recipes
    if (
      profile.activityLevel === 'very_active' ||
      profile.activityLevel === 'extremely_active'
    ) {
      return 'Prefer recipes that can be prepared quickly (under 30 minutes total) with minimal cleanup.';
    }

    // Sedentary lifestyle might allow for more complex cooking
    if (profile.activityLevel === 'sedentary') {
      return 'User may have time for more involved cooking techniques and longer preparation times.';
    }

    return '';
  }
}

// Export a default instance
export const promptBuilder = new PromptBuilderService();
