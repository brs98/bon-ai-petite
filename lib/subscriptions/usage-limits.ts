// Usage limit logic for per-user, per-action enforcement
// This file will provide functions to check and enforce limits for actions like recipe generation, meal planning, etc.

import { and, eq } from 'drizzle-orm';
import { db } from '../db/drizzle';
import { usageTracking, users } from '../db/schema';

// Define allowed actions for usage tracking
export type UsageAction = 'recipe_generation' | 'meal_plan_creation';

// Subscription plan limits (could be extended or loaded from config)
const PLAN_LIMITS: Record<string, Record<UsageAction, number>> = {
  essential: {
    recipe_generation: 10, // per day
    meal_plan_creation: 2, // per week
  },
  premium: {
    recipe_generation: -1, // unlimited
    meal_plan_creation: -1, // unlimited
  },
};

// Helper to get the start of today (for daily limits)
function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

// Helper to get the start of the current week (for weekly limits, ISO week)
function getWeekStartDateString(): string {
  const now = new Date();
  const day = now.getDay() || 7; // Sunday=0, make it 7
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - day + 1); // Monday as first day
  return now.toISOString().slice(0, 10);
}

/**
 * Check if a user is within their usage limit for a given action.
 * @param userId - The user's ID
 * @param action - The action to check (e.g., 'recipe_generation')
 * @returns Promise<boolean> - true if within limit, false if exceeded
 */
export async function checkUsageLimit(
  userId: number,
  action: UsageAction,
): Promise<boolean> {
  // Fetch user plan
  const userArr = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = userArr[0];
  if (!user) return false;
  const plan = (user.planName as keyof typeof PLAN_LIMITS) || 'essential';
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.essential;
  const limit = planLimits[action];
  if (typeof limit !== 'number' || limit === -1) return true; // Unlimited or not tracked

  // Determine period (daily or weekly)
  let periodStart: string;
  if (action === 'recipe_generation') {
    periodStart = getTodayDateString();
  } else if (action === 'meal_plan_creation') {
    periodStart = getWeekStartDateString();
  } else {
    // Fallback: treat as daily
    periodStart = getTodayDateString();
  }

  // Query usage_tracking for this user, action, and period
  const usageArr = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.action, action),
        eq(usageTracking.date, periodStart),
      ),
    )
    .limit(1);
  const usage = usageArr[0];
  const count = usage ? usage.count : 0;
  return count < limit;
}

/**
 * Increment a user's usage for a given action and period.
 * Call this after a successful action (e.g., after recipe generation).
 */
export async function incrementUsage(
  userId: number,
  action: UsageAction,
): Promise<void> {
  let periodStart: string;
  if (action === 'recipe_generation') {
    periodStart = getTodayDateString();
  } else if (action === 'meal_plan_creation') {
    periodStart = getWeekStartDateString();
  } else {
    periodStart = getTodayDateString();
  }

  // Try to update existing row, or insert if not exists
  const existing = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.action, action),
        eq(usageTracking.date, periodStart),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(usageTracking)
      .set({ count: existing[0].count + 1 })
      .where(eq(usageTracking.id, existing[0].id));
  } else {
    await db.insert(usageTracking).values({
      userId,
      action,
      date: periodStart,
      count: 1,
    });
  }
}

// ... more functions to be added for incrementing usage, getting usage, etc.
