import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { mealPlanItems, weeklyMealPlans } from '@/lib/db/schema';
import { LockMealRequestSchema } from '@/types/recipe';
import { and, eq } from 'drizzle-orm';
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
    const validatedRequest = LockMealRequestSchema.parse(body);

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
      with: {
        recipe: true,
      },
    });

    if (!mealItem) {
      return Response.json({ error: 'Meal item not found' }, { status: 404 });
    }

    // Check if meal has a generated recipe (required for locking)
    if (
      validatedRequest.locked &&
      (!mealItem.recipeId || mealItem.status !== 'generated')
    ) {
      return Response.json(
        { error: 'Cannot lock a meal without a generated recipe' },
        { status: 400 },
      );
    }

    // Update meal item lock status
    const newStatus = validatedRequest.locked ? 'locked' : 'generated';
    const lockedAt = validatedRequest.locked ? new Date() : null;

    await db
      .update(mealPlanItems)
      .set({
        status: newStatus,
        lockedAt,
        updatedAt: new Date(),
      })
      .where(eq(mealPlanItems.id, mealItemId));

    // Fetch the updated meal item for response
    const updatedMealItem = await db.query.mealPlanItems.findFirst({
      where: eq(mealPlanItems.id, mealItemId),
      with: {
        recipe: true,
      },
    });

    // Check if this completes a meal category (all meals in category are locked)
    const categoryMeals = await db.query.mealPlanItems.findMany({
      where: and(
        eq(mealPlanItems.planId, planId),
        eq(mealPlanItems.category, mealItem.category),
      ),
    });

    const categoryComplete = categoryMeals.every(
      meal => meal.status === 'locked',
    );

    // Check if entire meal plan is complete (all meals are locked)
    const allMeals = await db.query.mealPlanItems.findMany({
      where: eq(mealPlanItems.planId, planId),
    });

    const planComplete = allMeals.every(meal => meal.status === 'locked');

    // Update meal plan status if completed
    if (planComplete && mealPlan.status !== 'completed') {
      await db
        .update(weeklyMealPlans)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(weeklyMealPlans.id, planId));
    }

    return Response.json({
      success: true,
      mealItem: updatedMealItem,
      categoryComplete,
      planComplete,
      message: validatedRequest.locked
        ? 'Meal locked successfully'
        : 'Meal unlocked successfully',
    });
  } catch (error) {
    console.error('Failed to update meal lock status:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return Response.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 },
      );
    }

    return Response.json(
      { error: 'Failed to update meal lock status' },
      { status: 500 },
    );
  }
}
