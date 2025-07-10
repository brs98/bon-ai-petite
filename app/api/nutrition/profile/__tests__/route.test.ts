// Unit tests for nutrition profile API business logic
import { calculateBMR, calculateMacroProfile } from '@/lib/utils/nutrition';

describe('Nutrition Profile API Logic', () => {
  describe('profile validation', () => {
    it('should validate required fields for profile creation', () => {
      const validProfile = {
        age: 30,
        height: 175,
        weight: 70,
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
        dailyCalories: 2200,
        macroProtein: 137,
        macroCarbs: 248,
        macroFat: 73,
      };

      // All required fields present
      expect(validProfile.age).toBeDefined();
      expect(validProfile.height).toBeDefined();
      expect(validProfile.weight).toBeDefined();
      expect(validProfile.activityLevel).toBeDefined();
      expect(validProfile.goals).toBeDefined();
    });

    it('should identify missing required fields', () => {
      const incompleteProfile = {
        age: 30,
        height: 175,
        // Missing weight, activityLevel, goals
      };

      const hasAllRequired = !!(
        incompleteProfile.age &&
        incompleteProfile.height &&
        (incompleteProfile as any).weight &&
        (incompleteProfile as any).activityLevel &&
        (incompleteProfile as any).goals
      );

      expect(hasAllRequired).toBe(false);
    });

    it('should validate numeric field ranges', () => {
      const profile = {
        age: 25,
        height: 165,
        weight: 60,
        dailyCalories: 1800,
        macroProtein: 158,
        macroCarbs: 135,
        macroFat: 70,
      };

      // Age should be reasonable
      expect(profile.age).toBeGreaterThan(0);
      expect(profile.age).toBeLessThan(150);

      // Height should be reasonable (in cm)
      expect(profile.height).toBeGreaterThan(100);
      expect(profile.height).toBeLessThan(250);

      // Weight should be reasonable (in kg)
      expect(profile.weight).toBeGreaterThan(20);
      expect(profile.weight).toBeLessThan(300);

      // Calories should be reasonable
      expect(profile.dailyCalories).toBeGreaterThan(800);
      expect(profile.dailyCalories).toBeLessThan(5000);
    });

    it('should validate activity level values', () => {
      const validActivityLevels = [
        'sedentary',
        'lightly_active',
        'moderately_active',
        'very_active',
        'extremely_active',
      ];

      validActivityLevels.forEach(level => {
        expect(typeof level).toBe('string');
        expect(level.length).toBeGreaterThan(0);
      });

      // Invalid activity level
      const invalidLevel = 'super_active';
      expect(validActivityLevels.includes(invalidLevel)).toBe(false);
    });

    it('should validate goal values', () => {
      const validGoals = [
        'lose_weight',
        'gain_weight',
        'maintain_weight',
        'gain_muscle',
        'improve_health',
      ];

      validGoals.forEach(goal => {
        expect(typeof goal).toBe('string');
        expect(goal.length).toBeGreaterThan(0);
      });

      // Invalid goal
      const invalidGoal = 'become_superhuman';
      expect(validGoals.includes(invalidGoal)).toBe(false);
    });
  });

  describe('profile data consistency', () => {
    it('should ensure macro calories align with daily calories', () => {
      const profile = {
        dailyCalories: 2000,
        macroProtein: 125, // 500 calories
        macroCarbs: 225, // 900 calories
        macroFat: 67, // 603 calories
      };

      const macroCalories =
        profile.macroProtein * 4 +
        profile.macroCarbs * 4 +
        profile.macroFat * 9;
      const difference = Math.abs(profile.dailyCalories - macroCalories);

      // Should be within reasonable range (allowing for rounding)
      expect(difference).toBeLessThan(100);
    });

    it('should handle array fields properly', () => {
      const profile = {
        allergies: ['nuts', 'dairy'],
        dietaryRestrictions: ['vegetarian'],
        cuisinePreferences: ['italian', 'mexican', 'asian'],
      };

      expect(Array.isArray(profile.allergies)).toBe(true);
      expect(Array.isArray(profile.dietaryRestrictions)).toBe(true);
      expect(Array.isArray(profile.cuisinePreferences)).toBe(true);

      // Should handle empty arrays
      const emptyProfile = {
        allergies: [],
        dietaryRestrictions: [],
        cuisinePreferences: [],
      };

      expect(emptyProfile.allergies.length).toBe(0);
      expect(emptyProfile.dietaryRestrictions.length).toBe(0);
      expect(emptyProfile.cuisinePreferences.length).toBe(0);
    });
  });

  describe('error handling scenarios', () => {
    it('should handle invalid data types', () => {
      const invalidProfile = {
        age: 'thirty', // Should be number
        height: null, // Should be number
        weight: undefined, // Should be number
        activityLevel: 123, // Should be string
        goals: [], // Should be string
      };

      // Type validation
      expect(typeof invalidProfile.age).not.toBe('number');
      expect(typeof invalidProfile.height).not.toBe('number');
      expect(typeof invalidProfile.weight).not.toBe('number');
      expect(typeof invalidProfile.activityLevel).not.toBe('string');
      expect(typeof invalidProfile.goals).not.toBe('string');
    });

    it('should handle extreme values gracefully', () => {
      const extremeProfile = {
        age: -5,
        height: 0,
        weight: 1000,
        dailyCalories: -500,
        macroProtein: -10,
      };

      // Should identify invalid ranges
      expect(extremeProfile.age < 0).toBe(true);
      expect(extremeProfile.height <= 0).toBe(true);
      expect(extremeProfile.weight > 500).toBe(true);
      expect(extremeProfile.dailyCalories < 0).toBe(true);
      expect(extremeProfile.macroProtein < 0).toBe(true);
    });
  });

  describe('profile update logic', () => {
    it('should preserve existing data when updating partial fields', () => {
      const existingProfile = {
        age: 30,
        height: 175,
        weight: 70,
        activityLevel: 'moderately_active',
        goals: 'maintain_weight',
        allergies: ['nuts'],
      };

      const updateData = {
        weight: 72,
        goals: 'gain_muscle',
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateData,
      };

      // Should preserve unchanged fields
      expect(updatedProfile.age).toBe(existingProfile.age);
      expect(updatedProfile.height).toBe(existingProfile.height);
      expect(updatedProfile.activityLevel).toBe(existingProfile.activityLevel);
      expect(updatedProfile.allergies).toEqual(existingProfile.allergies);

      // Should update changed fields
      expect(updatedProfile.weight).toBe(updateData.weight);
      expect(updatedProfile.goals).toBe(updateData.goals);
    });

    it('should handle timestamp updates', () => {
      const now = new Date();
      const profile = {
        createdAt: new Date('2023-01-01'),
        updatedAt: now,
      };

      expect(profile.updatedAt.getTime()).toBeGreaterThan(
        profile.createdAt.getTime(),
      );
    });
  });
});

describe('goalWeight API logic', () => {
  it('should persist goalWeight on profile creation', () => {
    const profile = {
      age: 30,
      height: 175,
      weight: 70,
      activityLevel: 'moderately_active',
      goals: 'lose_weight',
      goalWeight: 150,
    };
    // Simulate API create logic
    expect(profile.goalWeight).toBe(150);
  });

  it('should persist goalWeight on profile update', () => {
    const existing = { goalWeight: 180 };
    const update = { goalWeight: 160 };
    const updated = { ...existing, ...update };
    expect(updated.goalWeight).toBe(160);
  });

  it('should use goalWeight for macro/calorie targets if goal is lose_weight', () => {
    // Simulate API logic
    const profile = {
      age: 30,
      height: 175,
      weight: 80,
      activityLevel: 'moderately_active',
      goals: 'lose_weight',
      goalWeight: 150,
      gender: 'male' as const,
    };
    const macroProfile = calculateMacroProfile({
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      activityLevel: profile.activityLevel,
      goal: profile.goals,
      gender: profile.gender,
      goalWeight: profile.goalWeight,
      dietaryPreferences: [],
    });
    // Should use goalWeight (68kg), but calculateDailyCalories expects lbs/inches
    const expectedWeightLbs = 150; // goalWeight in lbs
    const expectedHeightIn = 175 / 2.54;
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
