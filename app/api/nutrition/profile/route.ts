import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { nutritionProfiles } from '@/lib/db/schema';
import { NutritionProfileSchema } from '@/types/recipe';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// Define types for database operations
type NutritionProfileInsert = {
  userId: number;
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: string;
  goals?: string;
  dailyCalories?: number;
  macroProtein?: number;
  macroCarbs?: number;
  macroFat?: number;
  allergies?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
};

type NutritionProfileUpdate = Partial<NutritionProfileInsert> & {
  updatedAt: Date;
};

// Helper function to clean data for validation
function cleanDataForValidation(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  // Only include non-null, non-undefined values
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== null && value !== undefined) {
      // Handle date fields - convert strings to dates if needed
      if (
        (key === 'createdAt' || key === 'updatedAt') &&
        typeof value === 'string'
      ) {
        cleaned[key] = new Date(value);
      } else {
        cleaned[key] = value;
      }
    }
  });

  return cleaned;
}

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

    // Clean the data to remove null values and handle dates properly
    const cleanedData = cleanDataForValidation({
      ...body,
      userId: user.id,
    });

    // Validate the cleaned data with partial schema for preferences-only updates
    const validationResult =
      NutritionProfileSchema.partial().safeParse(cleanedData);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
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

    // Create new profile with only the provided fields
    const insertData: NutritionProfileInsert = {
      userId: user.id,
    };

    // Only include fields that were provided
    const validatedData = validationResult.data;
    if (validatedData.age !== undefined) insertData.age = validatedData.age;
    if (validatedData.height !== undefined)
      insertData.height = validatedData.height;
    if (validatedData.weight !== undefined)
      insertData.weight = validatedData.weight;
    if (validatedData.activityLevel !== undefined)
      insertData.activityLevel = validatedData.activityLevel;
    if (validatedData.goals !== undefined)
      insertData.goals = validatedData.goals;
    if (validatedData.dailyCalories !== undefined)
      insertData.dailyCalories = validatedData.dailyCalories;
    if (validatedData.macroProtein !== undefined)
      insertData.macroProtein = validatedData.macroProtein;
    if (validatedData.macroCarbs !== undefined)
      insertData.macroCarbs = validatedData.macroCarbs;
    if (validatedData.macroFat !== undefined)
      insertData.macroFat = validatedData.macroFat;
    if (validatedData.allergies !== undefined)
      insertData.allergies = validatedData.allergies;
    if (validatedData.dietaryRestrictions !== undefined)
      insertData.dietaryRestrictions = validatedData.dietaryRestrictions;
    if (validatedData.cuisinePreferences !== undefined)
      insertData.cuisinePreferences = validatedData.cuisinePreferences;

    const newProfile = await db
      .insert(nutritionProfiles)
      .values(insertData)
      .returning();

    return Response.json(newProfile[0], { status: 201 });
  } catch (error) {
    console.error('Error creating nutrition profile:', error);
    return Response.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    // Clean the data to remove null values and handle dates properly
    const cleanedData = cleanDataForValidation({
      ...body,
      userId: user.id,
    });

    // Validate the cleaned data with partial schema for preferences-only updates
    const validationResult =
      NutritionProfileSchema.partial().safeParse(cleanedData);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
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

    // Update profile with only the provided fields
    const updateData: NutritionProfileUpdate = {
      updatedAt: new Date(),
    };

    // Only include fields that were provided
    const validatedData = validationResult.data;
    if (validatedData.age !== undefined) updateData.age = validatedData.age;
    if (validatedData.height !== undefined)
      updateData.height = validatedData.height;
    if (validatedData.weight !== undefined)
      updateData.weight = validatedData.weight;
    if (validatedData.activityLevel !== undefined)
      updateData.activityLevel = validatedData.activityLevel;
    if (validatedData.goals !== undefined)
      updateData.goals = validatedData.goals;
    if (validatedData.dailyCalories !== undefined)
      updateData.dailyCalories = validatedData.dailyCalories;
    if (validatedData.macroProtein !== undefined)
      updateData.macroProtein = validatedData.macroProtein;
    if (validatedData.macroCarbs !== undefined)
      updateData.macroCarbs = validatedData.macroCarbs;
    if (validatedData.macroFat !== undefined)
      updateData.macroFat = validatedData.macroFat;
    if (validatedData.allergies !== undefined)
      updateData.allergies = validatedData.allergies;
    if (validatedData.dietaryRestrictions !== undefined)
      updateData.dietaryRestrictions = validatedData.dietaryRestrictions;
    if (validatedData.cuisinePreferences !== undefined)
      updateData.cuisinePreferences = validatedData.cuisinePreferences;

    const updatedProfile = await db
      .update(nutritionProfiles)
      .set(updateData)
      .where(eq(nutritionProfiles.userId, user.id))
      .returning();

    return Response.json(updatedProfile[0]);
  } catch (error) {
    console.error('Error updating nutrition profile:', error);
    return Response.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
