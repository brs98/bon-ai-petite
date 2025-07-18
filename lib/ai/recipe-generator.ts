import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import * as dotenv from 'dotenv';
import {
  RecipeGenerationRequestSchema,
  RecipeGenerationSchema,
  type Recipe,
  type RecipeFeedback,
  type RecipeGenerationRequest,
} from '../../types/recipe';
import { type NutritionProfile } from '../db/schema';
import { feedbackProcessor, type FeedbackInsights } from './feedback-processor';
import { promptBuilder, type UserContext } from './prompt-builder';
import { recipeParser } from './recipe-parser';

// Load environment variables
dotenv.config();

// Enhanced variety mechanisms
interface VarietyConfig {
  avoidanceTerms: string[];
  cuisineRotation: string[];
  complexityTarget: 'simple' | 'moderate' | 'complex';
}

interface RecipeGenerationSession {
  sessionId: string;
  recentRecipes: Recipe[];
  varietyConfig: VarietyConfig;
  lastGenerationTime: Date;
}

export interface EnhancedRecipeGenerationRequest
  extends RecipeGenerationRequest {
  userContext?: UserContext;
  learningEnabled?: boolean;
  varietyBoost?: boolean;
  avoidSimilarRecipes?: boolean;
  sessionId?: string;
}

export interface RecipeGenerationResult {
  recipe: Recipe;
  confidence: number;
  issues: string[];
  nutritionAccuracy: number;
  varietyScore: number;
  generationMetadata: {
    promptUsed: string;
    modelResponse: string;
    processingTime: number;
    feedbackInsights?: FeedbackInsights;
    varietyConfig: VarietyConfig;
    sessionInfo: {
      avoidanceTermsUsed: string[];
    };
  };
}

/**
 * RecipeGeneratorService
 *
 * This class generates recipes and enforces all requirements from:
 *   - recipe_prompt.md (see /Users/brandon/Downloads/recipe_prompt.md)
 *
 * Each validation block below is mapped to a section in the markdown for maintainability.
 */
export class RecipeGeneratorService {
  private model = openai('gpt-4.1-nano', {
    structuredOutputs: true,
  });

  // Session tracking for variety
  private sessions: Map<string, RecipeGenerationSession> = new Map();

  // Global recipe variety tracking
  private globalRecipePatterns: {
    recentCuisines: string[];
    recentIngredients: string[];
    recentTechniques: string[];
    lastResetTime: Date;
  } = {
    recentCuisines: [],
    recentIngredients: [],
    recentTechniques: [],
    lastResetTime: new Date(),
  };

  // Variety enhancement pools
  private readonly varietyPools = {
    cuisines: [
      'Mediterranean',
      'Asian Fusion',
      'Mexican',
      'Indian',
      'Thai',
      'Italian',
      'Middle Eastern',
      'Moroccan',
      'Ethiopian',
      'Korean',
      'Vietnamese',
      'Peruvian',
      'Brazilian',
      'Caribbean',
      'French',
      'Spanish',
      'Greek',
      'Turkish',
      'Lebanese',
      'Japanese',
      'Chinese',
      'Southern American',
      'Nordic',
      'German',
      'Russian',
      'African',
      'Cajun',
      'Tex-Mex',
    ],
    cookingTechniques: [
      'roasting',
      'grilling',
      'braising',
      'sautéing',
      'steaming',
      'poaching',
      'stir-frying',
      'slow-cooking',
      'pressure-cooking',
      'smoking',
      'broiling',
      'baking',
      'pan-searing',
      'marinating',
      'fermentation',
      'pickling',
      'caramelizing',
      'reduction',
      'sous-vide',
      'air-frying',
      'dehydrating',
    ],
  };

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Reset global patterns daily
    setInterval(() => this.resetGlobalPatterns(), 24 * 60 * 60 * 1000);
  }

  /**
   * Generate a recipe with enhanced variety mechanisms
   */
  async generateRecipe(
    request: EnhancedRecipeGenerationRequest,
    userRecipes?: Recipe[],
    userFeedbacks?: RecipeFeedback[],
    nutritionProfile?: NutritionProfile,
  ): Promise<RecipeGenerationResult> {
    const startTime = Date.now();

    const maxAttempts = 3;
    let lastResult: RecipeGenerationResult | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Validate the input request
        const validatedRequest = RecipeGenerationRequestSchema.parse(request);

        // Get or create generation session for variety tracking
        const session = this.getOrCreateSession(
          request.sessionId || 'default',
          userRecipes,
        );

        // Generate variety configuration
        const varietyConfig = this.generateVarietyConfig(
          validatedRequest,
          session,
        );

        // Build user context for enhanced prompting
        const userContext = this.buildUserContext(
          request.userContext,
          userRecipes,
          userFeedbacks,
          nutritionProfile,
        );

        // Generate enhanced prompt with variety mechanisms
        // recentRecipes is now required
        const promptTemplate = promptBuilder.buildVarietyEnhancedPrompt(
          validatedRequest,
          userContext,
          varietyConfig,
          session.recentRecipes, // always pass the session's recentRecipes
        );

        // Generate recipe using structured output with dynamic temperature
        const { object: generatedRecipe } = await generateObject({
          model: this.model,
          schema: RecipeGenerationSchema,
          schemaName: 'Recipe',
          schemaDescription:
            'A creative and unique recipe that avoids repetition while meeting nutritional requirements',
          system: promptTemplate.system,
          prompt: promptTemplate.user, // Ensure prompt is always provided
          temperature: 0.7,
        });

        // Convert generated recipe to full Recipe type
        const recipe: Recipe = {
          ...generatedRecipe,
          cuisineType:
            generatedRecipe.cuisineType ||
            varietyConfig.cuisineRotation[0] ||
            'American',
          tags: this.enhanceTagsWithVariety(
            generatedRecipe.tags || [],
            varietyConfig,
          ),
          id: undefined,
          isSaved: false,
          rating: undefined,
          userId: undefined,
          createdAt: undefined,
        };

        // Apply post-processing improvements with variety considerations
        const enhancedRecipe = this.enhanceRecipeWithVariety(
          recipe,
          validatedRequest,
          userContext,
          varietyConfig,
        );

        // === Post-processing validation for user preferences ===
        // See: recipe_prompt.md > User Preferences, Required Recipe Components, Avoid Repetition, Final Quality Check
        const issues: string[] = [];
        // Cuisine preference check
        const cuisinePrefs = validatedRequest.cuisinePreferences ?? [];
        if (
          cuisinePrefs.length > 0 &&
          !cuisinePrefs.includes(enhancedRecipe.cuisineType || '')
        ) {
          issues.push(
            `Recipe cuisine (${enhancedRecipe.cuisineType}) does not match user preferences (${cuisinePrefs.join(', ')})`,
          );
        }
        // Dietary restrictions check (simple string match on ingredient names)
        const dietaryRestrictions = validatedRequest.dietaryRestrictions ?? [];
        if (dietaryRestrictions.length > 0 && enhancedRecipe.ingredients) {
          const lowerRestrictions = dietaryRestrictions.map(r =>
            r.toLowerCase(),
          );
          for (const ingredient of enhancedRecipe.ingredients) {
            for (const restriction of lowerRestrictions) {
              if (ingredient.name.toLowerCase().includes(restriction)) {
                issues.push(
                  `Ingredient '${ingredient.name}' may violate dietary restriction '${restriction}'`,
                );
              }
            }
          }
        }
        // --- Strict allergen check (markdown: strictly avoid all allergens) ---
        // See: recipe_prompt.md > Required Recipe Components, Avoid Repetition
        const allergens = validatedRequest.allergies ?? [];
        if (allergens.length > 0 && enhancedRecipe.ingredients) {
          const lowerAllergens = allergens.map(a => a.toLowerCase());
          for (const ingredient of enhancedRecipe.ingredients) {
            for (const allergen of lowerAllergens) {
              if (ingredient.name.toLowerCase().includes(allergen)) {
                issues.push(
                  `Ingredient '${ingredient.name}' may contain allergen '${allergen}'`,
                );
              }
            }
          }
        }
        // --- Forbidden ingredients and cuisine themes (markdown: avoid repetition section) ---
        // See: recipe_prompt.md > Avoid Repetition
        const forbiddenIngredients = [
          'tamari',
          'soy sauce',
          'cayenne pepper',
          'garlic powder',
          'spring onion',
          'cucumber',
        ];
        const forbiddenCuisines = [
          'mediterranean',
          'scandinavian-inspired',
          'asian',
        ];
        if (enhancedRecipe.ingredients) {
          for (const ingredient of enhancedRecipe.ingredients) {
            for (const forbidden of forbiddenIngredients) {
              if (ingredient.name.toLowerCase().includes(forbidden)) {
                issues.push(
                  `Ingredient '${ingredient.name}' is forbidden by prompt requirements (${forbidden})`,
                );
              }
            }
          }
        }
        if (
          enhancedRecipe.cuisineType &&
          forbiddenCuisines.some(c =>
            (enhancedRecipe.cuisineType || '').toLowerCase().includes(c),
          )
        ) {
          issues.push(
            `Cuisine type '${enhancedRecipe.cuisineType}' is forbidden by prompt requirements`,
          );
        }
        // --- Nutrition targets (markdown: meets all nutritional targets) ---
        // See: recipe_prompt.md > User Preferences, Final Quality Check
        const nutrition = enhancedRecipe.nutrition;
        function withinTolerance(val: number, target: number, tolerance = 0.1) {
          return (
            val >= target * (1 - tolerance) && val <= target * (1 + tolerance)
          );
        }
        if (
          validatedRequest.calories &&
          nutrition &&
          typeof nutrition.calories === 'number'
        ) {
          if (!withinTolerance(nutrition.calories, validatedRequest.calories)) {
            issues.push(
              `Calories (${nutrition.calories}) not within 10% of target (${validatedRequest.calories})`,
            );
          }
        }
        if (
          validatedRequest.protein &&
          nutrition &&
          typeof nutrition.protein === 'number'
        ) {
          if (nutrition.protein < validatedRequest.protein) {
            issues.push(
              `Protein (${nutrition.protein}) is less than requested minimum (${validatedRequest.protein})`,
            );
          }
        }
        if (
          validatedRequest.carbs &&
          nutrition &&
          typeof nutrition.carbs === 'number'
        ) {
          if (!withinTolerance(nutrition.carbs, validatedRequest.carbs)) {
            issues.push(
              `Carbohydrates (${nutrition.carbs}) not within 10% of target (${validatedRequest.carbs})`,
            );
          }
        }
        if (
          validatedRequest.fat &&
          nutrition &&
          typeof nutrition.fat === 'number'
        ) {
          if (!withinTolerance(nutrition.fat, validatedRequest.fat)) {
            issues.push(
              `Fat (${nutrition.fat}) not within 10% of target (${validatedRequest.fat})`,
            );
          }
        }
        // --- Serving size (markdown: meets serving size) ---
        // See: recipe_prompt.md > User Preferences, Final Quality Check
        if (
          validatedRequest.servings &&
          enhancedRecipe.servings !== validatedRequest.servings
        ) {
          issues.push(
            `Servings (${enhancedRecipe.servings}) does not match requested (${validatedRequest.servings})`,
          );
        }
        // --- Total time (markdown: can be prepared in 20 minutes or less) ---
        // See: recipe_prompt.md > User Preferences, Final Quality Check
        const totalTime =
          typeof validatedRequest.timeToMake === 'number'
            ? validatedRequest.timeToMake
            : 20;
        if (
          (enhancedRecipe.prepTime || 0) + (enhancedRecipe.cookTime || 0) >
          totalTime
        ) {
          issues.push(
            `Total time (prep + cook = ${(enhancedRecipe.prepTime || 0) + (enhancedRecipe.cookTime || 0)}) exceeds allowed (${totalTime})`,
          );
        }
        // --- Difficulty, meal type, complexity (markdown: matches user’s request) ---
        // See: recipe_prompt.md > User Preferences, Final Quality Check
        if (
          validatedRequest.difficulty &&
          enhancedRecipe.difficulty !== validatedRequest.difficulty
        ) {
          issues.push(
            `Difficulty (${enhancedRecipe.difficulty}) does not match requested (${validatedRequest.difficulty})`,
          );
        }
        if (
          validatedRequest.mealType &&
          enhancedRecipe.mealType !== validatedRequest.mealType
        ) {
          issues.push(
            `Meal type (${enhancedRecipe.mealType}) does not match requested (${validatedRequest.mealType})`,
          );
        }
        if (
          validatedRequest.mealComplexity &&
          enhancedRecipe.tags &&
          !enhancedRecipe.tags.includes(validatedRequest.mealComplexity)
        ) {
          issues.push(
            `Recipe tags do not include requested complexity (${validatedRequest.mealComplexity})`,
          );
        }
        // --- Instructions clarity/simplicity (markdown: clear and simple instructions) ---
        // See: recipe_prompt.md > Final Quality Check
        if (enhancedRecipe.instructions) {
          if (enhancedRecipe.instructions.length > 10) {
            issues.push(
              'Recipe has more than 10 instruction steps (may not be simple enough)',
            );
          }
          for (const step of enhancedRecipe.instructions) {
            if (step.length > 300) {
              issues.push(
                'One or more instruction steps are too long (over 300 characters)',
              );
            }
          }
        }
        // --- End enhanced post-processing validation ---

        // Calculate variety score
        const varietyScore = this.calculateVarietyScore(
          enhancedRecipe,
          session.recentRecipes,
        );

        // --- Variety/uniqueness enforcement (markdown: distinctly different from recent ones) ---
        // See: recipe_prompt.md > Avoid Repetition
        // If variety score is low, or if name, main ingredients, or cooking methods are highly similar, flag as issue
        if (varietyScore < 0.5) {
          issues.push(
            'Recipe is too similar to a recent one (low variety score)',
          );
        }
        // Check for highly similar name
        if (
          session.recentRecipes.some(
            r =>
              this.calculateStringSimilarity(
                r.name.toLowerCase(),
                enhancedRecipe.name.toLowerCase(),
              ) > 0.8,
          )
        ) {
          issues.push('Recipe name is too similar to a recent one');
        }
        // Check for highly similar main ingredients
        const mainIngredients = (enhancedRecipe.ingredients || [])
          .map(i => i.name.toLowerCase())
          .slice(0, 3)
          .sort()
          .join(',');
        if (
          session.recentRecipes.some(
            r =>
              (r.ingredients || [])
                .map(i => i.name.toLowerCase())
                .slice(0, 3)
                .sort()
                .join(',') === mainIngredients,
          )
        ) {
          issues.push('Main ingredients are too similar to a recent recipe');
        }
        // Check for highly similar cooking methods
        const currentMethods = this.extractCookingMethodsFromInstructions(
          enhancedRecipe.instructions || [],
        );
        if (
          session.recentRecipes.some(r => {
            const prevMethods = this.extractCookingMethodsFromInstructions(
              r.instructions || [],
            );
            return (
              prevMethods.length > 0 &&
              currentMethods.length > 0 &&
              prevMethods.join(',') === currentMethods.join(',')
            );
          })
        ) {
          issues.push('Cooking methods are too similar to a recent recipe');
        }
        // --- End Healthy Balanced Meal Component Validation ---

        // [Family Friendly Update]: Check for family-friendliness
        // Check for excessive spiciness or ingredients not suitable for children
        const spicyTerms = [
          'chili',
          'chilli',
          'hot sauce',
          'jalapeno',
          'habanero',
          'cayenne',
          'sriracha',
          'ghost pepper',
          'spicy',
          'chipotle',
        ];
        const notFamilyFriendlyIngredients = (
          enhancedRecipe.ingredients || []
        ).filter(ingredient =>
          spicyTerms.some(term => ingredient.name.toLowerCase().includes(term)),
        );
        if (notFamilyFriendlyIngredients.length > 0) {
          issues.push(
            'Recipe contains ingredients that may be too spicy for children or not family friendly: ' +
              notFamilyFriendlyIngredients.map(i => i.name).join(', '),
          );
        }
        // Optionally, check for alcohol or other non-family-friendly ingredients
        const nonFamilyTerms = [
          'alcohol',
          'wine',
          'rum',
          'vodka',
          'tequila',
          'whiskey',
          'bourbon',
          'beer',
          'liqueur',
        ];
        const containsAlcohol = (enhancedRecipe.ingredients || []).some(
          ingredient =>
            nonFamilyTerms.some(term =>
              ingredient.name.toLowerCase().includes(term),
            ),
        );
        if (containsAlcohol) {
          issues.push(
            'Recipe contains alcohol or ingredients not suitable for all ages.',
          );
        }
        // Optionally, check for instructions that mention alcohol or spiciness
        if (enhancedRecipe.instructions) {
          for (const step of enhancedRecipe.instructions) {
            if (spicyTerms.some(term => step.toLowerCase().includes(term))) {
              issues.push(
                'Instructions may encourage making the dish too spicy for children.',
              );
            }
            if (
              nonFamilyTerms.some(term => step.toLowerCase().includes(term))
            ) {
              issues.push(
                'Instructions may encourage use of alcohol or non-family-friendly ingredients.',
              );
            }
          }
        }
        // --- End Healthy Balanced Meal Component Validation ---

        // Update session with new recipe
        this.updateSessionWithNewRecipe(session, enhancedRecipe);

        const processingTime = Date.now() - startTime;

        // Generate feedback insights if learning is enabled
        let feedbackInsights: FeedbackInsights | undefined;
        if (request.learningEnabled && userRecipes && userFeedbacks) {
          feedbackInsights = feedbackProcessor.processFeedback(
            userRecipes,
            userFeedbacks,
            nutritionProfile,
          );
        }

        const result: RecipeGenerationResult = {
          recipe: enhancedRecipe,
          confidence: 1.0,
          issues,
          nutritionAccuracy: 0.95,
          varietyScore,
          generationMetadata: {
            promptUsed: promptTemplate.user,
            modelResponse: JSON.stringify(recipe),
            processingTime,
            feedbackInsights,
            varietyConfig,
            sessionInfo: {
              avoidanceTermsUsed: varietyConfig.avoidanceTerms,
            },
          },
        };
        lastResult = result;
        // If no issues, return immediately; otherwise, retry
        if (issues.length === 0) {
          return result;
        }
        // Optionally, you could log or collect issues here for debugging
      } catch (error) {
        // On error, break and fallback
        console.error('Enhanced recipe generation failed:', error);
        break;
      }
    }
    // If all attempts had issues, return the last result (with issues)
    if (lastResult) {
      return lastResult;
    }
    // If everything failed, fallback
    return this.fallbackGeneration(request);
  }

  /**
   * Generate multiple recipe candidates and rank them
   */
  async generateRecipeCandidates(
    request: EnhancedRecipeGenerationRequest,
    count: number = 3,
    userRecipes?: Recipe[],
    userFeedbacks?: RecipeFeedback[],
    nutritionProfile?: NutritionProfile,
  ): Promise<RecipeGenerationResult[]> {
    const candidates = await Promise.all(
      Array.from({ length: count }, () =>
        this.generateRecipe(
          request,
          userRecipes,
          userFeedbacks,
          nutritionProfile,
        ),
      ),
    );

    // Sort by variety score and confidence
    return candidates.sort((a, b) => {
      const scoreA =
        a.confidence * 0.4 + a.nutritionAccuracy * 0.3 + a.varietyScore * 0.3;
      const scoreB =
        b.confidence * 0.4 + b.nutritionAccuracy * 0.3 + b.varietyScore * 0.3;
      return scoreB - scoreA;
    });
  }

  /**
   * Reset global pattern tracking daily to maintain variety
   */
  private resetGlobalPatterns(): void {
    this.globalRecipePatterns = {
      recentCuisines: [],
      recentIngredients: [],
      recentTechniques: [],
      lastResetTime: new Date(),
    };
  }

  /**
   * Get or create a generation session for variety tracking
   */
  private getOrCreateSession(
    sessionId: string,
    _userRecipes?: Recipe[],
  ): RecipeGenerationSession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        recentRecipes: _userRecipes?.slice(-10) || [], // Last 10 recipes for context
        varietyConfig: this.createBaseVarietyConfig(),
        lastGenerationTime: new Date(),
      });
    }
    return this.sessions.get(sessionId)!;
  }

  /**
   * Generate variety configuration for recipe generation
   */
  private generateVarietyConfig(
    request: RecipeGenerationRequest,
    session: RecipeGenerationSession,
    _userRecipes?: Recipe[],
  ): VarietyConfig {
    // Get recent ingredients/cuisines to avoid
    const recentIngredients = this.extractRecentIngredients(
      session.recentRecipes,
    );
    const recentCuisines = this.extractRecentCuisines(session.recentRecipes);

    // Define userCuisinePrefs early so it can be used for filtering
    const userCuisinePrefs = (request.cuisinePreferences || []).map(c =>
      c.toLowerCase(),
    );

    // Filter recentCuisines to exclude user cuisine preferences before adding to avoidanceTerms
    const filteredRecentCuisines = recentCuisines.filter(
      c => !userCuisinePrefs.includes((c || '').toLowerCase()),
    );
    const complexityTarget =
      (request.mealComplexity as 'simple' | 'moderate' | 'complex') || 'simple';

    // STRICT: Only use user cuisine preferences if provided
    let cuisineRotation: string[] = [];
    if (request.cuisinePreferences && request.cuisinePreferences.length > 0) {
      cuisineRotation = [...request.cuisinePreferences];
    } else {
      // If no user preference, fallback to global pool (with variety)
      const availableCuisines = this.varietyPools.cuisines.filter(
        c => !recentCuisines.includes(c),
      );
      cuisineRotation = this.shuffleArray(availableCuisines).slice(0, 2);
    }

    return {
      avoidanceTerms: [
        ...recentIngredients.slice(0, 5),
        ...filteredRecentCuisines.slice(0, 3),
      ],
      cuisineRotation,
      complexityTarget,
    };
  }

  /**
   * Create base variety configuration
   */
  private createBaseVarietyConfig(): VarietyConfig {
    return {
      avoidanceTerms: [],
      cuisineRotation: ['American'],
      complexityTarget: 'simple',
    };
  }

  /**
   * Enhance tags with variety considerations
   */
  private enhanceTagsWithVariety(
    baseTags: string[],
    varietyConfig: VarietyConfig,
  ): string[] {
    const tags = [...baseTags];

    // Remove all creativitySeed-based tag logic
    // Only add technique-based and complexity tags
    tags.push(`${varietyConfig.cuisineRotation[0]}-technique`);

    if (varietyConfig.complexityTarget === 'simple')
      tags.push('quick-and-easy');
    if (varietyConfig.complexityTarget === 'complex')
      tags.push('gourmet-level');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate variety score compared to recent recipes
   */
  private calculateVarietyScore(
    recipe: Recipe,
    recentRecipes: Recipe[],
  ): number {
    // Only consider the last 10 recipes for variety calculation
    const last10Recipes = recentRecipes.slice(-10);
    console.log('last10recipes', last10Recipes);
    if (last10Recipes.length === 0) return 1.0;

    let varietyPoints = 0;
    let totalChecks = 0;

    // Check cuisine variety
    const recentCuisines = last10Recipes
      .map(r => r.cuisineType)
      .filter(Boolean);
    if (!recentCuisines.includes(recipe.cuisineType)) varietyPoints += 2;
    totalChecks += 2;

    // Check ingredient variety
    const recentIngredients = last10Recipes.flatMap(
      r => r.ingredients?.map(i => i.name.toLowerCase()) || [],
    );
    const recipeIngredients =
      recipe.ingredients?.map(i => i.name.toLowerCase()) || [];
    const uniqueIngredients = recipeIngredients.filter(
      i => !recentIngredients.some(ri => ri.includes(i) || i.includes(ri)),
    );
    varietyPoints += Math.min(
      (uniqueIngredients.length / recipeIngredients.length) * 3,
      3,
    );
    totalChecks += 3;

    // Check cooking method variety (inferred from instructions)
    const recentMethods = this.extractCookingMethodsFromInstructions(
      last10Recipes.flatMap(r => r.instructions || []),
    );
    const recipeMethods = this.extractCookingMethodsFromInstructions(
      recipe.instructions || [],
    );
    const uniqueMethods = recipeMethods.filter(m => !recentMethods.includes(m));
    varietyPoints += Math.min(uniqueMethods.length, 2);
    totalChecks += 2;

    // Check name similarity
    const recentNames = last10Recipes.map(r => r.name.toLowerCase());
    const nameSimilarity = recentNames.some(
      name =>
        this.calculateStringSimilarity(name, recipe.name.toLowerCase()) > 0.6,
    );
    if (!nameSimilarity) varietyPoints += 1;
    totalChecks += 1;

    return Math.min(varietyPoints / totalChecks, 1.0);
  }

  /**
   * Update session with newly generated recipe
   */
  private updateSessionWithNewRecipe(
    session: RecipeGenerationSession,
    recipe: Recipe,
  ): void {
    session.recentRecipes.push(recipe);
    // Keep only last 15 recipes to maintain relevance
    if (session.recentRecipes.length > 15) {
      session.recentRecipes = session.recentRecipes.slice(-15);
    }
    session.lastGenerationTime = new Date();

    // Update global patterns
    if (recipe.cuisineType) {
      this.globalRecipePatterns.recentCuisines.push(recipe.cuisineType);
      if (this.globalRecipePatterns.recentCuisines.length > 20) {
        this.globalRecipePatterns.recentCuisines =
          this.globalRecipePatterns.recentCuisines.slice(-20);
      }
    }
  }

  /**
   * Extract recent ingredients from recipe history
   */
  private extractRecentIngredients(recipes: Recipe[]): string[] {
    return recipes
      .flatMap(r => r.ingredients?.map(i => i.name) || [])
      .slice(-30); // Last 30 ingredients
  }

  /**
   * Extract recent cuisines from recipe history
   */
  private extractRecentCuisines(recipes: Recipe[]): string[] {
    return recipes
      .map(r => r.cuisineType)
      .filter((cuisine): cuisine is string => Boolean(cuisine))
      .slice(-10); // Last 10 cuisines
  }

  /**
   * Extract cooking methods from instructions
   */
  private extractCookingMethodsFromInstructions(
    instructions: string[],
  ): string[] {
    const methods: string[] = [];
    const instructionText = instructions.join(' ').toLowerCase();

    this.varietyPools.cookingTechniques.forEach(technique => {
      if (instructionText.includes(technique)) {
        methods.push(technique);
      }
    });

    return [...new Set(methods)];
  }

  /**
   * Calculate string similarity using simple algorithm
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Build comprehensive user context from various data sources
   */
  private buildUserContext(
    baseContext?: UserContext,
    userRecipes?: Recipe[],
    userFeedbacks?: RecipeFeedback[],
    nutritionProfile?: NutritionProfile,
  ): UserContext {
    const context: UserContext = {
      nutritionProfile,
      ...baseContext,
    };

    // Extract preferences from feedback if available
    if (userRecipes && userFeedbacks && userFeedbacks.length >= 3) {
      const preferences = recipeParser.extractIngredientPreferences(
        userRecipes,
        userFeedbacks.map(f => ({ liked: f.liked, recipeId: f.recipeId })),
      );

      context.preferredIngredients = preferences.preferred;
      context.avoidedIngredients = preferences.avoided;

      // Add recent feedback context
      context.recentFeedback = userFeedbacks
        .slice(-5) // Last 5 feedback entries
        .map(f => ({
          liked: f.liked,
          feedback: f.feedback,
          reportedIssues: f.reportedIssues,
        }));
    }

    return context;
  }

  /**
   * Enhance recipe with additional context and validation including variety considerations
   */
  private enhanceRecipeWithVariety(
    recipe: Recipe,
    request: RecipeGenerationRequest,
    _userContext?: UserContext,
    varietyConfig?: VarietyConfig,
  ): Recipe {
    // Add cuisine type if not specified
    if (!recipe.cuisineType && request.cuisinePreferences?.length) {
      recipe.cuisineType = request.cuisinePreferences[0];
    } else if (!recipe.cuisineType && varietyConfig?.cuisineRotation?.length) {
      recipe.cuisineType = varietyConfig.cuisineRotation[0];
    }

    // Calculate and add complexity tags
    const complexityAnalysis = recipeParser.calculateComplexityScore(recipe);
    const tags = recipe.tags || [];

    if (complexityAnalysis.score <= 3) {
      tags.push('quick-prep');
    }
    if (complexityAnalysis.score >= 7) {
      tags.push('advanced-cooking');
    }

    // Add dietary tags based on ingredients
    const vegetarianIngredients = this.checkVegetarianIngredients(
      recipe.ingredients,
    );
    if (vegetarianIngredients.isVegetarian) {
      tags.push('vegetarian');
    }
    if (vegetarianIngredients.isVegan) {
      tags.push('vegan');
    }

    // Add variety-specific tags if config provided
    if (varietyConfig) {
      if (varietyConfig.cuisineRotation.length > 0) {
        tags.push('fusion-cuisine');
      }
      // Remove all checks for creativitySeed and ingredientFocus
    }

    // [Family Friendly Update]: Always add a 'family-friendly' tag
    tags.push('family-friendly');

    recipe.tags = [...new Set(tags)]; // Remove duplicates

    return recipe;
  }

  /**
   * Check if ingredients are vegetarian/vegan
   */
  private checkVegetarianIngredients(ingredients: Recipe['ingredients']): {
    isVegetarian: boolean;
    isVegan: boolean;
  } {
    const meatTerms = [
      'chicken',
      'beef',
      'pork',
      'fish',
      'turkey',
      'lamb',
      'bacon',
      'sausage',
    ];
    const dairyTerms = ['milk', 'cheese', 'butter', 'cream', 'yogurt'];
    const eggTerms = ['egg', 'eggs'];

    const ingredientNames = ingredients.map(i => i.name.toLowerCase());

    const hasMeat = meatTerms.some(term =>
      ingredientNames.some(name => name.includes(term)),
    );
    const hasDairy = dairyTerms.some(term =>
      ingredientNames.some(name => name.includes(term)),
    );
    const hasEggs = eggTerms.some(term =>
      ingredientNames.some(name => name.includes(term)),
    );

    return {
      isVegetarian: !hasMeat,
      isVegan: !hasMeat && !hasDairy && !hasEggs,
    };
  }

  /**
   * Fallback generation method for when enhanced generation fails
   */
  private async fallbackGeneration(
    request: EnhancedRecipeGenerationRequest,
  ): Promise<RecipeGenerationResult> {
    try {
      const prompt = this.buildBasicPrompt(request);

      // Use structured output even for fallback
      const { object: generatedRecipe } = await generateObject({
        model: this.model,
        schema: RecipeGenerationSchema,
        schemaName: 'Recipe',
        schemaDescription: 'A basic recipe matching the user requirements',
        system:
          'You are a professional chef and nutritionist. Generate recipes that match exact nutritional requirements.',
        prompt,
        temperature: 0.6, // Slightly lower temperature for fallback
      });

      // Convert generated recipe to full Recipe type
      const recipe: Recipe = {
        ...generatedRecipe,
        // Ensure optional fields from the full Recipe schema have proper values
        cuisineType: generatedRecipe.cuisineType || 'American',
        tags: generatedRecipe.tags || [],
        // Optional fields that are not generated by AI
        id: undefined,
        isSaved: false,
        rating: undefined,
        userId: undefined,
        createdAt: undefined,
      };

      // Create fallback variety config
      const fallbackVarietyConfig: VarietyConfig =
        this.createBaseVarietyConfig();

      return {
        recipe,
        confidence: 0.8, // Still high confidence due to structured output
        issues: ['Used fallback generation method'],
        nutritionAccuracy: 0.85, // Still good accuracy with structured output
        varietyScore: 0.5, // Average variety score for fallback
        generationMetadata: {
          promptUsed: prompt,
          modelResponse: JSON.stringify(recipe),
          processingTime: 0,
          varietyConfig: fallbackVarietyConfig,
          sessionInfo: {
            avoidanceTermsUsed: [],
          },
        },
      };
    } catch (error) {
      console.error('Fallback generation also failed:', error);
      throw new Error('Recipe generation failed completely. Please try again.');
    }
  }

  /**
   * Build basic prompt for fallback generation
   */
  private buildBasicPrompt(request: RecipeGenerationRequest): string {
    const {
      mealType,
      calories,
      protein,
      carbs,
      fat,
      allergies = [],
      dietaryRestrictions = [],
      cuisinePreferences = [],
    } = request;

    let prompt = `Create a ${mealType} recipe with the following requirements:\n\n`;

    // Nutritional targets
    if (calories) prompt += `- Target calories: ${calories}\n`;
    if (protein) prompt += `- Protein: at least ${protein}g\n`;
    if (carbs) prompt += `- Carbohydrates: around ${carbs}g\n`;
    if (fat) prompt += `- Fat: around ${fat}g\n`;

    // Dietary restrictions
    if (allergies.length > 0) {
      prompt += `- MUST AVOID (allergies): ${allergies.join(', ')}\n`;
    }
    if (dietaryRestrictions.length > 0) {
      prompt += `- Dietary restrictions: ${dietaryRestrictions.join(', ')}\n`;
    }
    if (cuisinePreferences.length > 0) {
      prompt += `- Preferred cuisines: ${cuisinePreferences.join(', ')}\n`;
    }

    prompt += `\nReturn ONLY a JSON object with this exact structure:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "ingredients": [
    {"name": "ingredient name", "quantity": number, "unit": "unit"}
  ],
  "instructions": ["step 1", "step 2", "step 3"],
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "prepTime": number_in_minutes,
  "cookTime": number_in_minutes,
  "servings": number,
  "difficulty": "easy|medium|hard",
  "mealType": "${mealType}"
}`;

    return prompt;
  }

  /**
   * Analyze recipe generation patterns for improvement
   */
  analyzeGenerationPatterns(results: RecipeGenerationResult[]): {
    averageConfidence: number;
    averageNutritionAccuracy: number;
    commonIssues: string[];
    recommendedImprovements: string[];
  } {
    const confidences = results.map(r => r.confidence);
    const nutritionAccuracies = results.map(r => r.nutritionAccuracy);
    const allIssues = results.flatMap(r => r.issues);

    const averageConfidence =
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const averageNutritionAccuracy =
      nutritionAccuracies.reduce((sum, n) => sum + n, 0) /
      nutritionAccuracies.length;

    // Count issue occurrences
    const issueCounts: Record<string, number> = {};
    allIssues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    const commonIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    const recommendedImprovements: string[] = [];

    if (averageConfidence < 0.8) {
      recommendedImprovements.push('Improve prompt clarity and structure');
    }
    if (averageNutritionAccuracy < 0.8) {
      recommendedImprovements.push('Enhance nutrition validation and feedback');
    }
    if (commonIssues.includes('Recipe required repairs during validation')) {
      recommendedImprovements.push(
        'Improve AI model instructions for consistent formatting',
      );
    }

    return {
      averageConfidence,
      averageNutritionAccuracy,
      commonIssues,
      recommendedImprovements,
    };
  }
}

// Export a default instance
export const recipeGenerator = new RecipeGeneratorService();
