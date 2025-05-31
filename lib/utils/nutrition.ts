interface CalorieCalculationParams {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  activityLevel: string;
  goals: string;
  gender: 'male' | 'female';
}

interface MacroResult {
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 */
export function calculateBMR(
  age: number,
  weight: number,
  height: number,
  gender: 'male' | 'female',
): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * Calculate daily calorie needs using Mifflin-St Jeor Equation
 */
export function calculateDailyCalories({
  age,
  weight,
  height,
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

/**
 * Calculate macro distribution based on goals and total calories
 */
export function calculateMacros(
  totalCalories: number,
  goals: string,
): MacroResult {
  let proteinRatio: number;
  let carbRatio: number;
  let fatRatio: number;

  switch (goals) {
    case 'gain_muscle':
      // High protein for muscle building
      proteinRatio = 0.3; // 30% protein
      carbRatio = 0.4; // 40% carbs
      fatRatio = 0.3; // 30% fat
      break;
    case 'lose_weight':
      // Higher protein to preserve muscle, moderate carbs
      proteinRatio = 0.35; // 35% protein
      carbRatio = 0.3; // 30% carbs
      fatRatio = 0.35; // 35% fat
      break;
    case 'gain_weight':
      // Balanced with slightly higher carbs
      proteinRatio = 0.25; // 25% protein
      carbRatio = 0.45; // 45% carbs
      fatRatio = 0.3; // 30% fat
      break;
    case 'maintain_weight':
    case 'improve_health':
    default:
      // Balanced macro distribution
      proteinRatio = 0.25; // 25% protein
      carbRatio = 0.45; // 45% carbs
      fatRatio = 0.3; // 30% fat
      break;
  }

  // Calculate grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
  const protein = Math.round((totalCalories * proteinRatio) / 4);
  const carbs = Math.round((totalCalories * carbRatio) / 4);
  const fat = Math.round((totalCalories * fatRatio) / 9);

  return {
    protein,
    carbs,
    fat,
  };
}

/**
 * Get macro distribution percentages based on goals
 */
export function getMacroDistribution(goals: string): {
  protein: number;
  carbs: number;
  fat: number;
} {
  switch (goals) {
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
 */
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
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
