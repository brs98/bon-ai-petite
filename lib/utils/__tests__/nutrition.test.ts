import {
  calculateBMI,
  calculateBMR,
  calculateDailyCalories,
  calculateMacroProfile,
  calculateMacros,
  getBMICategory,
  getMacroDistribution,
  validateNutritionProfile,
} from '../nutrition';

describe('Nutrition Utils', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR correctly for male profile', () => {
      // Inputs in lbs/inches
      const age = 30;
      const weightLbs = 75 * 2.20462; // 75kg to lbs
      const heightIn = 180 / 2.54; // 180cm to inches
      const result = calculateBMR(age, weightLbs, heightIn, 'male');
      // BMR for male: 10 * 75 + 6.25 * 180 - 5 * 30 + 5 = 1730
      expect(Math.round(result)).toBe(1730);
    });

    it('should calculate BMR correctly for female profile', () => {
      const age = 25;
      const weightLbs = 60 * 2.20462;
      const heightIn = 165 / 2.54;
      const result = calculateBMR(age, weightLbs, heightIn, 'female');
      // BMR for female: 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 1345.25
      expect(Math.round(result * 100) / 100).toBe(1345.25);
    });

    it('should handle edge case values', () => {
      const age = 18;
      const weightLbs = 45 * 2.20462;
      const heightIn = 150 / 2.54;
      const result = calculateBMR(age, weightLbs, heightIn, 'female');
      expect(result).toBeGreaterThan(1000);
      expect(result).toBeLessThan(2000);
    });

    it('should reject invalid inputs gracefully', () => {
      expect(() => calculateBMR(-5, 70, 175, 'male')).not.toThrow();
      expect(() => calculateBMR(25, -10, 175, 'female')).not.toThrow();
      expect(() => calculateBMR(25, 70, -5, 'male')).not.toThrow();
    });
  });

  describe('calculateDailyCalories', () => {
    it('should calculate daily calories correctly for male profile', () => {
      const params = {
        age: 30,
        weight: 75 * 2.20462, // kg to lbs
        height: 180 / 2.54, // cm to inches
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
        gender: 'male' as const,
      };
      const result = calculateDailyCalories(params);
      // BMR: 1730, with moderate activity: 1730 * 1.55 = 2682 (rounded)
      expect(result).toBeCloseTo(2681, 1); // allow rounding difference
    });

    it('should calculate daily calories correctly for female profile', () => {
      const params = {
        age: 25,
        weight: 60 * 2.20462,
        height: 165 / 2.54,
        activityLevel: 'lightly_active',
        goals: 'maintain_weight',
        gender: 'female' as const,
      };
      const result = calculateDailyCalories(params);
      // BMR: 1346.25, with light activity: 1346.25 * 1.375 = 1851 (rounded)
      expect(result).toBeCloseTo(1850, 0);
    });

    it('should handle edge case values for age, weight, height', () => {
      const params = {
        age: 18, // minimum adult age
        weight: 45 * 2.20462, // kg to lbs
        height: 150 / 2.54, // cm to inches
        activityLevel: 'sedentary',
        goals: 'maintain_weight',
        gender: 'female' as const,
      };
      const result = calculateDailyCalories(params);
      expect(result).toBeGreaterThan(1000);
      expect(result).toBeLessThan(3000);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should adjust calories for different activity levels', () => {
      const baseParams = {
        age: 30,
        weight: 70 * 2.20462,
        height: 175 / 2.54,
        goals: 'maintain_weight',
        gender: 'male' as const,
      };
      const sedentary = calculateDailyCalories({
        ...baseParams,
        activityLevel: 'sedentary',
      });
      const veryActive = calculateDailyCalories({
        ...baseParams,
        activityLevel: 'very_active',
      });
      expect(veryActive).toBeGreaterThan(sedentary);
      expect(veryActive - sedentary).toBeGreaterThan(500);
    });

    it('should adjust calories for different fitness goals', () => {
      const baseParams = {
        age: 30,
        weight: 70 * 2.20462,
        height: 175 / 2.54,
        activityLevel: 'moderately_active',
        gender: 'male' as const,
      };
      const maintain = calculateDailyCalories({
        ...baseParams,
        goals: 'maintain_weight',
      });
      const loseWeight = calculateDailyCalories({
        ...baseParams,
        goals: 'lose_weight',
      });
      const gainMuscle = calculateDailyCalories({
        ...baseParams,
        goals: 'gain_muscle',
      });
      expect(maintain - loseWeight).toBe(500);
      expect(gainMuscle - maintain).toBe(300);
    });

    it('should handle unknown activity level by defaulting to sedentary', () => {
      const params = {
        age: 30,
        weight: 70 * 2.20462,
        height: 175 / 2.54,
        activityLevel: 'unknown_activity' as any,
        goals: 'maintain_weight',
        gender: 'male' as const,
      };
      const result = calculateDailyCalories(params);
      const expectedBMR = calculateBMR(30, 70 * 2.20462, 175 / 2.54, 'male');
      const expectedCalories = Math.round(expectedBMR * 1.2); // sedentary
      expect(result).toBe(expectedCalories);
    });

    it('should combine BMR and activity correctly', () => {
      const params = {
        age: 25,
        weight: 65 * 2.20462,
        height: 170 / 2.54,
        activityLevel: 'very_active',
        goals: 'maintain_weight',
        gender: 'female' as const,
      };
      const result = calculateDailyCalories(params);
      const bmr = calculateBMR(25, 65 * 2.20462, 170 / 2.54, 'female');
      const expected = Math.round(bmr * 1.725);
      expect(result).toBe(expected);
    });
  });

  describe('calculateMacros', () => {
    it('should calculate macro distribution for muscle gain goal', () => {
      const totalCalories = 2500;
      const result = calculateMacros(totalCalories, 'gain_muscle');

      // Muscle gain: 30% protein, 40% carbs, 30% fat
      expect(result.protein).toBe(188); // (2500 * 0.3) / 4
      expect(result.carbs).toBe(250); // (2500 * 0.4) / 4
      expect(result.fat).toBe(83); // (2500 * 0.3) / 9
    });

    it('should calculate macro distribution for fat loss goal', () => {
      const totalCalories = 1800;
      const result = calculateMacros(totalCalories, 'lose_weight');

      // Fat loss: 35% protein, 30% carbs, 35% fat
      expect(result.protein).toBe(158); // (1800 * 0.35) / 4
      expect(result.carbs).toBe(135); // (1800 * 0.3) / 4
      expect(result.fat).toBe(70); // (1800 * 0.35) / 9
    });

    it('should calculate macro distribution for maintenance goal', () => {
      const totalCalories = 2000;
      const result = calculateMacros(totalCalories, 'maintain_weight');

      // Maintenance: 25% protein, 45% carbs, 30% fat
      expect(result.protein).toBe(125); // (2000 * 0.25) / 4
      expect(result.carbs).toBe(225); // (2000 * 0.45) / 4
      expect(result.fat).toBe(67); // (2000 * 0.3) / 9
    });

    it('should return macro percentages that calculate to reasonable totals', () => {
      const totalCalories = 2200;
      const result = calculateMacros(totalCalories, 'gain_muscle');

      // Calculate total calories from macros
      const totalFromMacros =
        result.protein * 4 + result.carbs * 4 + result.fat * 9;

      // Should be very close to original calories (within rounding)
      expect(Math.abs(totalFromMacros - totalCalories)).toBeLessThan(50);
    });

    it('should handle unknown goal by defaulting to maintenance', () => {
      const totalCalories = 2000;
      const result = calculateMacros(totalCalories, 'unknown_goal' as any);

      // Should use maintenance ratios (25/45/30)
      expect(result.protein).toBe(125);
      expect(result.carbs).toBe(225);
      expect(result.fat).toBe(67);
    });

    it('should return whole numbers for all macros', () => {
      const totalCalories = 2373; // Odd number to test rounding
      const result = calculateMacros(totalCalories, 'gain_muscle');

      expect(Number.isInteger(result.protein)).toBe(true);
      expect(Number.isInteger(result.carbs)).toBe(true);
      expect(Number.isInteger(result.fat)).toBe(true);
    });
  });

  describe('getMacroDistribution', () => {
    it('should return correct percentages for muscle gain goal', () => {
      const result = getMacroDistribution('gain_muscle');

      expect(result.protein).toBe(30);
      expect(result.carbs).toBe(40);
      expect(result.fat).toBe(30);
      expect(result.protein + result.carbs + result.fat).toBe(100);
    });

    it('should return correct percentages for fat loss goal', () => {
      const result = getMacroDistribution('lose_weight');

      expect(result.protein).toBe(35);
      expect(result.carbs).toBe(30);
      expect(result.fat).toBe(35);
      expect(result.protein + result.carbs + result.fat).toBe(100);
    });

    it('should return correct percentages for maintenance goal', () => {
      const result = getMacroDistribution('maintain_weight');

      expect(result.protein).toBe(25);
      expect(result.carbs).toBe(45);
      expect(result.fat).toBe(30);
      expect(result.protein + result.carbs + result.fat).toBe(100);
    });

    it('should return percentages that sum to 100', () => {
      const goals = [
        'gain_muscle',
        'lose_weight',
        'gain_weight',
        'maintain_weight',
        'improve_health',
      ];

      goals.forEach(goal => {
        const result = getMacroDistribution(goal);
        expect(result.protein + result.carbs + result.fat).toBe(100);
      });
    });
  });

  describe('calculateBMI', () => {
    it('should calculate BMI correctly with valid inputs', () => {
      // Inputs in lbs/inches
      const weightLbs = 154.324; // 70kg to lbs
      const heightIn = 68.8976; // 1.75m to inches (175cm)
      const result = calculateBMI(weightLbs, heightIn);
      // BMI = weight(kg) / (height(m))^2 = 70 / (1.75)^2 = 22.9
      expect(Math.round(result * 10) / 10).toBe(22.9);
    });

    it('should handle edge case values', () => {
      // Very light person
      const lightWeightLbs = 99.208; // 45kg to lbs
      const lightHeightIn = 62.9921; // 160cm to inches
      const lightBMI = calculateBMI(lightWeightLbs, lightHeightIn);
      expect(Math.round(lightBMI * 10) / 10).toBeCloseTo(17.6, 1);
      // Heavier person
      const heavyWeightLbs = 198.416; // 90kg to lbs
      const heavyHeightIn = 70.8661; // 180cm to inches
      const heavyBMI = calculateBMI(heavyWeightLbs, heavyHeightIn);
      expect(Math.round(heavyBMI * 10) / 10).toBeCloseTo(27.8, 1);
    });

    it('should return BMI rounded to one decimal place', () => {
      const result = calculateBMI(73.5, 178.2);

      // Should be rounded to 1 decimal place
      expect(result.toString()).toMatch(/^\d+\.\d$/);
    });
  });

  describe('getBMICategory', () => {
    it('should return correct categories for different BMI ranges', () => {
      expect(getBMICategory(17.0)).toBe('Underweight');
      expect(getBMICategory(18.5)).toBe('Normal weight');
      expect(getBMICategory(22.0)).toBe('Normal weight');
      expect(getBMICategory(24.9)).toBe('Normal weight');
      expect(getBMICategory(25.0)).toBe('Overweight');
      expect(getBMICategory(29.9)).toBe('Overweight');
      expect(getBMICategory(30.0)).toBe('Obese');
      expect(getBMICategory(35.5)).toBe('Obese');
    });

    it('should handle edge cases at category boundaries', () => {
      expect(getBMICategory(18.4)).toBe('Underweight');
      expect(getBMICategory(18.5)).toBe('Normal weight');
      expect(getBMICategory(24.9)).toBe('Normal weight');
      expect(getBMICategory(25.0)).toBe('Overweight');
      expect(getBMICategory(29.9)).toBe('Overweight');
      expect(getBMICategory(30.0)).toBe('Obese');
    });
  });

  describe('validateNutritionProfile', () => {
    it('should return true for valid complete profile', () => {
      const profile = {
        age: 30,
        height: 175,
        weight: 70,
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
      };

      expect(validateNutritionProfile(profile)).toBe(true);
    });

    it('should return false for incomplete profile', () => {
      const incompleteProfile = {
        age: 30,
        height: 175,
        // Missing weight, activityLevel, goals
      };

      expect(validateNutritionProfile(incompleteProfile)).toBe(false);
    });

    it('should return false when age is missing', () => {
      const profile = {
        height: 175,
        weight: 70,
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
      };

      expect(validateNutritionProfile(profile)).toBe(false);
    });

    it('should return false when required fields are undefined', () => {
      const profile = {
        age: undefined,
        height: 175,
        weight: 70,
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
      };

      expect(validateNutritionProfile(profile)).toBe(false);
    });

    it('should return false when required fields are null', () => {
      const profile = {
        age: 30,
        height: null as any,
        weight: 70,
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
      };

      expect(validateNutritionProfile(profile)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(validateNutritionProfile({})).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle zero and negative values gracefully', () => {
      // Should not crash with edge values
      expect(() => calculateBMI(0, 175)).not.toThrow();
      expect(() => calculateBMI(70, 0)).not.toThrow();
      expect(() => getBMICategory(0)).not.toThrow();
      expect(() => calculateMacros(0, 'maintain_weight')).not.toThrow();
    });

    it('should handle very large values gracefully', () => {
      const largeParams = {
        age: 100,
        weight: 200,
        height: 250,
        activityLevel: 'extremely_active',
        goals: 'gain_muscle',
        gender: 'male' as const,
      };

      expect(() => calculateDailyCalories(largeParams)).not.toThrow();
      const result = calculateDailyCalories(largeParams);
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });
  });
});

// Conversion helpers for tests
function kgToLbs(kg: number): number {
  return kg / 0.453592;
}
function cmToInches(cm: number): number {
  return cm / 2.54;
}

describe('goal weight logic in macro calculation', () => {
  it('should use goalWeight (kg) for lose_weight goal', () => {
    const params = {
      age: 30,
      weight: 80, // current weight kg
      height: 180,
      activityLevel: 'moderately_active',
      goal: 'lose_weight',
      gender: 'male' as const,
      goalWeight: 150, // lbs
    };
    // 150 lbs = 68 kg
    const macroProfile = calculateMacroProfile({
      ...params,
      dietaryPreferences: [],
    });
    // Should use 68kg for calculations
    const expectedWeightLbs = 150; // goalWeight in lbs
    const expectedHeightIn = cmToInches(180);
    const expectedBMR = calculateBMR(
      30,
      expectedWeightLbs,
      expectedHeightIn,
      'male',
    );
    const expectedCalories = Math.round(expectedBMR * 1.55) - 500;
    expect(macroProfile.calories).toBe(expectedCalories);
  });

  it('should use current weight for maintain_weight goal', () => {
    const params = {
      age: 30,
      weight: 80, // kg
      height: 180,
      activityLevel: 'moderately_active',
      goal: 'maintain_weight',
      gender: 'male' as const,
      goalWeight: 150, // lbs (should be ignored)
    };
    const macroProfile = calculateMacroProfile({
      ...params,
      dietaryPreferences: [],
    });
    const expectedWeightLbs = kgToLbs(80);
    const expectedHeightIn = cmToInches(180);
    const expectedBMR = calculateBMR(
      30,
      expectedWeightLbs,
      expectedHeightIn,
      'male',
    );
    const expectedCalories = Math.round(expectedBMR * 1.55);
    expect(macroProfile.calories).toBe(expectedCalories);
  });

  it('should fallback to current weight if goalWeight is missing', () => {
    const params = {
      age: 30,
      weight: 80, // kg
      height: 180,
      activityLevel: 'moderately_active',
      goal: 'lose_weight',
      gender: 'male' as const,
    };
    const macroProfile = calculateMacroProfile({
      ...params,
      dietaryPreferences: [],
    });
    const expectedWeightLbs = kgToLbs(80);
    const expectedHeightIn = cmToInches(180);
    const expectedBMR = calculateBMR(
      30,
      expectedWeightLbs,
      expectedHeightIn,
      'male',
    );
    const expectedCalories = Math.round(expectedBMR * 1.55) - 500;
    expect(macroProfile.calories).toBe(expectedCalories);
  });
});
