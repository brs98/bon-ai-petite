import { recipeGenerator } from '@/lib/ai/recipe-generator';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { recipes } from '@/lib/db/schema';
import { RecipeGenerationRequestSchema } from '@/types/recipe';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = RecipeGenerationRequestSchema.parse(body);

    // Generate recipe using enhanced AI service
    const generationResult = await recipeGenerator.generateRecipe(
      { ...validatedRequest, learningEnabled: true },
      undefined, // userRecipes - could be fetched from DB
      undefined, // userFeedbacks - could be fetched from DB
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

    // Return the generated recipe with database ID and generation metadata
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
        processingTime: generationResult.generationMetadata.processingTime,
      },
    });
  } catch (error) {
    console.error('Recipe generation error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 },
      );
    }

    // Handle AI service errors
    if (
      error instanceof Error &&
      (error.message.includes('Recipe validation failed') ||
        error.message.includes('Failed to parse AI response') ||
        error.message.includes('No valid JSON found'))
    ) {
      return Response.json(
        { error: 'Failed to generate valid recipe. Please try again.' },
        { status: 500 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes('Invalid JSON response from AI service')
    ) {
      return Response.json(
        { error: 'AI service returned invalid response. Please try again.' },
        { status: 500 },
      );
    }

    // Handle recipe generation complete failure
    if (
      error instanceof Error &&
      error.message.includes('Recipe generation failed completely')
    ) {
      return Response.json(
        {
          error:
            'Recipe generation service is temporarily unavailable. Please try again.',
        },
        { status: 503 },
      );
    }

    // Generic error
    return Response.json(
      { error: 'Failed to generate recipe. Please try again.' },
      { status: 500 },
    );
  }
}
