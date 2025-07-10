interface CalorieCalculationParams {
  age: number;
  weight: number; // in lbs
  height: number; // in inches
  activityLevel: string;
  goals: string;
  gender: 'male' | 'female';
}

interface MacroResult {
  protein: number;
  carbs: number;
  fat: number;
}

// Conversion helpers
function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}
function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * Expects weight in lbs and height in inches, converts to metric internally.
 */
export function calculateBMR(
  age: number,
  weight: number, // lbs
  height: number, // inches
  gender: 'male' | 'female',
): number {
  const weightKg = lbsToKg(weight);
  const heightCm = inchesToCm(height);
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

/**
 * Calculate daily calorie needs using Mifflin-St Jeor Equation
 * Expects weight in lbs and height in inches, converts to metric internally.
 */
export function calculateDailyCalories({
  age,
  weight, // lbs
  height, // inches
  activityLevel,
  goals,
  gender,
}: CalorieCalculationParams): number {
  // Calculate Basal Metabolic Rate (BMR)
  const bmr = calculateBMR(age, weight, height, gender);

  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  const multiplier =
    activityMultipliers[activityLevel as keyof typeof activityMultipliers] ||
    1.2;
  let dailyCalories = bmr * multiplier;

  // Adjust for goals
  switch (goals) {
    case 'lose_weight':
      dailyCalories -= 500; // 500 calorie deficit for ~1lb/week weight loss
      break;
    case 'gain_weight':
    case 'gain_muscle':
      dailyCalories += 300; // 300 calorie surplus for weight/muscle gain
      break;
    case 'maintain_weight':
    case 'improve_health':
    default:
      // No adjustment needed
      break;
  }

  return Math.round(dailyCalories);
}

// Dietary preference to macro split mapping
const DIETARY_MACRO_SPLITS: Record<
  string,
  { protein: number; carbs: number; fat: number }
> = {
  standard: { protein: 0.25, carbs: 0.45, fat: 0.3 }, // fallback
  'low-carb': { protein: 0.3, carbs: 0.2, fat: 0.5 },
  keto: { protein: 0.2, carbs: 0.05, fat: 0.75 },
  'high-protein': { protein: 0.4, carbs: 0.3, fat: 0.3 },
  vegan: { protein: 0.25, carbs: 0.55, fat: 0.2 }, // example, can be tuned
  vegetarian: { protein: 0.25, carbs: 0.5, fat: 0.25 },
};

// Helper to select macro split based on dietary preferences
function getMacroSplitForPreferences(dietaryPreferences?: string[]): {
  protein: number;
  carbs: number;
  fat: number;
} {
  if (!dietaryPreferences || dietaryPreferences.length === 0) {
    return DIETARY_MACRO_SPLITS.standard;
  }
  // Priority: keto > low-carb > high-protein > vegan > vegetarian > standard
  if (dietaryPreferences.includes('keto')) return DIETARY_MACRO_SPLITS.keto;
  if (dietaryPreferences.includes('low-carb'))
    return DIETARY_MACRO_SPLITS['low-carb'];
  if (dietaryPreferences.includes('high-protein'))
    return DIETARY_MACRO_SPLITS['high-protein'];
  if (dietaryPreferences.includes('vegan')) return DIETARY_MACRO_SPLITS.vegan;
  if (dietaryPreferences.includes('vegetarian'))
    return DIETARY_MACRO_SPLITS.vegetarian;
  return DIETARY_MACRO_SPLITS.standard;
}

// Updated macro calculation to accept dietary preferences
export function calculateMacros(
  totalCalories: number,
  goals: string | string[],
  dietaryPreferences?: string[],
): MacroResult {
  // Use dietary preferences if present, otherwise fall back to goal-based split
  let split = getMacroSplitForPreferences(dietaryPreferences);
  // If no relevant dietary preference, use goal-based split as before
  if (split === DIETARY_MACRO_SPLITS.standard) {
    const primaryGoal = Array.isArray(goals)
      ? goals[0] || 'maintain_weight'
      : goals;
    switch (primaryGoal) {
      case 'gain_muscle':
        split = { protein: 0.3, carbs: 0.4, fat: 0.3 };
        break;
      case 'lose_weight':
        split = { protein: 0.35, carbs: 0.3, fat: 0.35 };
        break;
      case 'gain_weight':
        split = { protein: 0.25, carbs: 0.45, fat: 0.3 };
        break;
      case 'maintain_weight':
      case 'improve_health':
      default:
        split = { protein: 0.25, carbs: 0.45, fat: 0.3 };
        break;
    }
  }
  // Calculate grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
  const protein = Math.round((totalCalories * split.protein) / 4);
  const carbs = Math.round((totalCalories * split.carbs) / 4);
  const fat = Math.round((totalCalories * split.fat) / 9);
  return { protein, carbs, fat };
}

/**
 * Get macro distribution percentages based on goals
 */
export function getMacroDistribution(goals: string | string[]): {
  protein: number;
  carbs: number;
  fat: number;
} {
  const primaryGoal = Array.isArray(goals)
    ? goals[0] || 'maintain_weight'
    : goals;
  switch (primaryGoal) {
    case 'gain_muscle':
      return { protein: 30, carbs: 40, fat: 30 };
    case 'lose_weight':
      return { protein: 35, carbs: 30, fat: 35 };
    case 'gain_weight':
      return { protein: 25, carbs: 45, fat: 30 };
    case 'maintain_weight':
    case 'improve_health':
    default:
      return { protein: 25, carbs: 45, fat: 30 };
  }
}

/**
 * Validate if a nutrition profile has minimum required fields
 */
export function validateNutritionProfile(profile: {
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: string;
  goals?: string;
}): boolean {
  return !!(
    profile.age &&
    profile.height &&
    profile.weight &&
    profile.activityLevel &&
    profile.goals
  );
}

/**
 * Calculate BMI from height and weight
 * Expects weight in lbs and height in inches, converts to metric internally.
 */
export function calculateBMI(weight: number, height: number): number {
  const weightKg = lbsToKg(weight);
  const heightM = inchesToCm(height) / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal weight';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Calculate macro profile (calories, protein, carbs, fat) based on user profile
 * Uses Mifflin-St Jeor for BMR, activity multiplier for TDEE, and goal adjustment
 * Macro split: 30/40/30 (protein/carbs/fat) for balanced by default
 */
export function calculateMacroProfile({
  age,
  gender,
  height,
  weight,
  activityLevel,
  goal,
  dietaryPreferences,
  goalWeight,
}: {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  weight: number; // kg
  activityLevel: string;
  goal: string;
  dietaryPreferences?: string[];
  goalWeight?: number; // lbs
}): { calories: number; protein: number; carbs: number; fat: number } {
  // Use goalWeight (lbs) if present and goal is lose_weight or gain_weight, otherwise use current weight
  let effectiveWeightKg = weight;
  if (goalWeight && (goal === 'lose_weight' || goal === 'gain_weight')) {
    effectiveWeightKg = goalWeight * 0.453592; // convert lbs to kg
  }
  // Convert weight to lbs, height to inches for calorie calculation
  const weightLbs = effectiveWeightKg / 0.453592;
  const heightIn = height / 2.54;
  const calories = calculateDailyCalories({
    age,
    weight: weightLbs,
    height: heightIn,
    activityLevel,
    goals: goal,
    gender,
  });
  const macros = calculateMacros(calories, goal, dietaryPreferences);
  return { calories, ...macros };
}
