import { db } from '@/lib/db/drizzle';
import {
  mealPlanItems,
  weeklyMealPlans,
  type NewMealPlanItem,
  type WeeklyMealPlan,
  type WeeklyMealPlanWithItems,
} from '@/lib/db/schema';
import { type CreateWeeklyMealPlanRequest } from '@/types/recipe';
import { and, desc, eq, sql } from 'drizzle-orm';

/**
 * Type for database update result
 */
type UpdateResult = {
  changes?: number;
  meta?: {
    changes: number;
  };
};

/**
 * Service for managing weekly meal plans including creation, validation,
 * completion tracking, and category processing logic
 */
export class WeeklyMealPlannerService {
  /**
   * Create a new weekly meal plan with associated meal plan items
   */
  async createWeeklyMealPlan(
    userId: number,
    request: CreateWeeklyMealPlanRequest,
  ): Promise<WeeklyMealPlanWithItems> {
    try {
      // Calculate total meals
      const totalMeals =
        request.breakfastCount +
        request.lunchCount +
        request.dinnerCount +
        request.snackCount;

      if (totalMeals === 0) {
        throw new Error('At least one meal must be selected');
      }

      if (totalMeals > 28) {
        throw new Error(
          'Maximum 28 meals allowed per plan (7 days × 4 meal types)',
        );
      }

      // Validate date range
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Create the meal plan in a transaction
      const result = await db.transaction(async tx => {
        // Create weekly meal plan
        const [createdPlan] = await tx
          .insert(weeklyMealPlans)
          .values({
            userId,
            name: request.name,
            description: request.description || null,
            startDate: request.startDate,
            endDate: request.endDate,
            breakfastCount: request.breakfastCount,
            lunchCount: request.lunchCount,
            dinnerCount: request.dinnerCount,
            snackCount: request.snackCount,
            totalMeals,
            status: 'in_progress',
            globalPreferences: request.globalPreferences || null,
          })
          .returning();

        // Create meal plan items based on meal counts
        const mealPlanItemsToCreate = this.generateMealPlanItems(
          createdPlan.id,
          request,
        );

        if (mealPlanItemsToCreate.length > 0) {
          await tx.insert(mealPlanItems).values(mealPlanItemsToCreate);
        }

        // Fetch complete plan with items
        const completePlan = await tx.query.weeklyMealPlans.findFirst({
          where: eq(weeklyMealPlans.id, createdPlan.id),
          with: {
            mealPlanItems: {
              with: {
                recipe: true,
              },
            },
            shoppingList: true,
          },
        });

        if (!completePlan) {
          throw new Error('Failed to create meal plan');
        }

        return this.transformToWeeklyMealPlanWithItems(completePlan);
      });

      return result;
    } catch (error) {
      console.error('Error creating weekly meal plan:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to create weekly meal plan');
    }
  }

  /**
   * Get user's weekly meal plans with filtering and pagination
   */
  async getUserMealPlans(
    userId: number,
    options: {
      status?: 'in_progress' | 'completed' | 'archived';
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{
    mealPlans: WeeklyMealPlanWithItems[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    try {
      const { status, limit = 10, offset = 0 } = options;
      const maxLimit = Math.min(limit, 50); // Cap at 50 for performance

      // Build where conditions
      const whereConditions = status
        ? and(
            eq(weeklyMealPlans.userId, userId),
            eq(weeklyMealPlans.status, status),
          )
        : eq(weeklyMealPlans.userId, userId);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(weeklyMealPlans)
        .where(whereConditions);

      // Fetch meal plans with items
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
        limit: maxLimit,
        offset,
      });

      const transformedPlans = plans.map(plan =>
        this.transformToWeeklyMealPlanWithItems(plan),
      );

      return {
        mealPlans: transformedPlans,
        pagination: {
          limit: maxLimit,
          offset,
          total: count,
        },
      };
    } catch (error) {
      console.error('Error fetching user meal plans:', error);
      throw new Error('Failed to fetch meal plans');
    }
  }

  /**
   * Get a specific meal plan by ID with access control
   */
  async getMealPlanById(
    planId: number,
    userId: number,
  ): Promise<WeeklyMealPlanWithItems | null> {
    try {
      const plan = await db.query.weeklyMealPlans.findFirst({
        where: and(
          eq(weeklyMealPlans.id, planId),
          eq(weeklyMealPlans.userId, userId),
        ),
        with: {
          mealPlanItems: {
            with: {
              recipe: true,
            },
          },
          shoppingList: true,
        },
      });

      return plan ? this.transformToWeeklyMealPlanWithItems(plan) : null;
    } catch (error) {
      console.error('Error fetching meal plan by ID:', error);
      throw new Error('Failed to fetch meal plan');
    }
  }

  /**
   * Update meal plan status
   */
  async updateMealPlanStatus(
    planId: number,
    userId: number,
    status: 'in_progress' | 'completed' | 'archived',
  ): Promise<WeeklyMealPlan> {
    try {
      // Verify ownership
      const existingPlan = await db.query.weeklyMealPlans.findFirst({
        where: and(
          eq(weeklyMealPlans.id, planId),
          eq(weeklyMealPlans.userId, userId),
        ),
      });

      if (!existingPlan) {
        throw new Error('Meal plan not found or access denied');
      }

      const [updatedPlan] = await db
        .update(weeklyMealPlans)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(weeklyMealPlans.id, planId))
        .returning();

      return updatedPlan;
    } catch (error) {
      console.error('Error updating meal plan status:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to update meal plan status');
    }
  }

  /**
   * Check meal category completion (all meals in category are locked)
   */
  async checkCategoryCompletion(
    planId: number,
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): Promise<{
    isComplete: boolean;
    totalMeals: number;
    lockedMeals: number;
  }> {
    try {
      const categoryMeals = await db.query.mealPlanItems.findMany({
        where: and(
          eq(mealPlanItems.planId, planId),
          eq(mealPlanItems.category, category),
        ),
      });

      const lockedMeals = categoryMeals.filter(
        meal => meal.status === 'locked',
      );

      return {
        isComplete:
          categoryMeals.length > 0 &&
          lockedMeals.length === categoryMeals.length,
        totalMeals: categoryMeals.length,
        lockedMeals: lockedMeals.length,
      };
    } catch (error) {
      console.error('Error checking category completion:', error);
      throw new Error('Failed to check category completion');
    }
  }

  /**
   * Check overall meal plan completion
   */
  async checkPlanCompletion(planId: number): Promise<{
    isComplete: boolean;
    totalMeals: number;
    lockedMeals: number;
    completionByCategory: Record<
      string,
      { isComplete: boolean; totalMeals: number; lockedMeals: number }
    >;
  }> {
    try {
      const allMeals = await db.query.mealPlanItems.findMany({
        where: eq(mealPlanItems.planId, planId),
      });

      const lockedMeals = allMeals.filter(meal => meal.status === 'locked');

      // Check completion by category
      const categories = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
      const completionByCategory: Record<
        string,
        { isComplete: boolean; totalMeals: number; lockedMeals: number }
      > = {};

      for (const category of categories) {
        const categoryCompletion = await this.checkCategoryCompletion(
          planId,
          category,
        );
        completionByCategory[category] = categoryCompletion;
      }

      return {
        isComplete:
          allMeals.length > 0 && lockedMeals.length === allMeals.length,
        totalMeals: allMeals.length,
        lockedMeals: lockedMeals.length,
        completionByCategory,
      };
    } catch (error) {
      console.error('Error checking plan completion:', error);
      throw new Error('Failed to check plan completion');
    }
  }

  /**
   * Get next meal category to process based on completion status
   */
  async getNextCategoryToProcess(planId: number): Promise<{
    nextCategory: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
    processingOrder: Array<{
      category: string;
      isComplete: boolean;
      totalMeals: number;
    }>;
  }> {
    try {
      const completion = await this.checkPlanCompletion(planId);

      // Define processing order: breakfast → lunch → dinner → snacks
      const processingOrder = [
        {
          category: 'breakfast',
          ...completion.completionByCategory.breakfast,
        },
        {
          category: 'lunch',
          ...completion.completionByCategory.lunch,
        },
        {
          category: 'dinner',
          ...completion.completionByCategory.dinner,
        },
        {
          category: 'snack',
          ...completion.completionByCategory.snack,
        },
      ].filter(cat => cat.totalMeals > 0); // Only include categories with meals

      // Find first incomplete category
      const nextCategory = processingOrder.find(cat => !cat.isComplete);

      return {
        nextCategory: nextCategory
          ? (nextCategory.category as
              | 'breakfast'
              | 'lunch'
              | 'dinner'
              | 'snack')
          : null,
        processingOrder,
      };
    } catch (error) {
      console.error('Error getting next category to process:', error);
      throw new Error('Failed to get next category to process');
    }
  }

  /**
   * Archive old completed meal plans for cleanup
   */
  async archiveOldMealPlans(userId: number, daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db
        .update(weeklyMealPlans)
        .set({
          status: 'archived',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(weeklyMealPlans.userId, userId),
            eq(weeklyMealPlans.status, 'completed'),
            sql`${weeklyMealPlans.createdAt} < ${cutoffDate.toISOString()}`,
          ),
        );

      // Return count of affected rows - handling different return types
      if (Array.isArray(result)) {
        return result.length;
      }

      // Try to extract changes count from result object
      const updateResult = result as UpdateResult;
      return updateResult.changes || updateResult.meta?.changes || 0;
    } catch (error) {
      console.error('Error archiving old meal plans:', error);
      throw new Error('Failed to archive old meal plans');
    }
  }

  /**
   * Validate meal plan requirements and constraints
   */
  validateMealPlanRequest(request: CreateWeeklyMealPlanRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check meal counts
    const totalMeals =
      request.breakfastCount +
      request.lunchCount +
      request.dinnerCount +
      request.snackCount;

    if (totalMeals === 0) {
      errors.push('At least one meal must be selected');
    }

    if (totalMeals > 28) {
      errors.push('Maximum 28 meals allowed per plan');
    }

    // Check individual meal counts
    if (request.breakfastCount < 0 || request.breakfastCount > 7) {
      errors.push('Breakfast count must be between 0 and 7');
    }
    if (request.lunchCount < 0 || request.lunchCount > 7) {
      errors.push('Lunch count must be between 0 and 7');
    }
    if (request.dinnerCount < 0 || request.dinnerCount > 7) {
      errors.push('Dinner count must be between 0 and 7');
    }
    if (request.snackCount < 0 || request.snackCount > 7) {
      errors.push('Snack count must be between 0 and 7');
    }

    // Check dates
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date');
    }
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date');
    }
    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }

    // Check name
    if (!request.name || request.name.trim().length === 0) {
      errors.push('Plan name is required');
    }
    if (request.name && request.name.length > 255) {
      errors.push('Plan name must be 255 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate meal plan items based on meal counts and distribution strategy
   */
  private generateMealPlanItems(
    planId: number,
    request: CreateWeeklyMealPlanRequest,
  ): NewMealPlanItem[] {
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
          planId,
          category,
          dayNumber,
          status: 'pending',
          customPreferences: null,
        });
      }
    };

    // Create items for each category based on counts
    if (request.breakfastCount > 0) {
      createItemsForCategory('breakfast', request.breakfastCount);
    }
    if (request.lunchCount > 0) {
      createItemsForCategory('lunch', request.lunchCount);
    }
    if (request.dinnerCount > 0) {
      createItemsForCategory('dinner', request.dinnerCount);
    }
    if (request.snackCount > 0) {
      createItemsForCategory('snack', request.snackCount);
    }

    return mealPlanItemsToCreate;
  }

  /**
   * Transform database result to typed WeeklyMealPlanWithItems
   */
  private transformToWeeklyMealPlanWithItems(
    plan: Record<string, unknown>,
  ): WeeklyMealPlanWithItems {
    return {
      ...plan,
      mealPlanItems:
        (plan.mealPlanItems as unknown[])?.map((item: unknown) => ({
          ...(item as Record<string, unknown>),
          recipe: (item as Record<string, unknown>).recipe || undefined,
        })) || [],
      shoppingList: plan.shoppingList || undefined,
    } as WeeklyMealPlanWithItems;
  }
}

// Export singleton instance
export const weeklyMealPlannerService = new WeeklyMealPlannerService();
