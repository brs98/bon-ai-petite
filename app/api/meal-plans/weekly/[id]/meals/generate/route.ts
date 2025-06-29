import { recipeGenerator } from '@/lib/ai/recipe-generator';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import {
    mealPlanItems,
    nutritionProfiles,
    recipes,
    weeklyMealPlans,
} from '@/lib/db/schema';
import { checkUsageLimit, incrementUsage } from '@/lib/subscriptions/usage-limits';
import { and, desc, eq } from 'drizzle-orm';
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
    const { mealIds, customPreferences } = validatedRequest.data;

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
      return Response.json({ error: 'No meals found to generate' }, { status: 400 });
    }

    // Get user's nutrition profile for enhanced generation
    const nutritionProfile = await db.query.nutritionProfiles.findFirst({
      where: eq(nutritionProfiles.userId, user.id),
    });

    // Get user's recent recipes for variety
    const userRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, user.id))
      .orderBy(desc(recipes.createdAt))
      .limit(20);
    const transformedRecipes = userRecipes
      .filter(recipe => recipe.description)
      .map(recipe => ({
        id: recipe.id,
        userId: recipe.userId,
        name: recipe.name,
        description: recipe.description!,
        ingredients: recipe.ingredients as Array<{
          name: string;
          quantity: number;
          unit: string;
        }>,
        instructions: recipe.instructions,
        nutrition: recipe.nutrition as {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        },
        prepTime: recipe.prepTime || 0,
        cookTime: recipe.cookTime || 0,
        servings: recipe.servings || 1,
        difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
        cuisineType: recipe.cuisineType || undefined,
        mealType: recipe.mealType as
          | 'breakfast'
          | 'lunch'
          | 'dinner'
          | 'snack',
        tags: recipe.tags || [],
        isSaved: recipe.isSaved,
        rating: recipe.rating || undefined,
        createdAt: recipe.createdAt,
      }));

    // For each meal, generate a recipe, enforcing usage limits per meal
    const results = [];
    for (const mealItem of items) {
      // Check usage limit before each generation
      const withinLimit = await checkUsageLimit(user.id, 'recipe_generation');
      if (!withinLimit) {
        // If over limit, stop further generations and return partial results
        return Response.json(
          {
            error: 'You have reached your daily recipe generation limit. Please try again tomorrow or upgrade your plan for unlimited access.',
            partialResults: results,
          },
          { status: 429 },
        );
      }

      // Update meal item status to generating
      await db
        .update(mealPlanItems)
        .set({
          status: 'generating',
          updatedAt: new Date(),
        })
        .where(eq(mealPlanItems.id, mealItem.id));

      // Merge preferences: request > stored custom > global
      const globalPrefs = mealPlan.globalPreferences as Preferences | null;
      const storedCustomPrefs = mealItem.customPreferences as Preferences | null;
      const requestCustomPrefs = customPreferences?.[mealItem.id];
      const mergedPreferences = {
        allergies:
          requestCustomPrefs?.allergies ||
          storedCustomPrefs?.allergies ||
          globalPrefs?.allergies ||
          [],
        dietaryRestrictions:
          requestCustomPrefs?.dietaryRestrictions ||
          storedCustomPrefs?.dietaryRestrictions ||
          globalPrefs?.dietaryRestrictions ||
          [],
        cuisinePreferences:
          requestCustomPrefs?.cuisinePreferences ||
          storedCustomPrefs?.cuisinePreferences ||
          globalPrefs?.cuisinePreferences ||
          [],
        ...(nutritionProfile && {
          userProfile: {
            age: nutritionProfile.age || undefined,
            weight: nutritionProfile.weight || undefined,
            height: nutritionProfile.height || undefined,
            activityLevel: nutritionProfile.activityLevel || undefined,
            goals: nutritionProfile.goals || undefined,
          },
          calories: nutritionProfile.dailyCalories
            ? Math.round(nutritionProfile.dailyCalories / 3)
            : undefined,
          protein: nutritionProfile.macroProtein
            ? Math.round(nutritionProfile.macroProtein / 3)
            : undefined,
          carbs: nutritionProfile.macroCarbs
            ? Math.round(nutritionProfile.macroCarbs / 3)
            : undefined,
          fat: nutritionProfile.macroFat
            ? Math.round(nutritionProfile.macroFat / 3)
            : undefined,
        }),
      };

      // Generate recipe using the existing AI service
      try {
        const generationResult = await recipeGenerator.generateRecipe(
          {
            mealType: mealItem.category as
              | 'breakfast'
              | 'lunch'
              | 'dinner'
              | 'snack',
            ...mergedPreferences,
            learningEnabled: true,
            varietyBoost: true,
            avoidSimilarRecipes: true,
            sessionId: `meal-plan-${planId}`,
          },
          transformedRecipes,
          undefined,
          nutritionProfile || undefined,
        );

        // Increment usage after successful generation
        await incrementUsage(user.id, 'recipe_generation');

        const generatedRecipe = generationResult.recipe;
        if (
          !generatedRecipe ||
          !generatedRecipe.name ||
          !generatedRecipe.description ||
          !generatedRecipe.ingredients ||
          !generatedRecipe.instructions ||
          !Array.isArray(generatedRecipe.ingredients) ||
          !Array.isArray(generatedRecipe.instructions) ||
          generatedRecipe.ingredients.length === 0 ||
          generatedRecipe.instructions.length === 0 ||
          !generatedRecipe.nutrition
        ) {
          // Reset meal item status on failure
          await db
            .update(mealPlanItems)
            .set({
              status: 'pending',
              updatedAt: new Date(),
            })
            .where(eq(mealPlanItems.id, mealItem.id));
          results.push({ mealId: mealItem.id, error: 'Generated recipe is incomplete.' });
          continue;
        }
        // Save the generated recipe
        const [savedRecipe] = await db
          .insert(recipes)
          .values({
            userId: user.id,
            name: generatedRecipe.name,
            description: generatedRecipe.description,
            ingredients: generatedRecipe.ingredients,
            instructions: generatedRecipe.instructions,
            nutrition: generatedRecipe.nutrition,
            prepTime: generatedRecipe.prepTime,
            cookTime: generatedRecipe.cookTime,
            servings: generatedRecipe.servings,
            difficulty: generatedRecipe.difficulty,
            cuisineType: generatedRecipe.cuisineType || null,
            mealType: generatedRecipe.mealType,
            tags: generatedRecipe.tags || [],
            isSaved: false,
            rating: null,
          })
          .returning();
        // Update meal plan item
        await db
          .update(mealPlanItems)
          .set({
            recipeId: savedRecipe.id,
            status: 'generated',
            customPreferences: requestCustomPrefs || null,
            updatedAt: new Date(),
          })
          .where(eq(mealPlanItems.id, mealItem.id));
        results.push({ mealId: mealItem.id, recipe: generationResult.recipe });
      } catch (generationError) {
        // Reset meal item status on error
        await db
          .update(mealPlanItems)
          .set({
            status: 'pending',
            updatedAt: new Date(),
          })
          .where(eq(mealPlanItems.id, mealItem.id));
        results.push({ mealId: mealItem.id, error: 'Failed to generate recipe.' });
      }
    }

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
      results,
      mealPlan: updatedPlan,
    });
  } catch (error) {
    console.error('Failed to batch generate meals:', error);
    return Response.json({ error: 'Failed to batch generate meals' }, { status: 500 });
  }
} 