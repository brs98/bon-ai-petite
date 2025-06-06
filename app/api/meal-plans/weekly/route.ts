import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import {
  mealPlanItems,
  weeklyMealPlans,
  type NewMealPlanItem,
} from '@/lib/db/schema';
import {
  CreateWeeklyMealPlanRequestSchema,
  type WeeklyMealPlanWithItems,
} from '@/types/recipe';
import { and, desc, eq } from 'drizzle-orm';
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
    const validatedRequest = CreateWeeklyMealPlanRequestSchema.parse(body);

    // Calculate total meals
    const totalMeals =
      validatedRequest.breakfastCount +
      validatedRequest.lunchCount +
      validatedRequest.dinnerCount +
      validatedRequest.snackCount;

    // TODO: Check subscription limits for Premium feature
    // This would be implemented in Phase 3
    // const hasAccess = await checkWeeklyMealPlanAccess(user.id);
    // if (!hasAccess) {
    //   return Response.json(
    //     { error: 'Weekly meal planning requires Premium subscription' },
    //     { status: 403 }
    //   );
    // }

    // Create weekly meal plan
    const [createdPlan] = await db
      .insert(weeklyMealPlans)
      .values({
        userId: user.id,
        name: validatedRequest.name,
        description: validatedRequest.description || null,
        startDate: validatedRequest.startDate,
        endDate: validatedRequest.endDate,
        breakfastCount: validatedRequest.breakfastCount,
        lunchCount: validatedRequest.lunchCount,
        dinnerCount: validatedRequest.dinnerCount,
        snackCount: validatedRequest.snackCount,
        totalMeals,
        status: 'in_progress',
        globalPreferences: validatedRequest.globalPreferences || null,
      })
      .returning();

    // Create meal plan items for each meal category and day
    const mealPlanItemsToCreate: NewMealPlanItem[] = [];

    // Helper function to create items for a specific category
    const createItemsForCategory = (
      category: 'breakfast' | 'lunch' | 'dinner' | 'snack',
      count: number,
    ) => {
      // Distribute meals across days (Day 1-7)
      for (let i = 0; i < count; i++) {
        const dayNumber = (i % 7) + 1; // Cycle through days 1-7
        mealPlanItemsToCreate.push({
          planId: createdPlan.id,
          category,
          dayNumber,
          status: 'pending',
          customPreferences: null,
        });
      }
    };

    // Create items based on meal counts
    if (validatedRequest.breakfastCount > 0) {
      createItemsForCategory('breakfast', validatedRequest.breakfastCount);
    }
    if (validatedRequest.lunchCount > 0) {
      createItemsForCategory('lunch', validatedRequest.lunchCount);
    }
    if (validatedRequest.dinnerCount > 0) {
      createItemsForCategory('dinner', validatedRequest.dinnerCount);
    }
    if (validatedRequest.snackCount > 0) {
      createItemsForCategory('snack', validatedRequest.snackCount);
    }

    // Insert meal plan items if any were created
    if (mealPlanItemsToCreate.length > 0) {
      await db.insert(mealPlanItems).values(mealPlanItemsToCreate);
    }

    // Fetch the complete plan with items for response
    const completeplan = await db.query.weeklyMealPlans.findFirst({
      where: eq(weeklyMealPlans.id, createdPlan.id),
      with: {
        mealPlanItems: {
          with: {
            recipe: true,
          },
        },
      },
    });

    return Response.json({
      success: true,
      mealPlan: completeplan,
    });
  } catch (error) {
    console.error('Failed to create weekly meal plan:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 },
      );
    }

    return Response.json(
      { error: 'Failed to create weekly meal plan' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') as
      | 'in_progress'
      | 'completed'
      | 'archived'
      | null;

    // Fetch user's weekly meal plans
    const whereConditions = status
      ? and(
          eq(weeklyMealPlans.userId, user.id),
          eq(weeklyMealPlans.status, status),
        )
      : eq(weeklyMealPlans.userId, user.id);

    const plans = await db.query.weeklyMealPlans.findMany({
      where: whereConditions,
      with: {
        mealPlanItems: {
          with: {
            recipe: true,
          },
        },
        shoppingList: true,
      },
      orderBy: [desc(weeklyMealPlans.createdAt)],
      limit: Math.min(limit, 50), // Cap at 50 for performance
      offset,
    });

    // Transform to match expected type with proper type assertion
    const typedPlans = plans.map(plan => ({
      ...plan,
      mealPlanItems: plan.mealPlanItems.map(item => ({
        ...item,
        recipe: item.recipe || undefined,
      })),
      shoppingList: plan.shoppingList || undefined,
    })) as WeeklyMealPlanWithItems[];

    return Response.json({
      success: true,
      mealPlans: typedPlans,
      pagination: {
        limit,
        offset,
        total: typedPlans.length, // This would be a separate count query in production
      },
    });
  } catch (error) {
    console.error('Failed to fetch weekly meal plans:', error);
    return Response.json(
      { error: 'Failed to fetch weekly meal plans' },
      { status: 500 },
    );
  }
}
