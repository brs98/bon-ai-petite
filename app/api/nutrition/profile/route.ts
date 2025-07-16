import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { nutritionProfiles } from '@/lib/db/schema';
import { calculateMacroProfile } from '@/lib/utils/nutrition';
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
  goals?: string[];
  dailyCalories?: number;
  macroProtein?: number;
  macroCarbs?: number;
  macroFat?: number;
  allergies?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  gender?: 'male' | 'female';
  goalWeight?: number;
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

    const validatedData = validationResult.data;

    if (existingProfile) {
      // --- UPSERT: Update existing profile ---
      const updateData: NutritionProfileUpdate = {
        updatedAt: new Date(),
      };
      // Merge new data with existing profile for macro calculation
      const mergedProfile = { ...existingProfile, ...validatedData };
      const age = mergedProfile.age ?? undefined;
      const gender = mergedProfile.gender ?? undefined;
      const height = mergedProfile.height ?? undefined;
      const weight = mergedProfile.weight ?? undefined;
      const activityLevel = mergedProfile.activityLevel ?? undefined;
      const goals = mergedProfile.goals ?? undefined;
      const dietaryRestrictions =
        mergedProfile.dietaryRestrictions ?? undefined;

      // Patch: Only calculate macros if not supplied by user
      if (
        age !== undefined &&
        gender !== undefined &&
        height !== undefined &&
        weight !== undefined &&
        activityLevel !== undefined &&
        goals !== undefined &&
        Array.isArray(goals) &&
        goals.length > 0
      ) {
        if (
          validatedData.macroProtein === undefined ||
          validatedData.macroCarbs === undefined ||
          validatedData.macroFat === undefined
        ) {
          const macroProfile = calculateMacroProfile({
            age,
            gender: gender as 'male' | 'female',
            height,
            weight,
            activityLevel,
            goal: goals[0],
            dietaryPreferences: dietaryRestrictions,
          });
          if (validatedData.macroProtein === undefined)
            updateData.macroProtein = macroProfile.protein;
          if (validatedData.macroCarbs === undefined)
            updateData.macroCarbs = macroProfile.carbs;
          if (validatedData.macroFat === undefined)
            updateData.macroFat = macroProfile.fat;
          if (validatedData.dailyCalories === undefined)
            updateData.dailyCalories = macroProfile.calories;
        }
      }
      // Always use user-supplied macro values if present
      if (validatedData.macroProtein !== undefined)
        updateData.macroProtein = validatedData.macroProtein;
      if (validatedData.macroCarbs !== undefined)
        updateData.macroCarbs = validatedData.macroCarbs;
      if (validatedData.macroFat !== undefined)
        updateData.macroFat = validatedData.macroFat;
      if (validatedData.dailyCalories !== undefined)
        updateData.dailyCalories = validatedData.dailyCalories;
      if (validatedData.allergies !== undefined)
        updateData.allergies = validatedData.allergies;
      if (validatedData.dietaryRestrictions !== undefined)
        updateData.dietaryRestrictions = validatedData.dietaryRestrictions;
      if (validatedData.cuisinePreferences !== undefined)
        updateData.cuisinePreferences = validatedData.cuisinePreferences;
      if (validatedData.gender !== undefined)
        updateData.gender = validatedData.gender;
      if (validatedData.goalWeight !== undefined)
        updateData.goalWeight = validatedData.goalWeight;
      if (validatedData.age !== undefined) updateData.age = validatedData.age;
      if (validatedData.height !== undefined)
        updateData.height = validatedData.height;
      if (validatedData.weight !== undefined)
        updateData.weight = validatedData.weight;
      if (validatedData.activityLevel !== undefined)
        updateData.activityLevel = validatedData.activityLevel;
      if (validatedData.goals !== undefined)
        updateData.goals = validatedData.goals;

      const updatedProfile = await db
        .update(nutritionProfiles)
        .set(updateData)
        .where(eq(nutritionProfiles.userId, user.id))
        .returning();

      return Response.json(updatedProfile[0], { status: 200 });
    } else {
      // --- UPSERT: Create new profile ---
      const insertData: NutritionProfileInsert = {
        userId: user.id,
      };
      if (
        validatedData.age !== undefined &&
        validatedData.gender !== undefined &&
        validatedData.height !== undefined &&
        validatedData.weight !== undefined &&
        validatedData.activityLevel !== undefined &&
        validatedData.goals !== undefined &&
        Array.isArray(validatedData.goals) &&
        validatedData.goals.length > 0
      ) {
        if (
          validatedData.macroProtein === undefined ||
          validatedData.macroCarbs === undefined ||
          validatedData.macroFat === undefined
        ) {
          const macroProfile = calculateMacroProfile({
            age: validatedData.age,
            gender: validatedData.gender,
            height: validatedData.height,
            weight: validatedData.weight,
            activityLevel: validatedData.activityLevel,
            goal: validatedData.goals[0],
            dietaryPreferences: validatedData.dietaryRestrictions,
          });
          if (validatedData.macroProtein === undefined)
            insertData.macroProtein = macroProfile.protein;
          if (validatedData.macroCarbs === undefined)
            insertData.macroCarbs = macroProfile.carbs;
          if (validatedData.macroFat === undefined)
            insertData.macroFat = macroProfile.fat;
          if (validatedData.dailyCalories === undefined)
            insertData.dailyCalories = macroProfile.calories;
        }
      }
      // Always use user-supplied macro values if present
      if (validatedData.macroProtein !== undefined)
        insertData.macroProtein = validatedData.macroProtein;
      if (validatedData.macroCarbs !== undefined)
        insertData.macroCarbs = validatedData.macroCarbs;
      if (validatedData.macroFat !== undefined)
        insertData.macroFat = validatedData.macroFat;
      if (validatedData.dailyCalories !== undefined)
        insertData.dailyCalories = validatedData.dailyCalories;
      if (validatedData.allergies !== undefined)
        insertData.allergies = validatedData.allergies;
      if (validatedData.dietaryRestrictions !== undefined)
        insertData.dietaryRestrictions = validatedData.dietaryRestrictions;
      if (validatedData.cuisinePreferences !== undefined)
        insertData.cuisinePreferences = validatedData.cuisinePreferences;
      if (validatedData.gender !== undefined)
        insertData.gender = validatedData.gender;
      if (validatedData.goalWeight !== undefined)
        insertData.goalWeight = validatedData.goalWeight;

      const newProfile = await db
        .insert(nutritionProfiles)
        .values(insertData)
        .returning();

      return Response.json(newProfile[0], { status: 201 });
    }
  } catch (error) {
    console.error('Error upserting nutrition profile:', error);
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

    // Merge new data with existing profile for macro calculation
    const mergedProfile = { ...existingProfile, ...validatedData };
    const age = mergedProfile.age ?? undefined;
    const gender = mergedProfile.gender ?? undefined;
    const height = mergedProfile.height ?? undefined;
    const weight = mergedProfile.weight ?? undefined;
    const activityLevel = mergedProfile.activityLevel ?? undefined;
    const goals = mergedProfile.goals ?? undefined;
    const dietaryRestrictions = mergedProfile.dietaryRestrictions ?? undefined;
    if (
      age !== undefined &&
      gender !== undefined &&
      height !== undefined &&
      weight !== undefined &&
      activityLevel !== undefined &&
      goals !== undefined &&
      Array.isArray(goals) &&
      goals.length > 0
    ) {
      const macroProfile = calculateMacroProfile({
        age,
        gender: gender as 'male' | 'female',
        height,
        weight,
        activityLevel,
        goal: goals[0],
        dietaryPreferences: dietaryRestrictions,
      });
      updateData.dailyCalories = macroProfile.calories;
      updateData.macroProtein = macroProfile.protein;
      updateData.macroCarbs = macroProfile.carbs;
      updateData.macroFat = macroProfile.fat;
    }
    if (validatedData.allergies !== undefined)
      updateData.allergies = validatedData.allergies;
    if (validatedData.dietaryRestrictions !== undefined)
      updateData.dietaryRestrictions = validatedData.dietaryRestrictions;
    if (validatedData.cuisinePreferences !== undefined)
      updateData.cuisinePreferences = validatedData.cuisinePreferences;
    if (validatedData.gender !== undefined)
      updateData.gender = validatedData.gender;
    if (validatedData.goalWeight !== undefined)
      updateData.goalWeight = validatedData.goalWeight;
    if (validatedData.age !== undefined) updateData.age = validatedData.age;
    if (validatedData.height !== undefined)
      updateData.height = validatedData.height;
    if (validatedData.weight !== undefined)
      updateData.weight = validatedData.weight;
    if (validatedData.activityLevel !== undefined)
      updateData.activityLevel = validatedData.activityLevel;
    if (validatedData.goals !== undefined)
      updateData.goals = validatedData.goals;

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
