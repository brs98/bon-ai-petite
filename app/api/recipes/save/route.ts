import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { recipes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const SaveRecipeRequestSchema = z.object({
  recipeId: z.number().positive(),
  isSaved: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { recipeId, isSaved } = SaveRecipeRequestSchema.parse(body);

    // Verify the recipe belongs to the user and update saved status
    const [updatedRecipe] = await db
      .update(recipes)
      .set({
        isSaved,
      })
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)))
      .returning();

    if (!updatedRecipe) {
      return Response.json(
        { error: 'Recipe not found or access denied' },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      recipe: updatedRecipe,
    });
  } catch (error) {
    console.error('Recipe save error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 },
      );
    }

    // Generic error
    return Response.json(
      { error: 'Failed to save recipe. Please try again.' },
      { status: 500 },
    );
  }
}
