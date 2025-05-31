import {
  calculateBMI,
  calculateBMR,
  calculateDailyCalories,
  calculateMacros,
  getBMICategory,
  getMacroDistribution,
  validateNutritionProfile,
} from '../nutrition';

describe('Nutrition Utils', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR correctly for male profile', () => {
      const result = calculateBMR(30, 75, 180, 'male');

      // BMR for male: 10 * 75 + 6.25 * 180 - 5 * 30 + 5 = 1730
      expect(result).toBe(1730);
    });

    it('should calculate BMR correctly for female profile', () => {
      const result = calculateBMR(25, 60, 165, 'female');

      // BMR for female: 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 1345.25
      expect(result).toBe(1345.25);
    });

    it('should handle edge case values', () => {
      const result = calculateBMR(18, 45, 150, 'female');

      expect(result).toBeGreaterThan(1000);
      expect(result).toBeLessThan(2000);
    });

    it('should reject invalid inputs gracefully', () => {
      // Test with negative values - should not crash but may return unexpected results
      expect(() => calculateBMR(-5, 70, 175, 'male')).not.toThrow();
      expect(() => calculateBMR(25, -10, 175, 'female')).not.toThrow();
      expect(() => calculateBMR(25, 70, -5, 'male')).not.toThrow();
    });
  });

  describe('calculateDailyCalories', () => {
    it('should calculate daily calories correctly for male profile', () => {
      const params = {
        age: 30,
        weight: 75, // kg
        height: 180, // cm
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
        gender: 'male' as const,
      };

      const result = calculateDailyCalories(params);

      // BMR: 1730, with moderate activity: 1730 * 1.55 = 2682 (rounded)
      expect(result).toBe(2682);
    });

    it('should calculate daily calories correctly for female profile', () => {
      const params = {
        age: 25,
        weight: 60, // kg
        height: 165, // cm
        activityLevel: 'lightly_active',
        goals: 'maintain_weight',
        gender: 'female' as const,
      };

      const result = calculateDailyCalories(params);

      // BMR: 1346.25, with light activity: 1346.25 * 1.375 = 1851 (rounded)
      expect(result).toBe(1850);
    });

    it('should handle edge case values for age, weight, height', () => {
      const params = {
        age: 18, // minimum adult age
        weight: 45, // lower weight
        height: 150, // shorter height
        activityLevel: 'sedentary',
        goals: 'maintain_weight',
        gender: 'female' as const,
      };

      const result = calculateDailyCalories(params);

      // Should return a reasonable calorie value
      expect(result).toBeGreaterThan(1000);
      expect(result).toBeLessThan(3000);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should adjust calories for different activity levels', () => {
      const baseParams = {
        age: 30,
        weight: 70,
        height: 175,
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

      // Very active should have significantly more calories than sedentary
      expect(veryActive).toBeGreaterThan(sedentary);
      expect(veryActive - sedentary).toBeGreaterThan(500);
    });

    it('should adjust calories for different fitness goals', () => {
      const baseParams = {
        age: 30,
        weight: 70,
        height: 175,
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

      // Lose weight should be 500 calories less than maintain
      expect(maintain - loseWeight).toBe(500);

      // Gain muscle should be 300 calories more than maintain
      expect(gainMuscle - maintain).toBe(300);
    });

    it('should handle unknown activity level by defaulting to sedentary', () => {
      const params = {
        age: 30,
        weight: 70,
        height: 175,
        activityLevel: 'unknown_activity' as any,
        goals: 'maintain_weight',
        gender: 'male' as const,
      };

      const result = calculateDailyCalories(params);

      // Should default to sedentary multiplier (1.2)
      const expectedBMR = calculateBMR(30, 70, 175, 'male'); // 1705
      const expectedCalories = Math.round(expectedBMR * 1.2); // 2046
      expect(result).toBe(expectedCalories);
    });

    it('should combine BMR and activity correctly', () => {
      const params = {
        age: 25,
        weight: 65,
        height: 170,
        activityLevel: 'very_active',
        goals: 'maintain_weight',
        gender: 'female' as const,
      };

      const result = calculateDailyCalories(params);
      const bmr = calculateBMR(25, 65, 170, 'female');
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
      const weight = 70; // kg
      const height = 175; // cm

      const result = calculateBMI(weight, height);

      // BMI = weight(kg) / (height(m))^2 = 70 / (1.75)^2 = 22.9
      expect(result).toBe(22.9);
    });

    it('should handle edge case values', () => {
      // Very light person
      const lightBMI = calculateBMI(45, 160);
      expect(lightBMI).toBe(17.6);

      // Heavier person
      const heavyBMI = calculateBMI(90, 180);
      expect(heavyBMI).toBe(27.8);

      // Very tall person
      const tallBMI = calculateBMI(75, 200);
      expect(tallBMI).toBe(18.8);
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
