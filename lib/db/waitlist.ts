import { desc, eq } from 'drizzle-orm';
import { db } from './drizzle';
import {
  waitlistEntries,
  type NewWaitlistEntry,
  type WaitlistEntry,
} from './schema';

/**
 * Add a new entry to the waitlist
 */
export async function addWaitlistEntry(
  entry: Omit<NewWaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<WaitlistEntry> {
  const [newEntry] = await db
    .insert(waitlistEntries)
    .values({
      ...entry,
      priorityScore: calculatePriorityScore(entry),
    })
    .returning();

  return newEntry;
}

/**
 * Calculate a priority score based on the entry data
 * Higher scores indicate higher priority for feature development
 */
function calculatePriorityScore(
  entry: Omit<NewWaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>,
): number {
  let score = 0;

  // Base score for joining
  score += 10;

  // Bonus for providing detailed reason
  if (entry.reasonForInterest && entry.reasonForInterest.length > 50) {
    score += 5;
  }

  // Bonus for specific dietary goals (shows clear use case)
  if (entry.dietaryGoals && entry.dietaryGoals.length > 0) {
    score += 3;
  }

  // Bonus for dietary restrictions (shows need for customization)
  if (entry.dietaryRestrictions && entry.dietaryRestrictions.length > 0) {
    score += 2;
  }

  // Bonus for cooking experience (helps prioritize features)
  if (entry.cookingExperience) {
    score += 1;
  }

  // Bonus for household size (shows potential for family features)
  if (entry.householdSize && entry.householdSize > 1) {
    score += 2;
  }

  // Bonus for feature priorities (shows engagement)
  if (entry.featurePriorities && entry.featurePriorities.length > 0) {
    score += entry.featurePriorities.length * 2;
  }

  return score;
}

/**
 * Get all waitlist entries ordered by priority score and creation date
 */
export async function getWaitlistEntries(): Promise<WaitlistEntry[]> {
  return await db
    .select()
    .from(waitlistEntries)
    .orderBy(
      desc(waitlistEntries.priorityScore),
      desc(waitlistEntries.createdAt),
    );
}

/**
 * Get waitlist entries by status
 */
export async function getWaitlistEntriesByStatus(
  status: string,
): Promise<WaitlistEntry[]> {
  return await db
    .select()
    .from(waitlistEntries)
    .where(eq(waitlistEntries.status, status));
}

/**
 * Get waiting entries (not yet invited)
 */
export async function getWaitingEntries(): Promise<WaitlistEntry[]> {
  return await db
    .select()
    .from(waitlistEntries)
    .where(eq(waitlistEntries.status, 'waiting'));
}

/**
 * Update waitlist entry status
 */
export async function updateWaitlistEntryStatus(
  id: number,
  status: string,
  timestamp?: Date,
): Promise<WaitlistEntry | null> {
  const updateData: Partial<
    Pick<WaitlistEntry, 'status' | 'invitedAt' | 'joinedAt' | 'declinedAt'>
  > = { status };

  if (timestamp) {
    switch (status) {
      case 'invited':
        updateData.invitedAt = timestamp;
        break;
      case 'joined':
        updateData.joinedAt = timestamp;
        break;
      case 'declined':
        updateData.declinedAt = timestamp;
        break;
    }
  }

  const [updatedEntry] = await db
    .update(waitlistEntries)
    .set(updateData)
    .where(eq(waitlistEntries.id, id))
    .returning();

  return updatedEntry || null;
}

/**
 * Get waitlist statistics
 */
export async function getWaitlistStats() {
  const total = await db
    .select({ count: waitlistEntries.id })
    .from(waitlistEntries);
  const waiting = await db
    .select({ count: waitlistEntries.id })
    .from(waitlistEntries)
    .where(eq(waitlistEntries.status, 'waiting'));
  const invited = await db
    .select({ count: waitlistEntries.id })
    .from(waitlistEntries)
    .where(eq(waitlistEntries.status, 'invited'));
  const joined = await db
    .select({ count: waitlistEntries.id })
    .from(waitlistEntries)
    .where(eq(waitlistEntries.status, 'joined'));

  return {
    total: total.length,
    waiting: waiting.length,
    invited: invited.length,
    joined: joined.length,
  };
}

/**
 * Get feature priorities analysis
 */
export async function getFeaturePrioritiesAnalysis() {
  const entries = await db
    .select({ featurePriorities: waitlistEntries.featurePriorities })
    .from(waitlistEntries);

  const priorityCounts: Record<string, number> = {};

  entries.forEach(entry => {
    if (entry.featurePriorities) {
      entry.featurePriorities.forEach(priority => {
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      });
    }
  });

  return Object.entries(priorityCounts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get dietary goals analysis
 */
export async function getDietaryGoalsAnalysis() {
  const entries = await db
    .select({ dietaryGoals: waitlistEntries.dietaryGoals })
    .from(waitlistEntries);

  const goalCounts: Record<string, number> = {};

  entries.forEach(entry => {
    if (entry.dietaryGoals) {
      entry.dietaryGoals.forEach(goal => {
        goalCounts[goal] = (goalCounts[goal] || 0) + 1;
      });
    }
  });

  return Object.entries(goalCounts)
    .map(([goal, count]) => ({ goal, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Check if email already exists in waitlist
 */
export async function isEmailInWaitlist(email: string): Promise<boolean> {
  const [entry] = await db
    .select({ id: waitlistEntries.id })
    .from(waitlistEntries)
    .where(eq(waitlistEntries.email, email));
  return !!entry;
}

/**
 * Get entry by email
 */
export async function getWaitlistEntryByEmail(
  email: string,
): Promise<WaitlistEntry | null> {
  const [entry] = await db
    .select()
    .from(waitlistEntries)
    .where(eq(waitlistEntries.email, email));
  return entry || null;
}

/**
 * Upsert a waitlist entry - create new or update existing
 */
export async function upsertWaitlistEntry(
  entry: Omit<NewWaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<WaitlistEntry> {
  // Check if entry already exists
  const existingEntry = await getWaitlistEntryByEmail(entry.email);

  if (existingEntry) {
    // Update existing entry
    const [updatedEntry] = await db
      .update(waitlistEntries)
      .set({
        name: entry.name,
        reasonForInterest:
          entry.reasonForInterest || existingEntry.reasonForInterest,
        featurePriorities: entry.featurePriorities,
        dietaryGoals: entry.dietaryGoals,
        dietaryRestrictions: entry.dietaryRestrictions,
        cookingExperience: entry.cookingExperience,
        householdSize: entry.householdSize,
        referralSource: entry.referralSource,
        priorityScore: calculatePriorityScore({
          ...entry,
          reasonForInterest:
            entry.reasonForInterest || existingEntry.reasonForInterest,
        }),
        updatedAt: new Date(),
      })
      .where(eq(waitlistEntries.email, entry.email))
      .returning();

    return updatedEntry;
  } else {
    // Create new entry - ensure required fields are provided
    const newEntry = {
      ...entry,
      reasonForInterest:
        entry.reasonForInterest || 'Quick signup - will provide details later',
    };
    return await addWaitlistEntry(newEntry);
  }
}
