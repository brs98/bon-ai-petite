import { PromptBuilderService } from '@/lib/ai/prompt-builder';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import {
  mealPlanItems,
  nutritionProfiles,
  recipes,
  weeklyMealPlans,
} from '@/lib/db/schema';
import {
  WeeklyMealPlanAISchema,
  type GeneratedRecipe,
  type MealPlanItem,
} from '@/types/recipe';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Request schema: optional mealIds (array of numbers), optional customPreferences per mealId
const BatchGenerateRequestSchema = z.object({
  mealIds: z.array(z.number()).optional(),
  customPreferences: z.record(z.any()).optional(), // { [mealId]: preferences }
});

// Add a type for preferences
type Preferences = {
  allergies?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  maxPrepTime?: number;
  maxCookTime?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
};

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = BatchGenerateRequestSchema.safeParse(body);
    if (!validatedRequest.success) {
      return Response.json({ error: 'Invalid request data' }, { status: 400 });
    }
    const { mealIds } = validatedRequest.data;

    // Await params before accessing properties
    const { id } = await params;
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Verify the meal plan belongs to the user
    const mealPlan = await db.query.weeklyMealPlans.findFirst({
      where: and(
        eq(weeklyMealPlans.id, planId),
        eq(weeklyMealPlans.userId, user.id),
      ),
    });
    if (!mealPlan) {
      return Response.json(
        { error: 'Meal plan not found or access denied' },
        { status: 404 },
      );
    }

    // Get all meal plan items for this plan
    let items = await db.query.mealPlanItems.findMany({
      where: eq(mealPlanItems.planId, planId),
    });
    // If mealIds provided, filter to those
    if (mealIds && mealIds.length > 0) {
      items = items.filter(item => mealIds.includes(item.id));
    }
    if (items.length === 0) {
      return Response.json(
        { error: 'No meals found to generate' },
        { status: 400 },
      );
    }

    // Count meals by type
    const mealCounts = {
      breakfasts: items.filter(i => i.category === 'breakfast').length,
      lunches: items.filter(i => i.category === 'lunch').length,
      dinners: items.filter(i => i.category === 'dinner').length,
      snacks: items.filter(i => i.category === 'snack').length,
    };

    // Get user's nutrition profile for enhanced generation
    const nutritionProfile = await db.query.nutritionProfiles.findFirst({
      where: eq(nutritionProfiles.userId, user.id),
    });

    // Merge preferences: global > custom > profile
    const globalPrefs = mealPlan.globalPreferences as Preferences | null;
    // For batch, just use globalPrefs + nutritionProfile (custom per-meal prefs not supported in batch)
    const userContext = {
      nutritionProfile: nutritionProfile || undefined,
      preferredIngredients: [], // Add logic if you support this
      avoidedIngredients: [], // Add logic if you support this
      recentFeedback: [], // Add logic if you support this
    };
    // Add global preferences to nutritionProfile if present
    if (nutritionProfile) {
      if (globalPrefs?.allergies)
        nutritionProfile.allergies = globalPrefs.allergies;
      if (globalPrefs?.dietaryRestrictions)
        nutritionProfile.dietaryRestrictions = globalPrefs.dietaryRestrictions;
      if (globalPrefs?.cuisinePreferences)
        nutritionProfile.cuisinePreferences = globalPrefs.cuisinePreferences;
      // Optionally add maxPrepTime, maxCookTime, difficultyLevel to nutritionProfile if used in prompt
    }
    // Build the batch prompt
    const promptBuilder = new PromptBuilderService();
    const prompt = promptBuilder.buildWeeklyMealPlanPrompt(
      mealCounts,
      userContext,
    );

    // === Batch OpenAI call ===
    let aiResponse;
    try {
      aiResponse = await generateObject({
        model: openai('gpt-4o'),
        schema: WeeklyMealPlanAISchema,
        schemaName: 'WeeklyMealPlanAIResponse',
        schemaDescription:
          'A full week meal plan with arrays of recipes for each meal type',
        system: prompt.system,
        prompt: prompt.user,
      });
    } catch (err) {
      return Response.json(
        {
          error: 'Failed to generate weekly meal plan from AI',
          details: String(err),
        },
        { status: 500 },
      );
    }

    if (!aiResponse || typeof aiResponse !== 'object' || !aiResponse.object) {
      return Response.json({ error: 'Invalid AI response' }, { status: 500 });
    }
    const batch = aiResponse.object;

    // Map mealPlanItems by type and day for assignment
    const itemsByType: Record<string, MealPlanItem[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const item of items) {
      itemsByType[item.category]?.push(item as MealPlanItem);
    }

    // Helper to assign recipes to items
    async function assignRecipesToItems(
      type: string,
      recipesArr: GeneratedRecipe[],
    ) {
      const planItems = itemsByType[type] || [];
      for (let i = 0; i < Math.min(planItems.length, recipesArr.length); i++) {
        const recipeData = recipesArr[i];
        // Save recipe
        const [savedRecipe] = await db
          .insert(recipes)
          .values({
            userId: user!.id,
            name: recipeData.name,
            description: recipeData.description,
            ingredients: recipeData.ingredients,
            instructions: recipeData.instructions,
            nutrition: recipeData.nutrition,
            prepTime: recipeData.prepTime,
            cookTime: recipeData.cookTime,
            servings: recipeData.servings,
            difficulty: recipeData.difficulty,
            cuisineType: recipeData.cuisineType || null,
            mealType: recipeData.mealType,
            tags: recipeData.tags || [],
            isSaved: false,
            rating: null,
          })
          .returning();
        // Link to mealPlanItem
        await db
          .update(mealPlanItems)
          .set({
            recipeId: savedRecipe.id,
            status: 'generated',
            updatedAt: new Date(),
          })
          .where(eq(mealPlanItems.id, planItems[i].id ?? 0));
      }
    }

    // Assign recipes for each meal type
    await assignRecipesToItems('breakfast', batch.breakfasts || []);
    await assignRecipesToItems('lunch', batch.lunches || []);
    await assignRecipesToItems('dinner', batch.dinners || []);
    await assignRecipesToItems('snack', batch.snacks || []);

    // Fetch the updated meal plan with items and recipes
    const updatedPlan = await db.query.weeklyMealPlans.findFirst({
      where: eq(weeklyMealPlans.id, planId),
      with: {
        mealPlanItems: {
          with: { recipe: true },
        },
      },
    });

    return Response.json({
      success: true,
      mealPlan: updatedPlan,
    });
  } catch (error) {
    console.error('Failed to batch generate meals:', error);
    return Response.json(
      { error: 'Failed to batch generate meals' },
      { status: 500 },
    );
  }
}
