import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { recipes } from '@/lib/db/schema';
import { and, asc, desc, eq, ilike } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const SavedRecipesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => Math.max(1, parseInt(val || '1'))),
  limit: z
    .string()
    .optional()
    .transform(val => Math.min(50, Math.max(1, parseInt(val || '10')))),
  search: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  sort: z.enum(['newest', 'oldest', 'name']).optional().default('newest'),
  isSaved: z
    .string()
    .optional()
    .transform(val => {
      if (val === undefined) return true; // default to true
      if (val === 'false') return false;
      return true;
    }),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit, search, mealType, difficulty, sort, isSaved } =
      SavedRecipesQuerySchema.parse(queryParams);

    // Build where conditions
    let whereConditions = and(
      eq(recipes.userId, user.id),
      eq(recipes.isSaved, isSaved),
    );

    if (search) {
      whereConditions = and(
        whereConditions,
        ilike(recipes.name, `%${search}%`),
      );
    }

    if (mealType) {
      whereConditions = and(whereConditions, eq(recipes.mealType, mealType));
    }

    if (difficulty) {
      whereConditions = and(
        whereConditions,
        eq(recipes.difficulty, difficulty),
      );
    }

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = asc(recipes.createdAt);
        break;
      case 'name':
        orderBy = asc(recipes.name);
        break;
      case 'newest':
      default:
        orderBy = desc(recipes.createdAt);
        break;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch recipes with pagination
    const savedRecipes = await db
      .select()
      .from(recipes)
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: recipes.id })
      .from(recipes)
      .where(whereConditions);

    const totalCount = totalCountResult.length;
    const totalPages = Math.ceil(totalCount / limit);

    return Response.json({
      success: true,
      data: {
        recipes: savedRecipes,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Saved recipes fetch error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Invalid query parameters', details: error.message },
        { status: 400 },
      );
    }

    return Response.json(
      { error: 'Failed to fetch saved recipes. Please try again.' },
      { status: 500 },
    );
  }
}
