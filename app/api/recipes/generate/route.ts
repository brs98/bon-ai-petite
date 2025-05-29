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

    // Generate recipe using AI service
    const generatedRecipe =
      await recipeGenerator.generateRecipe(validatedRequest);

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

    // Return the generated recipe with database ID
    return Response.json({
      success: true,
      recipe: {
        ...generatedRecipe,
        id: savedRecipe.id,
        userId: savedRecipe.userId,
        isSaved: savedRecipe.isSaved,
        createdAt: savedRecipe.createdAt,
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
      error.message.includes('Recipe validation failed')
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

    // Generic error
    return Response.json(
      { error: 'Failed to generate recipe. Please try again.' },
      { status: 500 },
    );
  }
}
