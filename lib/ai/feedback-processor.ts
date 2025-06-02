import { type Recipe, type RecipeFeedback } from '../../types/recipe';
import { type NutritionProfile } from '../db/schema';
import { recipeParser } from './recipe-parser';

export interface FeedbackInsights {
  ingredientPreferences: {
    preferred: string[];
    avoided: string[];
  };
  cuisinePreferences: {
    liked: string[];
    disliked: string[];
  };
  complexityPreferences: {
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    timePreferences: {
      maxPrepTime: number;
      maxCookTime: number;
    };
  };
  nutritionalPatterns: {
    preferredCalorieRange: { min: number; max: number };
    macroPreferences: {
      proteinTolerance: number;
      carbTolerance: number;
      fatTolerance: number;
    };
  };
  commonIssues: string[];
  promptOptimizations: string[];
}

export interface UserLearningProfile {
  userId: number;
  totalFeedback: number;
  positiveRatio: number;
  insights: FeedbackInsights;
  lastUpdated: Date;
  confidence: number;
}

export class FeedbackProcessorService {
  /**
   * Process user feedback to extract actionable insights
   */
  processFeedback(
    recipes: Recipe[],
    feedbacks: RecipeFeedback[],
    nutritionProfile?: NutritionProfile,
  ): FeedbackInsights {
    const likedRecipes = this.filterRecipesByFeedback(recipes, feedbacks, true);
    const dislikedRecipes = this.filterRecipesByFeedback(
      recipes,
      feedbacks,
      false,
    );

    // Extract ingredient preferences
    const ingredientPreferences = this.analyzeIngredientPreferences(
      likedRecipes,
      dislikedRecipes,
    );

    // Extract cuisine preferences
    const cuisinePreferences = this.analyzeCuisinePreferences(
      likedRecipes,
      dislikedRecipes,
    );

    // Analyze complexity preferences
    const complexityPreferences = this.analyzeComplexityPreferences(
      likedRecipes,
      dislikedRecipes,
    );

    // Extract nutritional patterns
    const nutritionalPatterns = this.analyzeNutritionalPatterns(
      likedRecipes,
      dislikedRecipes,
      nutritionProfile,
    );

    // Identify common issues from feedback
    const commonIssues = this.extractCommonIssues(feedbacks);

    // Generate prompt optimizations
    const promptOptimizations = this.generatePromptOptimizations(
      ingredientPreferences,
      cuisinePreferences,
      complexityPreferences,
      commonIssues,
    );

    return {
      ingredientPreferences,
      cuisinePreferences,
      complexityPreferences,
      nutritionalPatterns,
      commonIssues,
      promptOptimizations,
    };
  }

  /**
   * Generate learning profile for user based on historical feedback
   */
  generateUserLearningProfile(
    userId: number,
    recipes: Recipe[],
    feedbacks: RecipeFeedback[],
    nutritionProfile?: NutritionProfile,
  ): UserLearningProfile {
    const userFeedbacks = feedbacks.filter(f => f.userId === userId);
    const userRecipes = recipes.filter(r =>
      userFeedbacks.some(f => f.recipeId === r.id),
    );

    const totalFeedback = userFeedbacks.length;
    const positiveFeedback = userFeedbacks.filter(f => f.liked).length;
    const positiveRatio =
      totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;

    const insights = this.processFeedback(
      userRecipes,
      userFeedbacks,
      nutritionProfile,
    );

    // Calculate confidence based on feedback volume and consistency
    let confidence = 0.5; // Base confidence
    if (totalFeedback >= 5) confidence += 0.2;
    if (totalFeedback >= 10) confidence += 0.2;
    if (totalFeedback >= 20) confidence += 0.1;

    // Adjust confidence based on feedback consistency
    if (positiveRatio > 0.7 || positiveRatio < 0.3) {
      confidence += 0.1; // Clear preferences increase confidence
    }

    return {
      userId,
      totalFeedback,
      positiveRatio,
      insights,
      lastUpdated: new Date(),
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Filter recipes based on feedback sentiment
   */
  private filterRecipesByFeedback(
    recipes: Recipe[],
    feedbacks: RecipeFeedback[],
    liked: boolean,
  ): Recipe[] {
    const relevantFeedbacks = feedbacks.filter(f => f.liked === liked);
    return recipes.filter(recipe =>
      relevantFeedbacks.some(f => f.recipeId === recipe.id),
    );
  }

  /**
   * Analyze ingredient preferences from feedback
   */
  private analyzeIngredientPreferences(
    likedRecipes: Recipe[],
    dislikedRecipes: Recipe[],
  ): { preferred: string[]; avoided: string[] } {
    const allRecipes = [...likedRecipes, ...dislikedRecipes];
    const mockFeedback = [
      ...likedRecipes.map(r => ({ liked: true, recipeId: r.id! })),
      ...dislikedRecipes.map(r => ({ liked: false, recipeId: r.id! })),
    ];

    return recipeParser.extractIngredientPreferences(allRecipes, mockFeedback);
  }

  /**
   * Analyze cuisine preferences from feedback
   */
  private analyzeCuisinePreferences(
    likedRecipes: Recipe[],
    dislikedRecipes: Recipe[],
  ): { liked: string[]; disliked: string[] } {
    const likedCuisines = this.extractCuisineTypes(likedRecipes);
    const dislikedCuisines = this.extractCuisineTypes(dislikedRecipes);

    // Count occurrences
    const likedCounts = this.countOccurrences(likedCuisines);
    const dislikedCounts = this.countOccurrences(dislikedCuisines);

    // Filter by frequency (at least 2 occurrences)
    const liked = Object.entries(likedCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cuisine]) => cuisine);

    const disliked = Object.entries(dislikedCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cuisine]) => cuisine);

    return { liked, disliked };
  }

  /**
   * Analyze complexity preferences from feedback
   */
  private analyzeComplexityPreferences(
    likedRecipes: Recipe[],
    _dislikedRecipes: Recipe[],
  ): {
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    timePreferences: { maxPrepTime: number; maxCookTime: number };
  } {
    // Analyze difficulty preferences
    const likedDifficulties = likedRecipes.map(r => r.difficulty);
    const difficultyPreference =
      this.getMostCommon(likedDifficulties) || 'medium';

    // Analyze time preferences
    const likedPrepTimes = likedRecipes.map(r => r.prepTime);
    const likedCookTimes = likedRecipes.map(r => r.cookTime);

    const avgLikedPrepTime = this.calculateAverage(likedPrepTimes);
    const avgLikedCookTime = this.calculateAverage(likedCookTimes);

    // Add buffer to preferred times
    const maxPrepTime = Math.max(avgLikedPrepTime * 1.2, 15);
    const maxCookTime = Math.max(avgLikedCookTime * 1.2, 20);

    return {
      preferredDifficulty: difficultyPreference as 'easy' | 'medium' | 'hard',
      timePreferences: {
        maxPrepTime: Math.round(maxPrepTime),
        maxCookTime: Math.round(maxCookTime),
      },
    };
  }

  /**
   * Analyze nutritional patterns from feedback
   */
  private analyzeNutritionalPatterns(
    likedRecipes: Recipe[],
    _dislikedRecipes: Recipe[],
    _nutritionProfile?: NutritionProfile,
  ): {
    preferredCalorieRange: { min: number; max: number };
    macroPreferences: {
      proteinTolerance: number;
      carbTolerance: number;
      fatTolerance: number;
    };
  } {
    // Analyze calorie preferences
    const likedCalories = likedRecipes.map(r => r.nutrition.calories);
    const avgCalories = this.calculateAverage(likedCalories);
    const calorieStdDev = this.calculateStandardDeviation(likedCalories);

    const preferredCalorieRange = {
      min: Math.max(avgCalories - calorieStdDev, 100),
      max: avgCalories + calorieStdDev,
    };

    // Analyze macro tolerances (how much variation user accepts)
    const proteinValues = likedRecipes.map(r => r.nutrition.protein);
    const carbValues = likedRecipes.map(r => r.nutrition.carbs);
    const fatValues = likedRecipes.map(r => r.nutrition.fat);

    const macroPreferences = {
      proteinTolerance: this.calculateStandardDeviation(proteinValues) || 10,
      carbTolerance: this.calculateStandardDeviation(carbValues) || 20,
      fatTolerance: this.calculateStandardDeviation(fatValues) || 10,
    };

    return {
      preferredCalorieRange,
      macroPreferences,
    };
  }

  /**
   * Extract common issues from feedback text
   */
  private extractCommonIssues(feedbacks: RecipeFeedback[]): string[] {
    const issues: string[] = [];
    const issueKeywords = {
      too_complex: ['complex', 'complicated', 'difficult', 'hard'],
      too_bland: ['bland', 'tasteless', 'no flavor', 'boring'],
      too_spicy: ['spicy', 'hot', 'burn', 'fire'],
      too_salty: ['salty', 'salt'],
      too_sweet: ['sweet', 'sugar'],
      bad_ingredients: ['expensive', 'hard to find', 'unusual', 'weird'],
      too_long: ['long', 'time', 'quick', 'fast'],
      unhealthy: ['unhealthy', 'calories', 'fat', 'heavy'],
    };

    feedbacks.forEach(feedback => {
      if (!feedback.liked && feedback.feedback) {
        const feedbackText = feedback.feedback.toLowerCase();

        Object.entries(issueKeywords).forEach(([issue, keywords]) => {
          if (keywords.some(keyword => feedbackText.includes(keyword))) {
            issues.push(issue);
          }
        });

        // Also check reported issues
        if (feedback.reportedIssues) {
          issues.push(...feedback.reportedIssues);
        }
      }
    });

    // Count occurrences and return most common
    const issueCounts = this.countOccurrences(issues);
    return Object.entries(issueCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  /**
   * Generate prompt optimizations based on insights
   */
  private generatePromptOptimizations(
    ingredientPreferences: { preferred: string[]; avoided: string[] },
    cuisinePreferences: { liked: string[]; disliked: string[] },
    complexityPreferences: {
      preferredDifficulty: string;
      timePreferences: { maxPrepTime: number; maxCookTime: number };
    },
    commonIssues: string[],
  ): string[] {
    const optimizations: string[] = [];

    // Ingredient-based optimizations
    if (ingredientPreferences.preferred.length > 0) {
      optimizations.push(
        `Prioritize recipes containing: ${ingredientPreferences.preferred.slice(0, 3).join(', ')}`,
      );
    }

    if (ingredientPreferences.avoided.length > 0) {
      optimizations.push(
        `Avoid or minimize use of: ${ingredientPreferences.avoided.slice(0, 3).join(', ')}`,
      );
    }

    // Cuisine-based optimizations
    if (cuisinePreferences.liked.length > 0) {
      optimizations.push(
        `Favor ${cuisinePreferences.liked.slice(0, 2).join(' or ')} cuisine styles`,
      );
    }

    if (cuisinePreferences.disliked.length > 0) {
      optimizations.push(
        `Avoid ${cuisinePreferences.disliked.slice(0, 2).join(' and ')} cuisine styles`,
      );
    }

    // Complexity-based optimizations
    if (complexityPreferences.preferredDifficulty) {
      optimizations.push(
        `Prefer ${complexityPreferences.preferredDifficulty} difficulty recipes`,
      );
    }

    if (complexityPreferences.timePreferences.maxPrepTime < 30) {
      optimizations.push('Focus on quick prep recipes (under 30 minutes)');
    }

    // Issue-based optimizations
    commonIssues.forEach(issue => {
      switch (issue) {
        case 'too_complex':
          optimizations.push(
            'Simplify instructions and reduce technique complexity',
          );
          break;
        case 'too_bland':
          optimizations.push(
            'Include more flavorful ingredients and seasonings',
          );
          break;
        case 'too_spicy':
          optimizations.push(
            'Reduce spice levels and provide spice alternatives',
          );
          break;
        case 'bad_ingredients':
          optimizations.push('Use common, accessible ingredients');
          break;
        case 'too_long':
          optimizations.push('Prioritize recipes with shorter cooking times');
          break;
        case 'unhealthy':
          optimizations.push(
            'Focus on healthier cooking methods and ingredients',
          );
          break;
      }
    });

    return optimizations;
  }

  /**
   * Extract cuisine types from recipes
   */
  private extractCuisineTypes(recipes: Recipe[]): string[] {
    return recipes
      .map(r => r.cuisineType)
      .filter(
        (cuisine): cuisine is string =>
          cuisine !== undefined && cuisine !== null,
      );
  }

  /**
   * Count occurrences of items in array
   */
  private countOccurrences<T>(items: T[]): Record<string, number> {
    return items.reduce(
      (counts, item) => {
        const key = String(item);
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Get most common item from array
   */
  private getMostCommon<T>(items: T[]): T | null {
    if (items.length === 0) return null;

    const counts = this.countOccurrences(items);
    const [mostCommon] = Object.entries(counts).sort(([, a], [, b]) => b - a);

    return mostCommon ? (mostCommon[0] as T) : null;
  }

  /**
   * Calculate average of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const avg = this.calculateAverage(numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
    const avgSquaredDiff = this.calculateAverage(squaredDiffs);

    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Build contextual feedback summary for prompts
   */
  buildFeedbackContext(insights: FeedbackInsights): string {
    const context: string[] = [];

    if (insights.ingredientPreferences.preferred.length > 0) {
      context.push(
        `User enjoys: ${insights.ingredientPreferences.preferred.slice(0, 3).join(', ')}`,
      );
    }

    if (insights.ingredientPreferences.avoided.length > 0) {
      context.push(
        `User dislikes: ${insights.ingredientPreferences.avoided.slice(0, 3).join(', ')}`,
      );
    }

    if (insights.cuisinePreferences.liked.length > 0) {
      context.push(
        `Preferred cuisines: ${insights.cuisinePreferences.liked.join(', ')}`,
      );
    }

    if (insights.complexityPreferences.preferredDifficulty) {
      context.push(
        `Prefers ${insights.complexityPreferences.preferredDifficulty} difficulty recipes`,
      );
    }

    if (insights.commonIssues.length > 0) {
      context.push(`Common concerns: ${insights.commonIssues.join(', ')}`);
    }

    return context.join('. ');
  }
}

// Export a default instance
export const feedbackProcessor = new FeedbackProcessorService();
