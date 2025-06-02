import { z } from 'zod';
import { RecipeSchema, type Recipe } from '../../types/recipe';

export interface ParsedRecipe {
  recipe: Recipe;
  confidence: number;
  issues: string[];
  nutritionAccuracy: number;
}

export interface IngredientNormalization {
  original: string;
  normalized: string;
  quantity: number;
  unit: string;
  confidence: number;
}

export class RecipeParserService {
  private unitConversions = {
    // Volume conversions to cups
    tablespoons: 1 / 16,
    tablespoon: 1 / 16,
    tbsp: 1 / 16,
    teaspoons: 1 / 48,
    teaspoon: 1 / 48,
    tsp: 1 / 48,
    'fluid ounces': 1 / 8,
    'fl oz': 1 / 8,
    ounces: 1 / 8,
    oz: 1 / 8,
    pints: 2,
    pint: 2,
    pt: 2,
    quarts: 4,
    quart: 4,
    qt: 4,
    gallons: 16,
    gallon: 16,
    gal: 16,
    liters: 4.227,
    liter: 4.227,
    l: 4.227,
    milliliters: 1 / 236.588,
    milliliter: 1 / 236.588,
    ml: 1 / 236.588,
    cups: 1,
    cup: 1,
    c: 1,
  };

  private weightConversions = {
    // Weight conversions to grams
    pounds: 453.592,
    pound: 453.592,
    lb: 453.592,
    lbs: 453.592,
    ounces: 28.3495,
    ounce: 28.3495,
    oz: 28.3495,
    grams: 1,
    gram: 1,
    g: 1,
    kilograms: 1000,
    kilogram: 1000,
    kg: 1000,
  };

  /**
   * Parse and validate an AI-generated recipe response
   */
  parseRecipeResponse(response: string): ParsedRecipe {
    console.log('Parsing AI response:', response.substring(0, 200) + '...');

    let parsedData: unknown;
    const issues: string[] = [];
    let confidence = 1.0;

    // Attempt to parse JSON
    try {
      // Clean the response in case it has markdown formatting
      const cleanedResponse = this.cleanJsonResponse(response);
      console.log(
        'Cleaned response:',
        cleanedResponse.substring(0, 200) + '...',
      );
      parsedData = JSON.parse(cleanedResponse);
      console.log(
        'Parsed data structure:',
        Object.keys(parsedData as Record<string, unknown>),
      );
    } catch {
      console.log('Initial JSON parse failed, trying to extract from text');
      // Attempt to extract JSON from a text response
      const extractedJson = this.extractJsonFromText(response);
      if (extractedJson) {
        try {
          parsedData = JSON.parse(extractedJson);
          issues.push('Had to extract JSON from text response');
          confidence *= 0.9;
          console.log('Successfully extracted and parsed JSON from text');
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
          throw new Error('Failed to parse AI response as valid JSON');
        }
      } else {
        console.error('No JSON found in response');
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate against recipe schema
    let recipe: Recipe;
    try {
      console.log('Attempting to validate against recipe schema');
      recipe = RecipeSchema.parse(parsedData);
      console.log('Recipe validation successful');
    } catch (error) {
      console.log('Recipe validation failed, attempting repair:', error);
      if (error instanceof z.ZodError) {
        // Attempt to fix common validation issues
        recipe = this.attemptRecipeRepair(
          parsedData as Record<string, unknown>,
          error,
        );
        issues.push('Recipe required repairs during validation');
        confidence *= 0.8;
        console.log('Recipe repair completed');
      } else {
        console.error('Non-Zod validation error:', error);
        throw new Error('Recipe validation failed');
      }
    }

    // Normalize ingredients
    recipe.ingredients = recipe.ingredients.map(ingredient => {
      const normalized = this.normalizeIngredient(ingredient);
      if (normalized.confidence < 1.0) {
        issues.push(`Uncertain ingredient normalization: ${ingredient.name}`);
        confidence *= 0.95;
      }
      return {
        name: normalized.normalized,
        quantity: normalized.quantity,
        unit: normalized.unit,
      };
    });

    // Validate nutrition accuracy
    const nutritionAccuracy = this.validateNutritionAccuracy(recipe);
    if (nutritionAccuracy < 0.8) {
      issues.push('Nutrition values may be inaccurate');
      confidence *= 0.9;
    }

    console.log(
      'Final parsed recipe:',
      recipe.name,
      'with confidence:',
      confidence,
    );

    return {
      recipe,
      confidence,
      issues,
      nutritionAccuracy,
    };
  }

  /**
   * Clean JSON response from potential markdown formatting
   */
  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```(?:json)?\s*\n?/g, '');

    // Remove any leading/trailing text
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    return cleaned.trim();
  }

  /**
   * Extract JSON from text response using pattern matching
   */
  private extractJsonFromText(text: string): string | null {
    // Look for JSON object patterns
    const jsonPattern = /\{[\s\S]*\}/;
    const match = text.match(jsonPattern);

    if (match) {
      // Find the most complete JSON object
      let braceCount = 0;
      const startIndex = match.index!;
      let endIndex = startIndex;

      for (let i = startIndex; i < text.length; i++) {
        if (text[i] === '{') braceCount++;
        if (text[i] === '}') braceCount--;

        endIndex = i;
        if (braceCount === 0) break;
      }

      return text.substring(startIndex, endIndex + 1);
    }

    return null;
  }

  /**
   * Attempt to repair common recipe validation issues
   */
  private attemptRecipeRepair(
    data: Record<string, unknown>,
    error: z.ZodError,
  ): Recipe {
    console.log('Attempting to repair recipe data:', data);
    console.log('Validation errors:', error.issues);

    const _issues = error.issues;

    // Common repairs
    if (!data.name) {
      console.log('Adding default name');
      data.name = 'Untitled Recipe';
    }
    if (!data.description) {
      console.log('Adding default description');
      data.description = 'A delicious recipe';
    }
    if (!Array.isArray(data.ingredients)) {
      console.log('Setting default ingredients array');
      data.ingredients = [];
    }
    if (!Array.isArray(data.instructions)) {
      console.log('Setting default instructions array');
      data.instructions = [];
    }
    if (!data.nutrition) {
      console.log('Setting default nutrition object');
      data.nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    if (!data.prepTime) data.prepTime = 15;
    if (!data.cookTime) data.cookTime = 20;
    if (!data.servings) data.servings = 1;
    if (!data.difficulty) data.difficulty = 'medium';
    if (!data.mealType) data.mealType = 'dinner';

    // Fix ingredient format issues
    data.ingredients = (data.ingredients as Array<unknown>).map(
      (ingredient: unknown) => {
        if (typeof ingredient === 'string') {
          return this.parseIngredientString(ingredient);
        }
        const ingredientObj = ingredient as Record<string, unknown>;
        return {
          name: (ingredientObj.name as string) || 'Unknown ingredient',
          quantity: Number(ingredientObj.quantity) || 1,
          unit: (ingredientObj.unit as string) || 'unit',
        };
      },
    );

    // Fix nutrition format issues
    if (typeof data.nutrition === 'object' && data.nutrition !== null) {
      const nutritionObj = data.nutrition as Record<string, unknown>;
      data.nutrition = {
        calories: Number(nutritionObj.calories) || 0,
        protein: Number(nutritionObj.protein) || 0,
        carbs: Number(nutritionObj.carbs) || 0,
        fat: Number(nutritionObj.fat) || 0,
      };
    }

    console.log('Repaired recipe data:', data);

    // Validate the repaired data
    return RecipeSchema.parse(data);
  }

  /**
   * Parse ingredient from string format
   */
  private parseIngredientString(ingredientStr: string): {
    name: string;
    quantity: number;
    unit: string;
  } {
    // Common patterns: "2 cups flour", "1 tablespoon olive oil", "3 large eggs"
    const patterns = [
      /^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/, // "2 cups flour"
      /^(\d+(?:\.\d+)?)\s+(.+)$/, // "2 eggs"
      /^(.+)$/, // "salt to taste"
    ];

    for (const pattern of patterns) {
      const match = ingredientStr.match(pattern);
      if (match) {
        if (match.length === 4) {
          return {
            quantity: parseFloat(match[1]),
            unit: match[2],
            name: match[3],
          };
        } else if (match.length === 3) {
          return {
            quantity: parseFloat(match[1]),
            unit: 'unit',
            name: match[2],
          };
        } else {
          return {
            quantity: 1,
            unit: 'unit',
            name: match[1],
          };
        }
      }
    }

    return {
      quantity: 1,
      unit: 'unit',
      name: ingredientStr,
    };
  }

  /**
   * Normalize ingredient quantities and units
   */
  normalizeIngredient(ingredient: {
    name: string;
    quantity: number;
    unit: string;
  }): IngredientNormalization {
    const original = `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`;
    let normalized = ingredient.name;
    let quantity = ingredient.quantity;
    let unit = ingredient.unit.toLowerCase();
    const confidence = 1.0;

    // Normalize unit names
    const unitAliases: { [key: string]: string } = {
      tablespoons: 'tbsp',
      tablespoon: 'tbsp',
      teaspoons: 'tsp',
      teaspoon: 'tsp',
      cups: 'cup',
      ounces: 'oz',
      ounce: 'oz',
      pounds: 'lb',
      pound: 'lb',
    };

    if (unitAliases[unit]) {
      unit = unitAliases[unit];
    }

    // Handle fractional quantities in text
    const fractionMap: { [key: string]: number } = {
      half: 0.5,
      '1/2': 0.5,
      quarter: 0.25,
      '1/4': 0.25,
      third: 0.33,
      '1/3': 0.33,
      'two-thirds': 0.67,
      '2/3': 0.67,
      'three-quarters': 0.75,
      '3/4': 0.75,
    };

    const ingredientLower = normalized.toLowerCase();
    for (const [fraction, value] of Object.entries(fractionMap)) {
      if (ingredientLower.includes(fraction)) {
        quantity = value;
        normalized = normalized.replace(new RegExp(fraction, 'i'), '').trim();
        break;
      }
    }

    // Clean up ingredient name
    normalized = normalized
      .replace(/^(of\s+|the\s+)/i, '') // Remove "of" or "the" at beginning
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Check for common ingredient aliases
    const ingredientAliases: { [key: string]: string } = {
      'egg whites': 'egg white',
      'egg yolks': 'egg yolk',
      'spring onions': 'green onions',
      scallions: 'green onions',
    };

    for (const [alias, standard] of Object.entries(ingredientAliases)) {
      if (normalized.toLowerCase().includes(alias)) {
        normalized = normalized.toLowerCase().replace(alias, standard);
        break;
      }
    }

    return {
      original,
      normalized,
      quantity,
      unit,
      confidence,
    };
  }

  /**
   * Validate nutrition accuracy using basic nutritional estimations
   */
  private validateNutritionAccuracy(recipe: Recipe): number {
    // This is a simplified validation - in production, you'd integrate with nutrition APIs
    const nutrition = recipe.nutrition;
    let accuracy = 1.0;

    // Basic calorie validation (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
    const calculatedCalories =
      nutrition.protein * 4 + nutrition.carbs * 4 + nutrition.fat * 9;
    const calorieVariance =
      Math.abs(calculatedCalories - nutrition.calories) / nutrition.calories;

    if (calorieVariance > 0.2) {
      accuracy *= 0.7; // 20% variance reduces accuracy significantly
    } else if (calorieVariance > 0.1) {
      accuracy *= 0.9; // 10% variance is acceptable
    }

    // Check for realistic macro ranges
    const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
    if (totalMacros === 0) {
      accuracy = 0.1; // No macros provided
    }

    // Protein should typically be 10-35% of calories
    const proteinCaloriesPercent = (nutrition.protein * 4) / nutrition.calories;
    if (proteinCaloriesPercent < 0.05 || proteinCaloriesPercent > 0.5) {
      accuracy *= 0.8;
    }

    // Fat should typically be 20-35% of calories
    const fatCaloriesPercent = (nutrition.fat * 9) / nutrition.calories;
    if (fatCaloriesPercent < 0.1 || fatCaloriesPercent > 0.6) {
      accuracy *= 0.8;
    }

    // Check for unrealistic values
    if (nutrition.calories < 50 || nutrition.calories > 2000) {
      accuracy *= 0.6; // Very unusual calorie counts
    }

    return Math.max(0, accuracy);
  }

  /**
   * Extract ingredient preferences from recipe feedback
   */
  extractIngredientPreferences(
    recipes: Recipe[],
    feedback: Array<{ liked: boolean; recipeId: number }>,
  ): {
    preferred: string[];
    avoided: string[];
  } {
    const preferred: { [key: string]: number } = {};
    const avoided: { [key: string]: number } = {};

    recipes.forEach(recipe => {
      const recipeFeedback = feedback.find(f => f.recipeId === recipe.id);
      if (!recipeFeedback) return;

      recipe.ingredients.forEach(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();

        if (recipeFeedback.liked) {
          preferred[ingredientName] = (preferred[ingredientName] || 0) + 1;
        } else {
          avoided[ingredientName] = (avoided[ingredientName] || 0) + 1;
        }
      });
    });

    // Sort by frequency and take top ingredients
    const sortedPreferred = Object.entries(preferred)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ingredient]) => ingredient);

    const sortedAvoided = Object.entries(avoided)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ingredient]) => ingredient);

    return {
      preferred: sortedPreferred,
      avoided: sortedAvoided,
    };
  }

  /**
   * Calculate recipe complexity score
   */
  calculateComplexityScore(recipe: Recipe): {
    score: number;
    factors: string[];
  } {
    let score = 0;
    const factors: string[] = [];

    // Ingredient count factor
    if (recipe.ingredients.length > 15) {
      score += 2;
      factors.push('Many ingredients');
    } else if (recipe.ingredients.length > 10) {
      score += 1;
      factors.push('Several ingredients');
    }

    // Cooking time factor
    const totalTime = recipe.prepTime + recipe.cookTime;
    if (totalTime > 120) {
      score += 3;
      factors.push('Long cooking time');
    } else if (totalTime > 60) {
      score += 2;
      factors.push('Moderate cooking time');
    } else if (totalTime > 30) {
      score += 1;
      factors.push('Quick cooking time');
    }

    // Instruction complexity
    if (recipe.instructions.length > 10) {
      score += 2;
      factors.push('Many steps');
    } else if (recipe.instructions.length > 6) {
      score += 1;
      factors.push('Several steps');
    }

    // Check for complex techniques
    const complexTechniques = [
      'fold',
      'whisk',
      'sauté',
      'braise',
      'poach',
      'flambé',
      'julienne',
    ];
    const instructionText = recipe.instructions.join(' ').toLowerCase();
    const foundTechniques = complexTechniques.filter(technique =>
      instructionText.includes(technique),
    );

    if (foundTechniques.length > 0) {
      score += foundTechniques.length;
      factors.push(`Complex techniques: ${foundTechniques.join(', ')}`);
    }

    return {
      score: Math.min(score, 10), // Cap at 10
      factors,
    };
  }
}

// Export a default instance
export const recipeParser = new RecipeParserService();
