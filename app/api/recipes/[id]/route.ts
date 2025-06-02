import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { recipes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = parseInt(params.id);
    if (isNaN(recipeId)) {
      return Response.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    // Fetch the recipe that belongs to the user
    const recipe = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)))
      .limit(1);

    if (recipe.length === 0) {
      return Response.json(
        { error: 'Recipe not found or access denied' },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      recipe: recipe[0],
    });
  } catch (error) {
    console.error('Recipe fetch error:', error);
    return Response.json(
      { error: 'Failed to fetch recipe. Please try again.' },
      { status: 500 },
    );
  }
}
