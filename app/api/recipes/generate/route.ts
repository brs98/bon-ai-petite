import { recipeGenerator } from '@/lib/ai/recipe-generator';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { nutritionProfiles, recipes } from '@/lib/db/schema';
import {
  checkUsageLimit,
  incrementUsage,
} from '@/lib/subscriptions/usage-limits';
import { RecipeGenerationRequestSchema } from '@/types/recipe';
import { desc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Enforce per-user daily usage limit for recipe generation
    const withinLimit = await checkUsageLimit(user.id, 'recipe_generation');
    if (!withinLimit) {
      return Response.json(
        {
          error:
            'You have reached your daily recipe generation limit. Please try again tomorrow or upgrade your plan for unlimited access.',
        },
        { status: 429 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = RecipeGenerationRequestSchema.parse(body);

    // Extract variety configuration from request
    const varietyBoost = body.varietyBoost || false;
    const avoidSimilarRecipes = body.avoidSimilarRecipes !== false; // Default to true
    const sessionId = body.sessionId || user.id.toString(); // Use user ID as default session

    // Fetch user's recent recipes for variety tracking
    const userRecipesFromDb = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, user.id))
      .orderBy(desc(recipes.createdAt))
      .limit(20); // Get last 20 recipes for variety analysis

    // Transform database recipes to match the Recipe type format
    const userRecipes = userRecipesFromDb
      .filter(recipe => recipe.description) // Filter out recipes without descriptions
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
        mealType: recipe.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        tags: recipe.tags || [],
        isSaved: recipe.isSaved,
        rating: recipe.rating || undefined,
        createdAt: recipe.createdAt,
      }));

    // Fetch user's nutrition profile for dietary preferences and macro targets
    const userNutritionProfile = await db.query.nutritionProfiles.findFirst({
      where: eq(nutritionProfiles.userId, user.id),
    });

    // DEBUG: Log user nutrition profile and request data
    console.debug('[API] userNutritionProfile:', userNutritionProfile);
    console.debug('[API] validatedRequest:', validatedRequest);

    // Normalize allergies: if ['None'], treat as []
    const normalizedAllergies = (
      validatedRequest.allergies ||
      userNutritionProfile?.allergies ||
      []
    ).filter(a => a && a !== 'None');

    // Unpack customPreferences and spread into generationRequest
    const { customPreferences = {}, ...rest } =
      validatedRequest as typeof validatedRequest & {
        customPreferences?: Record<string, unknown>;
      };

    const allowedComplexities = ['simple', 'medium', 'hard'];
    let mealComplexity: 'simple' | 'medium' | 'hard' | undefined = undefined;
    if (
      typeof validatedRequest.mealComplexity === 'string' &&
      allowedComplexities.includes(validatedRequest.mealComplexity)
    ) {
      mealComplexity = validatedRequest.mealComplexity as
        | 'simple'
        | 'medium'
        | 'hard';
    } else if (
      typeof userNutritionProfile?.mealComplexity === 'string' &&
      allowedComplexities.includes(userNutritionProfile.mealComplexity)
    ) {
      mealComplexity = userNutritionProfile.mealComplexity as
        | 'simple'
        | 'medium'
        | 'hard';
    } else {
      mealComplexity = 'simple';
    }

    const generationRequest = {
      ...rest,
      ...customPreferences,
      learningEnabled: true,
      varietyBoost,
      avoidSimilarRecipes,
      sessionId,
      nutritionProfile: userNutritionProfile, // <-- Pass full profile for normalization
      dietaryRestrictions:
        validatedRequest.dietaryRestrictions ||
        userNutritionProfile?.dietaryRestrictions ||
        [],
      cuisinePreferences:
        validatedRequest.cuisinePreferences ||
        userNutritionProfile?.cuisinePreferences ||
        [],
      allergies: normalizedAllergies,
      protein:
        validatedRequest.protein ??
        userNutritionProfile?.macroProtein ??
        undefined,
      carbs:
        validatedRequest.carbs ?? userNutritionProfile?.macroCarbs ?? undefined,
      fat: validatedRequest.fat ?? userNutritionProfile?.macroFat ?? undefined,
      calories:
        validatedRequest.calories ??
        userNutritionProfile?.dailyCalories ??
        undefined, // <-- Explicitly add calories
      mealComplexity,
      userProfile: validatedRequest.userProfile || {
        age:
          typeof userNutritionProfile?.age === 'number'
            ? userNutritionProfile.age
            : undefined,
        weight:
          typeof userNutritionProfile?.weight === 'number'
            ? userNutritionProfile.weight
            : undefined,
        height:
          typeof userNutritionProfile?.height === 'number'
            ? userNutritionProfile.height
            : undefined,
        activityLevel: userNutritionProfile?.activityLevel || undefined,
        goals: Array.isArray(userNutritionProfile?.goals)
          ? userNutritionProfile.goals.join(', ')
          : userNutritionProfile?.goals || undefined,
      },
    };

    // DEBUG: Log final generationRequest
    console.debug('[API] generationRequest:', generationRequest);

    // Generate recipe using enhanced AI service with variety features
    const generationResult = await recipeGenerator.generateRecipe(
      generationRequest,
      userRecipes, // Pass user's recipe history
      undefined, // userFeedbacks - could be fetched from DB in the future
      undefined, // nutritionProfile - could be fetched from DB
    );

    const generatedRecipe = generationResult.recipe;

    // Comprehensive validation that we have a proper recipe before saving
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
      !generatedRecipe.nutrition ||
      !generatedRecipe.mealType
    ) {
      console.error('Generated recipe missing required fields:', {
        hasRecipe: !!generatedRecipe,
        hasName: !!generatedRecipe?.name,
        hasDescription: !!generatedRecipe?.description,
        hasIngredients: !!generatedRecipe?.ingredients,
        ingredientsIsArray: Array.isArray(generatedRecipe?.ingredients),
        ingredientsLength: generatedRecipe?.ingredients?.length,
        hasInstructions: !!generatedRecipe?.instructions,
        instructionsIsArray: Array.isArray(generatedRecipe?.instructions),
        instructionsLength: generatedRecipe?.instructions?.length,
        hasNutrition: !!generatedRecipe?.nutrition,
        hasMealType: !!generatedRecipe?.mealType,
        generationResult,
      });
      return Response.json(
        { error: 'Generated recipe is incomplete. Please try again.' },
        { status: 500 },
      );
    }

    console.log('Recipe validation passed, saving to database:', {
      name: generatedRecipe.name,
      description: generatedRecipe.description?.substring(0, 50) + '...',
      ingredientsCount: generatedRecipe.ingredients.length,
      instructionsCount: generatedRecipe.instructions.length,
      nutrition: generatedRecipe.nutrition,
      mealType: generatedRecipe.mealType,
      varietyScore: generationResult.varietyScore,
    });

    // Store recipe in database
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
        isSaved: false, // Initially not saved, user can save it later
        rating: null,
      })
      .returning();

    // Increment usage after successful generation and save
    await incrementUsage(user.id, 'recipe_generation');

    // Return the generated recipe with database ID and enhanced generation metadata
    return Response.json({
      success: true,
      recipe: {
        ...generatedRecipe,
        id: savedRecipe.id,
        userId: savedRecipe.userId,
        isSaved: savedRecipe.isSaved,
        createdAt: savedRecipe.createdAt,
      },
      metadata: {
        confidence: generationResult.confidence,
        issues: generationResult.issues,
        nutritionAccuracy: generationResult.nutritionAccuracy,
        varietyScore: generationResult.varietyScore,
        processingTime: generationResult.generationMetadata.processingTime,
        varietyInfo: {
          cuisineRotation:
            generationResult.generationMetadata.varietyConfig.cuisineRotation,
          complexityTarget:
            generationResult.generationMetadata.varietyConfig.complexityTarget,
        },
      },
    });
  } catch (error) {
    console.error('Recipe generation failed:', error);
    return Response.json(
      {
        error: 'Failed to generate recipe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
