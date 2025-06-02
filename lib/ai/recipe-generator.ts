import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import {
  RecipeGenerationRequestSchema,
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

export interface EnhancedRecipeGenerationRequest
  extends RecipeGenerationRequest {
  userContext?: UserContext;
  learningEnabled?: boolean;
}

export interface RecipeGenerationResult {
  recipe: Recipe;
  confidence: number;
  issues: string[];
  nutritionAccuracy: number;
  generationMetadata: {
    promptUsed: string;
    modelResponse: string;
    processingTime: number;
    feedbackInsights?: FeedbackInsights;
  };
}

export class RecipeGeneratorService {
  private model = openai('gpt-4.1-nano');

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  /**
   * Generate a recipe with enhanced AI integration and user learning
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

      // Build user context for enhanced prompting
      const userContext = this.buildUserContext(
        request.userContext,
        userRecipes,
        userFeedbacks,
        nutritionProfile,
      );

      // Generate enhanced prompt with user context
      const promptTemplate = promptBuilder.buildRecipePrompt(
        validatedRequest,
        userContext,
      );

      // Generate recipe using AI
      const { text } = await generateText({
        model: this.model,
        system: promptTemplate.system,
        prompt: promptTemplate.user,
      });

      // Parse and validate the response
      const parsedResult = recipeParser.parseRecipeResponse(text);

      // Apply post-processing improvements
      const enhancedRecipe = this.enhanceRecipe(
        parsedResult.recipe,
        validatedRequest,
        userContext,
      );

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
        confidence: parsedResult.confidence,
        issues: parsedResult.issues,
        nutritionAccuracy: parsedResult.nutritionAccuracy,
        generationMetadata: {
          promptUsed: promptTemplate.user,
          modelResponse: text,
          processingTime,
          feedbackInsights,
        },
      };
    } catch (error) {
      console.error('Enhanced recipe generation failed:', error);

      // Fallback to basic generation
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

    // Sort by confidence and nutrition accuracy
    return candidates.sort((a, b) => {
      const scoreA = a.confidence * 0.6 + a.nutritionAccuracy * 0.4;
      const scoreB = b.confidence * 0.6 + b.nutritionAccuracy * 0.4;
      return scoreB - scoreA;
    });
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
   * Enhance recipe with additional context and validation
   */
  private enhanceRecipe(
    recipe: Recipe,
    request: RecipeGenerationRequest,
    _userContext?: UserContext,
  ): Recipe {
    // Add cuisine type if not specified
    if (!recipe.cuisineType && request.cuisinePreferences?.length) {
      recipe.cuisineType = request.cuisinePreferences[0];
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

    recipe.tags = [...new Set(tags)]; // Remove duplicates

    return recipe;
  }

  /**
   * Check if recipe is vegetarian/vegan based on ingredients
   */
  private checkVegetarianIngredients(ingredients: Recipe['ingredients']): {
    isVegetarian: boolean;
    isVegan: boolean;
  } {
    const meatKeywords = [
      'chicken',
      'beef',
      'pork',
      'fish',
      'turkey',
      'lamb',
      'bacon',
      'ham',
    ];
    const animalProductKeywords = [
      'cheese',
      'milk',
      'butter',
      'eggs',
      'yogurt',
      'cream',
    ];

    const ingredientNames = ingredients
      .map(i => i.name.toLowerCase())
      .join(' ');

    const hasMeat = meatKeywords.some(keyword =>
      ingredientNames.includes(keyword),
    );
    const hasAnimalProducts = animalProductKeywords.some(keyword =>
      ingredientNames.includes(keyword),
    );

    return {
      isVegetarian: !hasMeat,
      isVegan: !hasMeat && !hasAnimalProducts,
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

      const { text } = await generateText({
        model: this.model,
        system:
          'You are a professional chef and nutritionist. Generate recipes that match exact nutritional requirements and return them in JSON format.',
        prompt,
      });

      // Basic parsing without advanced validation
      let parsedRecipe: unknown;
      try {
        parsedRecipe = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response from AI service');
      }

      // This is a simplified fallback - using basic validation
      const recipe = parsedRecipe as Recipe;

      return {
        recipe,
        confidence: 0.5, // Lower confidence for fallback
        issues: ['Used fallback generation method'],
        nutritionAccuracy: 0.7, // Assumed lower accuracy
        generationMetadata: {
          promptUsed: prompt,
          modelResponse: text,
          processingTime: 0,
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
