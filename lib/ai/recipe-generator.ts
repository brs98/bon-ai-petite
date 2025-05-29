import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Validation schemas
const RecipeSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    }),
  ),
  instructions: z.array(z.string()),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  prepTime: z.number(),
  cookTime: z.number(),
  servings: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export interface RecipeGenerationRequest {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergies?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  userProfile?: {
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: string;
    goals?: string;
  };
}

export class RecipeGeneratorService {
  private model = openai('gpt-4o');

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async generateRecipe(request: RecipeGenerationRequest): Promise<Recipe> {
    try {
      const prompt = this.buildPrompt(request);

      const { text } = await generateText({
        model: this.model,
        system:
          'You are a professional chef and nutritionist. Generate recipes that match exact nutritional requirements and return them in JSON format.',
        prompt,
      });

      // Parse the AI response and validate against our schema
      let parsedRecipe: unknown;
      try {
        parsedRecipe = JSON.parse(text) as unknown;
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI service');
      }

      return RecipeSchema.parse(parsedRecipe);
    } catch (error) {
      console.error('Recipe generation failed:', error);
      if (error instanceof z.ZodError) {
        throw new Error(
          'Recipe validation failed: AI response does not match expected format',
        );
      }
      throw new Error('Failed to generate recipe. Please try again.');
    }
  }

  private buildPrompt(request: RecipeGenerationRequest): string {
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

    // User context
    if (userProfile?.goals) {
      prompt += `- User goal: ${userProfile.goals}\n`;
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
}

Ensure the nutrition values match the targets as closely as possible. Use accessible ingredients and clear instructions.`;

    return prompt;
  }
}

// Export a default instance
export const recipeGenerator = new RecipeGeneratorService();
