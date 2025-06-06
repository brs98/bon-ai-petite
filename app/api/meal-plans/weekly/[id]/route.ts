import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { weeklyMealPlans } from '@/lib/db/schema';
import { type WeeklyMealPlanWithItems } from '@/types/recipe';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Fetch the meal plan with all related data
    const mealPlan = await db.query.weeklyMealPlans.findFirst({
      where: and(
        eq(weeklyMealPlans.id, planId),
        eq(weeklyMealPlans.userId, user.id),
      ),
      with: {
        mealPlanItems: {
          with: {
            recipe: true,
          },
          orderBy: (mealPlanItems, { asc }) => [
            asc(mealPlanItems.category),
            asc(mealPlanItems.dayNumber),
          ],
        },
        shoppingList: true,
      },
    });

    if (!mealPlan) {
      return Response.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Transform to match expected type
    const typedPlan = {
      ...mealPlan,
      mealPlanItems: mealPlan.mealPlanItems.map(item => ({
        ...item,
        recipe: item.recipe || undefined,
      })),
      shoppingList: mealPlan.shoppingList || undefined,
    } as WeeklyMealPlanWithItems;

    return Response.json(typedPlan);
  } catch (error) {
    console.error('Failed to fetch weekly meal plan:', error);
    return Response.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, status, globalPreferences } = body;

    // Verify the meal plan belongs to the user
    const existingPlan = await db.query.weeklyMealPlans.findFirst({
      where: and(
        eq(weeklyMealPlans.id, planId),
        eq(weeklyMealPlans.userId, user.id),
      ),
    });

    if (!existingPlan) {
      return Response.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Update the meal plan
    await db
      .update(weeklyMealPlans)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(globalPreferences !== undefined && { globalPreferences }),
        updatedAt: new Date(),
      })
      .where(eq(weeklyMealPlans.id, planId));

    // Fetch the complete updated plan
    const completePlan = await db.query.weeklyMealPlans.findFirst({
      where: eq(weeklyMealPlans.id, planId),
      with: {
        mealPlanItems: {
          with: {
            recipe: true,
          },
          orderBy: (mealPlanItems, { asc }) => [
            asc(mealPlanItems.category),
            asc(mealPlanItems.dayNumber),
          ],
        },
        shoppingList: true,
      },
    });

    if (!completePlan) {
      return Response.json(
        { error: 'Failed to fetch updated plan' },
        { status: 500 },
      );
    }

    // Transform to match expected type
    const typedPlan = {
      ...completePlan,
      mealPlanItems: completePlan.mealPlanItems.map(item => ({
        ...item,
        recipe: item.recipe || undefined,
      })),
      shoppingList: completePlan.shoppingList || undefined,
    } as WeeklyMealPlanWithItems;

    return Response.json(typedPlan);
  } catch (error) {
    console.error('Failed to update weekly meal plan:', error);
    return Response.json(
      { error: 'Failed to update meal plan' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Verify the meal plan belongs to the user
    const existingPlan = await db.query.weeklyMealPlans.findFirst({
      where: and(
        eq(weeklyMealPlans.id, planId),
        eq(weeklyMealPlans.userId, user.id),
      ),
    });

    if (!existingPlan) {
      return Response.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Delete the meal plan (this will cascade delete meal plan items due to foreign key constraints)
    await db.delete(weeklyMealPlans).where(eq(weeklyMealPlans.id, planId));

    return Response.json({
      success: true,
      message: 'Meal plan deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete weekly meal plan:', error);
    return Response.json(
      { error: 'Failed to delete meal plan' },
      { status: 500 },
    );
  }
}
