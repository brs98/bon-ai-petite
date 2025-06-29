import { recipeGenerator } from '@/lib/ai/recipe-generator';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { recipes } from '@/lib/db/schema';
import { checkUsageLimit, incrementUsage } from '@/lib/subscriptions/usage-limits';
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
          error: 'You have reached your daily recipe generation limit. Please try again tomorrow or upgrade your plan for unlimited access.',
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

    // Generate recipe using enhanced AI service with variety features
    const generationResult = await recipeGenerator.generateRecipe(
      {
        ...validatedRequest,
        learningEnabled: true,
        varietyBoost,
        avoidSimilarRecipes,
        sessionId,
      },
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
      creativitySeed:
        generationResult.generationMetadata.varietyConfig.creativitySeed,
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
          creativitySeed:
            generationResult.generationMetadata.varietyConfig.creativitySeed,
          cuisineRotation:
            generationResult.generationMetadata.varietyConfig.cuisineRotation,
          cookingTechnique:
            generationResult.generationMetadata.varietyConfig
              .cookingTechniqueSuggestion,
          complexityTarget:
            generationResult.generationMetadata.varietyConfig.complexityTarget,
          culturalFusion:
            generationResult.generationMetadata.varietyConfig.culturalFusion,
          temperature:
            generationResult.generationMetadata.sessionInfo.temperature,
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
