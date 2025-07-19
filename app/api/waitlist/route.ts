import { upsertWaitlistEntry } from '@/lib/db/waitlist';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for waitlist submissions
const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  reasonForInterest: z
    .string()
    .min(10, 'Please provide a detailed reason (at least 10 characters)')
    .max(1000, 'Reason must be less than 1000 characters')
    .optional(),
  featurePriorities: z.array(z.string()).optional(),
  dietaryGoals: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  cookingExperience: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional(),
  householdSize: z.number().min(1).max(20).optional(),
  referralSource: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = waitlistSchema.parse(body);

    // Get client information for analytics
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Upsert entry to waitlist (create new or update existing)
    const entry = await upsertWaitlistEntry({
      ...validatedData,
      reasonForInterest:
        validatedData.reasonForInterest ||
        'Quick signup - will provide details later',
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for joining our waitlist! We'll be in touch soon.",
      data: {
        id: entry.id,
        email: entry.email,
        priorityScore: entry.priorityScore,
      },
    });
  } catch (error) {
    console.error('Waitlist submission error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid data provided',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
