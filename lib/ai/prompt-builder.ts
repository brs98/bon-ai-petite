import { type RecipeGenerationRequest } from '../../types/recipe';
import { type NutritionProfile } from '../db/schema';
import { COOKING_METHODS } from './cookingMethods'; // <-- Added import
import { DEFAULT_NUTRITION_PROFILE } from './defaultNutritionProfile'; // <-- Added import
import { normalizeUserContext } from './normalize-user-context';
import {
  getRecipeSchemaString,
  getWeeklyMealPlanPromptTemplate,
} from './promptTemplates'; // <-- Updated import

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

// Variety configuration interface to avoid circular imports
interface VarietyConfig {
  avoidanceTerms: string[];
  cuisineRotation: string[];
  complexityTarget: 'simple' | 'moderate' | 'complex';
}

// Simple recipe interface to avoid circular imports
interface SimpleRecipe {
  name: string;
  cuisineType?: string;
  ingredients?: Array<{ name: string; quantity: number; unit: string }>;
  instructions?: string[];
}

/**
 * PromptBuilderService
 *
 * This class builds prompts for recipe generation, following the requirements in:
 *   - recipe_prompt.md (see /Users/brandon/Downloads/recipe_prompt.md)
 *
 * Each section of the prompt is modularized and maps directly to a section in the markdown.
 */
export class PromptBuilderService {
  /**
   * Build the system prompt section (from recipe_prompt.md: System Prompt)
   */
  private buildSystemPrompt(): string {
    // See: recipe_prompt.md > System Prompt
    return [
      'You are an expert chef and nutritionist.',
      'Generate a healthy, simple dinner recipe for the user based on the following criteria. Return the result as a JSON object matching the provided schema exactly.',
    ].join(' ');
  }

  /**
   * Build the user preferences section (from recipe_prompt.md: User Preferences)
   * Uses DEFAULT_NUTRITION_PROFILE for fallback values
   */
  private buildUserPreferencesSection(
    request: RecipeGenerationRequest,
    userContext?: UserContext,
  ): string[] {
    // See: recipe_prompt.md > User Preferences
    const prefs: string[] = [];
    // Nutrition targets
    if (request.calories) {
      prefs.push(`- Calories: ~${request.calories} kcal`);
    } else {
      prefs.push(`- Calories: ~${DEFAULT_NUTRITION_PROFILE.calories} kcal`); // default
    }
    if (request.protein) {
      prefs.push(`- Protein: ${request.protein}g or more`);
    } else {
      prefs.push(`- Protein: ${DEFAULT_NUTRITION_PROFILE.protein}g or more`); // default
    }
    if (request.carbs) {
      prefs.push(`- Carbohydrates: ~${request.carbs}g`);
    } else {
      prefs.push(`- Carbohydrates: ~${DEFAULT_NUTRITION_PROFILE.carbs}g`); // default
    }
    if (request.fat) {
      prefs.push(`- Fat: ~${request.fat}g`);
    } else {
      prefs.push(`- Fat: ~${DEFAULT_NUTRITION_PROFILE.fat}g`); // default
    }
    if (request.servings) {
      prefs.push(`- Servings: ${request.servings}`);
    } else {
      prefs.push(`- Servings: ${DEFAULT_NUTRITION_PROFILE.servings}`); // default
    }
    if (typeof request.timeToMake === 'number') {
      prefs.push(`- Total Time: ≤ ${request.timeToMake} minutes`);
    } else {
      prefs.push(
        `- Total Time: ≤ ${DEFAULT_NUTRITION_PROFILE.timeToMake} minutes`,
      ); // default
    }
    if (request.difficulty) {
      prefs.push(
        `- Difficulty: ${request.difficulty.charAt(0).toUpperCase() + request.difficulty.slice(1)}`,
      );
    } else {
      prefs.push(
        `- Difficulty: ${DEFAULT_NUTRITION_PROFILE.difficulty.charAt(0).toUpperCase() + DEFAULT_NUTRITION_PROFILE.difficulty.slice(1)}`,
      ); // default
    }
    if (request.mealType) {
      prefs.push(
        `- Meal Type: ${request.mealType.charAt(0).toUpperCase() + request.mealType.slice(1)}`,
      );
    } else {
      prefs.push(
        `- Meal Type: ${DEFAULT_NUTRITION_PROFILE.mealType.charAt(0).toUpperCase() + DEFAULT_NUTRITION_PROFILE.mealType.slice(1)}`,
      ); // default
    }
    if (request.mealComplexity) {
      prefs.push(
        `- Desired Complexity: ${request.mealComplexity.charAt(0).toUpperCase() + request.mealComplexity.slice(1)}`,
      );
    } else {
      prefs.push(
        `- Desired Complexity: ${DEFAULT_NUTRITION_PROFILE.mealComplexity.charAt(0).toUpperCase() + DEFAULT_NUTRITION_PROFILE.mealComplexity.slice(1)}`,
      ); // default
    }
    if (request.cuisinePreferences && request.cuisinePreferences.length > 0) {
      prefs.push(
        `- Cuisine Preferences: ${request.cuisinePreferences.join(', ')}`,
      );
    }
    if (request.allergies && request.allergies.length > 0) {
      prefs.push(`- Allergies: ${request.allergies.join(', ')}`);
    }
    if (request.dietaryRestrictions && request.dietaryRestrictions.length > 0) {
      prefs.push(
        `- Dietary Restrictions: ${request.dietaryRestrictions.join(', ')}`,
      );
    }
    // Add preferred/avoided ingredients from userContext if present
    if (
      userContext?.preferredIngredients &&
      userContext.preferredIngredients.length > 0
    ) {
      prefs.push(
        `- Preferred Ingredients: ${userContext.preferredIngredients.join(', ')}`,
      );
    }
    if (
      userContext?.avoidedIngredients &&
      userContext.avoidedIngredients.length > 0
    ) {
      prefs.push(
        `- Avoided Ingredients: ${userContext.avoidedIngredients.join(', ')}`,
      );
    }
    // Add userProfile fields if present
    const profile = request.userProfile;
    if (profile) {
      if (profile.age) prefs.push(`- Age: ${profile.age}`);
      if (profile.weight) prefs.push(`- Weight: ${profile.weight} lbs`);
      if (profile.height) prefs.push(`- Height: ${profile.height} in`);
      if (profile.activityLevel)
        prefs.push(`- Activity Level: ${profile.activityLevel}`);
      if (profile.goals)
        prefs.push(
          `- Goals: ${Array.isArray(profile.goals) ? profile.goals.join(', ') : profile.goals}`,
        );
    }
    return prefs;
  }

  /**
   * Build the schema section (from recipe_prompt.md: Schema (Return Format))
   */
  private buildSchemaSection(): string {
    // See: recipe_prompt.md > Schema (Return Format)
    // Uses getRecipeSchemaString() for auto-generated schema string
    return [
      'Return the result as a JSON object matching this TypeScript type:',
      getRecipeSchemaString(),
    ].join('\n');
  }

  /**
   * Build the required recipe components section (from recipe_prompt.md: Required Recipe Components)
   */
  private buildRequiredComponentsSection(): string {
    // See: recipe_prompt.md > Required Recipe Components
    return [
      'Required Recipe Components:',
      '- Must match one of the user’s cuisine preferences',
      '- Must include:',
      '  - A base of fiber-rich carbohydrates',
      '  - At least one non-starchy vegetable',
      '  - A clear lean protein source',
      '  - A source of healthy fat',
      '- Must strictly avoid all allergens and dietary restrictions',
    ].join('\n');
  }

  /**
   * Build the avoid repetition section (from recipe_prompt.md: Avoid Repetition)
   * Dynamically includes recent ingredients, cuisines, and methods for the LLM to avoid.
   * Only includes avoided ingredients/cuisines if provided in VarietyConfig; omits if empty/undefined.
   */
  private buildAvoidRepetitionSection(
    recentRecipes?: SimpleRecipe[],
    varietyConfig?: { avoidanceTerms?: string[]; cuisineRotation?: string[] },
  ): string {
    // See: recipe_prompt.md > Avoid Repetition
    const avoidRepetition = ['Avoid Repetition:'];
    // Only include avoided ingredients if provided and non-empty
    if (
      varietyConfig?.avoidanceTerms &&
      varietyConfig.avoidanceTerms.length > 0
    ) {
      avoidRepetition.push(
        `Do not use: ${varietyConfig.avoidanceTerms.join(', ')}`,
      );
    }
    // Only include avoided cuisines if provided and non-empty
    if (
      varietyConfig?.cuisineRotation &&
      varietyConfig.cuisineRotation.length > 0
    ) {
      avoidRepetition.push(
        `Avoid these cuisine themes: ${varietyConfig.cuisineRotation.join(', ')}`,
      );
    }
    avoidRepetition.push(
      'Ensure the recipe:',
      '- Is distinctly different from recent ones',
      '- Uses different cooking methods, ingredients, and flavor profiles',
      '- Has a unique name and concept',
    );
    // Dynamically add recent context for LLM to avoid
    if (recentRecipes && recentRecipes.length > 0) {
      // Recent recipe names
      avoidRepetition.push(
        `Recent recipes: ${recentRecipes.map(r => r.name).join(', ')}`,
      );
      // Recent ingredients
      const recentIngredients = Array.from(
        new Set(
          recentRecipes.flatMap(r => (r.ingredients || []).map(i => i.name)),
        ),
      );
      if (recentIngredients.length > 0) {
        avoidRepetition.push(
          `Avoid these recently used ingredients: ${recentIngredients.join(', ')}`,
        );
      }
      // Recent cuisines
      const recentCuisines = Array.from(
        new Set(recentRecipes.map(r => r.cuisineType).filter(Boolean)),
      );
      if (recentCuisines.length > 0) {
        avoidRepetition.push(
          `Avoid these recently used cuisines: ${recentCuisines.join(', ')}`,
        );
      }
      // Recent cooking methods (if instructions available)
      // Use COOKING_METHODS from cookingMethods.ts
      const recentMethods = Array.from(
        new Set(
          recentRecipes.flatMap(r =>
            (r.instructions || []).flatMap(instr =>
              COOKING_METHODS.filter(
                m => instr && instr.toLowerCase().includes(m),
              ),
            ),
          ),
        ),
      );
      if (recentMethods.length > 0) {
        avoidRepetition.push(
          `Avoid these recently used cooking methods: ${recentMethods.join(', ')}`,
        );
      }
    }
    return avoidRepetition.join('\n');
  }

  /**
   * Build the final quality check section (from recipe_prompt.md: Final Quality Check)
   * Now uses dynamic thresholds from the RecipeGenerationRequest and UserContext.
   */
  private buildFinalQualityCheckSection(
    request: RecipeGenerationRequest,
  ): string {
    // See: recipe_prompt.md > Final Quality Check
    // Use dynamic thresholds from request/userContext
    const timeLimit =
      typeof request.timeToMake === 'number'
        ? request.timeToMake
        : DEFAULT_NUTRITION_PROFILE.timeToMake;
    const servings = request.servings ?? DEFAULT_NUTRITION_PROFILE.servings;
    return [
      'Final Quality Check:',
      '- Meets all nutritional targets (calories, macros, serving size)',
      '- Fulfills all dietary restrictions and preferences',
      '- Matches the user’s preferred cuisine',
      `- Can be prepared in ${timeLimit} minutes or less`,
      `- Makes exactly ${servings} serving${servings === 1 ? '' : 's'}`,
      '- Has clear and simple instructions for an easy cooking experience',
      '- Includes all required food components (fiber-rich carb, non-starchy vegetable, lean protein, healthy fat)',
    ].join('\n');
  }

  /**
   * Build a prompt for recipe generation that matches the structure and language of recipe_prompt.md
   * This is the preferred method for single recipe generation.
   *
   * Sections:
   *   - System Prompt (from markdown)
   *   - User Preferences (from request/userContext)
   *   - Required Recipe Components (from markdown)
   *   - Avoid Repetition (from markdown and recent recipes)
   *   - Final Quality Check (from markdown)
   *
   * See: /Users/brandon/Downloads/recipe_prompt.md
   */
  buildMarkdownAlignedPrompt(
    request: RecipeGenerationRequest,
    userContext?: UserContext,
    recentRecipes?: SimpleRecipe[],
  ): PromptTemplate {
    // --- 🧠 System Prompt ---
    const system = this.buildSystemPrompt();

    // --- 👤 User Preferences ---
    const prefs = this.buildUserPreferencesSection(request, userContext);

    // --- ⚙️ Schema (Return Format) ---
    const schemaBlock = this.buildSchemaSection();

    // --- 🥗 Required Recipe Components ---
    const requiredComponents = this.buildRequiredComponentsSection();

    // --- 🔁 Avoid Repetition ---
    const avoidRepetitionBlock =
      this.buildAvoidRepetitionSection(recentRecipes);

    // --- ✅ Final Quality Check ---
    const finalCheck = this.buildFinalQualityCheckSection(request);

    // --- Compose user prompt ---
    const user = [
      'User Preferences:',
      ...prefs,
      '',
      schemaBlock,
      '',
      requiredComponents,
      '',
      avoidRepetitionBlock,
      '',
      finalCheck,
    ].join('\n');

    return { system, user };
  }

  /**
   * Build a contextualized prompt for recipe generation with user history and preferences
   * @deprecated - now uses buildMarkdownAlignedPrompt
   */
  buildRecipePrompt(
    request: RecipeGenerationRequest,
    userContext?: UserContext,
  ): PromptTemplate {
    // DEBUG: Log normalized user context
    const normalized = normalizeUserContext(userContext || {});
    console.debug('[PromptBuilder] Normalized User Context:', normalized);
    // DEPRECATED: Use modular builder
    return this.buildMarkdownAlignedPrompt(request, userContext);
  }

  /**
   * Build a prompt for batch weekly meal plan generation (all meals in one call)
   */
  buildWeeklyMealPlanPrompt(
    mealCounts: {
      breakfasts: number;
      lunches: number;
      dinners: number;
      snacks: number;
    },
    userPreferences: UserContext,
  ): PromptTemplate {
    // DEBUG: Log normalized user context
    const normalized = normalizeUserContext(userPreferences || {});
    console.debug(
      '[PromptBuilder] Normalized User Context (Weekly):',
      normalized,
    );
    const {
      allergies,
      dietaryRestrictions,
      cuisinePreferences,
      calories,
      protein,
      carbs,
      fat,
      preferredIngredients,
      avoidedIngredients,
      userProfile,
      mealComplexity,
    } = normalized;

    const { breakfasts, lunches, dinners, snacks } = mealCounts;

    const system = `You are an expert meal planner and chef. Generate a weekly meal plan for a user with the following preferences and nutrition targets. Each meal must be unique, match the user's dietary and cuisine preferences, and provide a healthy balance (fiber-rich carbs, non-starchy vegetables, lean protein, healthy fat). Ensure cuisines are varied across the week.\n\nReturn a JSON object with four arrays: breakfasts, lunches, dinners, snacks. Each array should contain exactly the requested number of recipes (one per day), and each recipe must follow this schema: [Recipe schema].`;

    // Build user preferences string
    let userPrefs = '';
    if (allergies.length > 0)
      userPrefs += `- Allergies: ${allergies.join(', ')}\n`;
    if (dietaryRestrictions.length > 0)
      userPrefs += `- Dietary restrictions: ${dietaryRestrictions.join(', ')}\n`;
    if (cuisinePreferences.length > 0)
      userPrefs += `- Cuisine preferences: ${cuisinePreferences.join(', ')}\n`;
    if (calories) userPrefs += `- Calories per meal: ~${calories} kcal\n`;
    if (protein) userPrefs += `- Protein: ${protein}g or more\n`;
    if (carbs) userPrefs += `- Carbohydrates: ~${carbs}g\n`;
    if (fat) userPrefs += `- Fat: ~${fat}g\n`;
    if (preferredIngredients.length > 0)
      userPrefs += `- Preferred ingredients: ${preferredIngredients.join(', ')}\n`;
    if (avoidedIngredients.length > 0)
      userPrefs += `- Avoided ingredients: ${avoidedIngredients.join(', ')}\n`;
    if (userProfile) {
      if (userProfile.age) userPrefs += `- Age: ${userProfile.age}\n`;
      if (userProfile.weight)
        userPrefs += `- Weight: ${userProfile.weight} lbs\n`;
      if (userProfile.height)
        userPrefs += `- Height: ${userProfile.height} in\n`;
      if (userProfile.activityLevel)
        userPrefs += `- Activity level: ${userProfile.activityLevel}\n`;
      if (userProfile.goals)
        userPrefs += `- Goals: ${Array.isArray(userProfile.goals) ? userProfile.goals.join(', ') : userProfile.goals}\n`;
    }
    userPrefs += `- Desired meal complexity: ${mealComplexity}\n`;

    // Use the template utility for the user prompt
    const user = getWeeklyMealPlanPromptTemplate()
      .replace('{{userPreferences}}', userPrefs.trim())
      .replace('{{breakfasts}}', String(breakfasts))
      .replace('{{lunches}}', String(lunches))
      .replace('{{dinners}}', String(dinners))
      .replace('{{snacks}}', String(snacks))
      .replace('{{mealComplexity}}', String(mealComplexity))
      .replace('{{schema}}', getRecipeSchemaString());

    return { system, user };
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
   * Build variety-enhanced prompt with creativity seeds and avoidance mechanisms
   */
  buildVarietyEnhancedPrompt(
    request: RecipeGenerationRequest,
    userContext?: UserContext,
    varietyConfig?: VarietyConfig,
    recentRecipes?: SimpleRecipe[],
  ): PromptTemplate {
    // DEBUG: Log normalized user context and variety config
    const normalized = normalizeUserContext(userContext || {});
    console.debug(
      '[PromptBuilder] Normalized User Context (Variety):',
      normalized,
    );
    console.debug('[PromptBuilder] Variety Config:', varietyConfig);
    // Start with base prompt template
    const baseTemplate = this.buildRecipePrompt(request, userContext);

    // Enhance system prompt with variety instructions
    const varietySystemEnhancements = this.buildVarietySystemPrompt(
      varietyConfig,
      recentRecipes,
    );
    const enhancedSystemPrompt = `${baseTemplate.system}\n\n${varietySystemEnhancements}`;

    // Enhance user prompt with variety specifications
    const varietyUserEnhancements = this.buildVarietyUserPrompt(
      varietyConfig,
      recentRecipes,
    );
    const enhancedUserPrompt = `${baseTemplate.user}\n\n${varietyUserEnhancements}`;

    return {
      system: enhancedSystemPrompt,
      user: enhancedUserPrompt,
    };
  }

  /**
   * Build variety-specific system prompt enhancements
   */
  private buildVarietySystemPrompt(
    varietyConfig?: VarietyConfig,
    recentRecipes?: SimpleRecipe[],
  ): string {
    let prompt = '## VARIETY AND CREATIVITY REQUIREMENTS:\n';

    if (varietyConfig) {
      prompt += `- Complexity Target: Aim for ${varietyConfig.complexityTarget} difficulty level\n`;
    }

    if (recentRecipes && recentRecipes.length > 0) {
      prompt += '\n## AVOID REPETITION:\n';
      prompt +=
        '- Create something distinctly different from recently generated recipes\n';
      prompt +=
        '- Use different cooking methods, ingredient combinations, and flavor profiles\n';
      prompt += '- Ensure the recipe name and concept are unique\n';
    }

    prompt += '\n## CREATIVITY GUIDELINES:\n';
    prompt += '- Think outside conventional recipe patterns\n';
    prompt += '- Consider unexpected but harmonious ingredient combinations\n';
    prompt += '- Apply innovative cooking techniques where appropriate\n';
    prompt +=
      '- Focus on creating a memorable and distinctive culinary experience\n';

    return prompt;
  }

  /**
   * Build variety-specific user prompt enhancements
   */
  private buildVarietyUserPrompt(
    varietyConfig?: VarietyConfig,
    recentRecipes?: SimpleRecipe[],
  ): string {
    let prompt = '\n## CREATIVITY AND VARIETY SPECIFICATIONS:\n';

    if (
      varietyConfig?.avoidanceTerms &&
      varietyConfig.avoidanceTerms.length > 0
    ) {
      prompt += `\n### AVOID THESE ELEMENTS:\n`;
      prompt += `- Ingredients/themes used recently: ${varietyConfig.avoidanceTerms.join(', ')}\n`;
      prompt +=
        '- Ensure your recipe takes a different approach from these recent elements\n';
    }

    if (recentRecipes && recentRecipes.length > 3) {
      prompt += `\n### VARIETY REQUIREMENT:\n`;
      prompt +=
        "- The generated recipe must be significantly different from the user's recent recipes\n";
      prompt +=
        '- Use different primary ingredients, cooking methods, and cuisine styles\n';
      prompt +=
        '- Aim for maximum culinary diversity and creative innovation\n';
    }

    prompt += '\n### FINAL VARIETY CHECK:\n';
    prompt +=
      '- Before finalizing, ensure this recipe offers something genuinely new and exciting\n';
    prompt +=
      '- Verify that ingredients, techniques, and flavors create a unique culinary experience\n';
    prompt +=
      '- The recipe should inspire culinary exploration and discovery\n';

    return prompt;
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
}

// Export a default instance
export const promptBuilder = new PromptBuilderService();
