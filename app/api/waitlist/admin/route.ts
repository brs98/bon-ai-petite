import {
  getDietaryGoalsAnalysis,
  getFeaturePrioritiesAnalysis,
  getWaitlistEntries,
  getWaitlistStats,
} from '@/lib/db/waitlist';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd add authentication here
    // For now, we'll use a simple API key check
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [stats, entries, featurePriorities, dietaryGoals] = await Promise.all(
      [
        getWaitlistStats(),
        getWaitlistEntries(),
        getFeaturePrioritiesAnalysis(),
        getDietaryGoalsAnalysis(),
      ],
    );

    return NextResponse.json({
      success: true,
      data: {
        stats,
        entries: entries.slice(0, 50), // Limit to first 50 entries
        featurePriorities,
        dietaryGoals,
      },
    });
  } catch (error) {
    console.error('Admin waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist data' },
      { status: 500 },
    );
  }
}

export function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
