import { recipeGenerator } from '@/lib/ai/recipe-generator';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import {
  mealPlanItems,
  nutritionProfiles,
  recipes,
  weeklyMealPlans,
} from '@/lib/db/schema';
import { GenerateMealRequestSchema } from '@/types/recipe';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
    mealId: string;
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
    const validatedRequest = GenerateMealRequestSchema.parse(body);

    // Await params before accessing properties
    const { id, mealId } = await params;
    const planId = parseInt(id);
    const mealItemId = parseInt(mealId);

    if (isNaN(planId) || isNaN(mealItemId)) {
      return Response.json(
        { error: 'Invalid plan ID or meal ID' },
        { status: 400 },
      );
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

    // Find the specific meal plan item
    const mealItem = await db.query.mealPlanItems.findFirst({
      where: and(
        eq(mealPlanItems.id, mealItemId),
        eq(mealPlanItems.planId, planId),
      ),
    });

    if (!mealItem) {
      return Response.json({ error: 'Meal item not found' }, { status: 404 });
    }

    // Update meal item status to generating
    await db
      .update(mealPlanItems)
      .set({
        status: 'generating',
        updatedAt: new Date(),
      })
      .where(eq(mealPlanItems.id, mealItemId));

    try {
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

      // Transform database recipes to match the Recipe type format
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

      // Merge preferences in priority order: request > stored custom > global
      const globalPrefs = mealPlan.globalPreferences as {
        allergies?: string[];
        dietaryRestrictions?: string[];
        cuisinePreferences?: string[];
        maxPrepTime?: number;
        maxCookTime?: number;
        difficultyLevel?: 'easy' | 'medium' | 'hard';
      } | null;

      const storedCustomPrefs = mealItem.customPreferences as {
        allergies?: string[];
        dietaryRestrictions?: string[];
        cuisinePreferences?: string[];
        maxPrepTime?: number;
        maxCookTime?: number;
        difficultyLevel?: 'easy' | 'medium' | 'hard';
      } | null;

      // Use request preferences with highest priority
      const requestCustomPrefs = validatedRequest.customPreferences;

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
        // Add nutrition profile data if available
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
            : undefined, // Rough estimate for single meal
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
        undefined, // user feedbacks
        nutritionProfile || undefined,
      );

      const generatedRecipe = generationResult.recipe;

      // Validate the generated recipe
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
          .where(eq(mealPlanItems.id, mealItemId));

        return Response.json(
          { error: 'Generated recipe is incomplete. Please try again.' },
          { status: 500 },
        );
      }

      // Save the generated recipe to the database
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

      // Update meal plan item with the generated recipe and status
      await db
        .update(mealPlanItems)
        .set({
          recipeId: savedRecipe.id,
          status: 'generated',
          customPreferences: validatedRequest.customPreferences || null,
          updatedAt: new Date(),
        })
        .where(eq(mealPlanItems.id, mealItemId));

      // Fetch the updated meal item with recipe for response
      const updatedMealItem = await db.query.mealPlanItems.findFirst({
        where: eq(mealPlanItems.id, mealItemId),
        with: {
          recipe: true,
        },
      });

      return Response.json({
        success: true,
        mealItem: updatedMealItem,
        generationMetadata: {
          confidence: generationResult.confidence,
          varietyScore: generationResult.varietyScore,
          nutritionAccuracy: generationResult.nutritionAccuracy,
        },
      });
    } catch (generationError) {
      // Reset meal item status on error
      await db
        .update(mealPlanItems)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(mealPlanItems.id, mealItemId));

      console.error('Recipe generation failed:', generationError);
      return Response.json(
        { error: 'Failed to generate recipe. Please try again.' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Failed to generate meal:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 },
      );
    }

    return Response.json({ error: 'Failed to generate meal' }, { status: 500 });
  }
}
