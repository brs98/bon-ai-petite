import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { recipeFeedback, recipes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const RecipeFeedbackRequestSchema = z.object({
  recipeId: z.number().positive(),
  liked: z.boolean(),
  feedback: z.string().optional(),
  reportedIssues: z.array(z.string()).optional(),
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
    const validatedFeedback = RecipeFeedbackRequestSchema.parse(body);

    // Verify the recipe exists and belongs to the user
    const recipe = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, validatedFeedback.recipeId),
          eq(recipes.userId, user.id),
        ),
      )
      .limit(1);

    if (recipe.length === 0) {
      return Response.json(
        { error: 'Recipe not found or access denied' },
        { status: 404 },
      );
    }

    // Check if feedback already exists for this recipe by this user
    const existingFeedback = await db
      .select()
      .from(recipeFeedback)
      .where(
        and(
          eq(recipeFeedback.recipeId, validatedFeedback.recipeId),
          eq(recipeFeedback.userId, user.id),
        ),
      )
      .limit(1);

    let savedFeedback;

    if (existingFeedback.length > 0) {
      // Update existing feedback
      [savedFeedback] = await db
        .update(recipeFeedback)
        .set({
          liked: validatedFeedback.liked,
          feedback: validatedFeedback.feedback || null,
          reportedIssues: validatedFeedback.reportedIssues || [],
        })
        .where(eq(recipeFeedback.id, existingFeedback[0].id))
        .returning();
    } else {
      // Create new feedback
      [savedFeedback] = await db
        .insert(recipeFeedback)
        .values({
          recipeId: validatedFeedback.recipeId,
          userId: user.id,
          liked: validatedFeedback.liked,
          feedback: validatedFeedback.feedback || null,
          reportedIssues: validatedFeedback.reportedIssues || [],
        })
        .returning();
    }

    return Response.json({
      success: true,
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error('Recipe feedback error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 },
      );
    }

    // Generic error
    return Response.json(
      { error: 'Failed to save feedback. Please try again.' },
      { status: 500 },
    );
  }
}
