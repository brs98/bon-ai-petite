import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { nutritionProfiles } from '@/lib/db/schema';
import { NutritionProfileSchema } from '@/types/recipe';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const profile = await db.query.nutritionProfiles.findFirst({
      where: eq(nutritionProfiles.userId, user.id),
    });

    return Response.json(profile || null);
  } catch (error) {
    console.error('Error fetching nutrition profile:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    // Validate the request body
    const validationResult = NutritionProfileSchema.safeParse({
      ...body,
      userId: user.id,
    });

    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    // Check if profile already exists
    const existingProfile = await db.query.nutritionProfiles.findFirst({
      where: eq(nutritionProfiles.userId, user.id),
    });

    if (existingProfile) {
      return Response.json(
        { error: 'Profile already exists. Use PUT to update.' },
        { status: 409 },
      );
    }

    const newProfile = await db
      .insert(nutritionProfiles)
      .values({
        userId: user.id,
        age: validationResult.data.age,
        height: validationResult.data.height,
        weight: validationResult.data.weight,
        activityLevel: validationResult.data.activityLevel,
        goals: validationResult.data.goals,
        dailyCalories: validationResult.data.dailyCalories,
        macroProtein: validationResult.data.macroProtein,
        macroCarbs: validationResult.data.macroCarbs,
        macroFat: validationResult.data.macroFat,
        allergies: validationResult.data.allergies,
        dietaryRestrictions: validationResult.data.dietaryRestrictions,
        cuisinePreferences: validationResult.data.cuisinePreferences,
      })
      .returning();

    return Response.json(newProfile[0], { status: 201 });
  } catch (error) {
    console.error('Error creating nutrition profile:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    // Validate the request body
    const validationResult = NutritionProfileSchema.safeParse({
      ...body,
      userId: user.id,
    });

    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 },
      );
    }

    // Check if profile exists
    const existingProfile = await db.query.nutritionProfiles.findFirst({
      where: eq(nutritionProfiles.userId, user.id),
    });

    if (!existingProfile) {
      return Response.json(
        { error: 'Profile not found. Use POST to create.' },
        { status: 404 },
      );
    }

    const updatedProfile = await db
      .update(nutritionProfiles)
      .set({
        age: validationResult.data.age,
        height: validationResult.data.height,
        weight: validationResult.data.weight,
        activityLevel: validationResult.data.activityLevel,
        goals: validationResult.data.goals,
        dailyCalories: validationResult.data.dailyCalories,
        macroProtein: validationResult.data.macroProtein,
        macroCarbs: validationResult.data.macroCarbs,
        macroFat: validationResult.data.macroFat,
        allergies: validationResult.data.allergies,
        dietaryRestrictions: validationResult.data.dietaryRestrictions,
        cuisinePreferences: validationResult.data.cuisinePreferences,
        updatedAt: new Date(),
      })
      .where(eq(nutritionProfiles.userId, user.id))
      .returning();

    return Response.json(updatedProfile[0]);
  } catch (error) {
    console.error('Error updating nutrition profile:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
