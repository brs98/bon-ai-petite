import { type NutritionProfile } from '@/lib/db/schema';
import {
  type GenerateMealRequest,
  type RecipeGenerationRequest,
  COMMON_ALLERGIES,
  CUISINE_TYPES,
  DIETARY_RESTRICTIONS,
} from '@/types/recipe';

/**
 * Interface for meal preferences that can be applied globally or per meal
 */
export interface MealPreferences {
  allergies?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  maxPrepTime?: number;
  maxCookTime?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

/**
 * Interface for preference validation results
 */
export interface PreferenceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Interface for preference merge context
 */
export interface PreferenceMergeContext {
  userNutritionProfile?: NutritionProfile;
  globalPlanPreferences?: MealPreferences;
  mealCategoryDefaults?: Partial<
    Record<'breakfast' | 'lunch' | 'dinner' | 'snack', MealPreferences>
  >;
  sessionId?: string;
}

/**
 * Service for handling meal preference overrides and merging logic
 */
export class PreferenceOverrideService {
  private readonly maxPrepTime = 180; // 3 hours maximum
  private readonly maxCookTime = 480; // 8 hours maximum (for slow cooking)
  private readonly validAllergies = COMMON_ALLERGIES.slice();
  private readonly validDietaryRestrictions = DIETARY_RESTRICTIONS.slice();
  private readonly validCuisines = CUISINE_TYPES.slice();

  /**
   * Merge preferences with priority: custom > global > category defaults > user profile
   */
  mergePreferences(
    customPreferences: MealPreferences,
    context: PreferenceMergeContext,
    mealCategory: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): RecipeGenerationRequest {
    const {
      userNutritionProfile,
      globalPlanPreferences,
      mealCategoryDefaults,
    } = context;

    // Start with base nutrition profile preferences
    const basePreferences = this.extractPreferencesFromNutritionProfile(
      userNutritionProfile,
      mealCategory,
    );

    // Apply category-specific defaults
    const categoryDefaults = mealCategoryDefaults?.[mealCategory] || {};

    // Apply global plan preferences
    const globalPrefs = globalPlanPreferences || {};

    // Merge in priority order (later overrides earlier)
    const mergedPreferences: RecipeGenerationRequest = {
      mealType: mealCategory,

      // Nutrition targets
      calories:
        customPreferences.calories ??
        globalPrefs.calories ??
        categoryDefaults.calories ??
        basePreferences.calories,

      protein:
        customPreferences.protein ??
        globalPrefs.protein ??
        categoryDefaults.protein ??
        basePreferences.protein,

      carbs:
        customPreferences.carbs ??
        globalPrefs.carbs ??
        categoryDefaults.carbs ??
        basePreferences.carbs,

      fat:
        customPreferences.fat ??
        globalPrefs.fat ??
        categoryDefaults.fat ??
        basePreferences.fat,

      // Dietary preferences (arrays are merged, not replaced)
      allergies: this.mergeArrayPreferences([
        basePreferences.allergies || [],
        categoryDefaults.allergies || [],
        globalPrefs.allergies || [],
        customPreferences.allergies || [],
      ]),

      dietaryRestrictions: this.mergeArrayPreferences([
        basePreferences.dietaryRestrictions || [],
        categoryDefaults.dietaryRestrictions || [],
        globalPrefs.dietaryRestrictions || [],
        customPreferences.dietaryRestrictions || [],
      ]),

      cuisinePreferences: this.mergeArrayPreferences([
        basePreferences.cuisinePreferences || [],
        categoryDefaults.cuisinePreferences || [],
        globalPrefs.cuisinePreferences || [],
        customPreferences.cuisinePreferences || [],
      ]),

      // User profile data (if available)
      userProfile: userNutritionProfile
        ? {
            age: userNutritionProfile.age || undefined,
            weight: userNutritionProfile.weight || undefined,
            height: userNutritionProfile.height || undefined,
            activityLevel: userNutritionProfile.activityLevel || undefined,
            goals: Array.isArray(userNutritionProfile.goals)
              ? userNutritionProfile.goals[0] || undefined
              : userNutritionProfile.goals || undefined,
          }
        : undefined,
    };

    return mergedPreferences;
  }

  /**
   * Validate preference values for consistency and constraints
   */
  validatePreferences(
    preferences: MealPreferences,
  ): PreferenceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate time constraints
    if (preferences.maxPrepTime !== undefined) {
      if (preferences.maxPrepTime < 0) {
        errors.push('Maximum prep time cannot be negative');
      } else if (preferences.maxPrepTime > this.maxPrepTime) {
        errors.push(
          `Maximum prep time cannot exceed ${this.maxPrepTime} minutes`,
        );
      } else if (preferences.maxPrepTime < 5) {
        warnings.push('Very short prep time may limit recipe options');
      }
    }

    if (preferences.maxCookTime !== undefined) {
      if (preferences.maxCookTime < 0) {
        errors.push('Maximum cook time cannot be negative');
      } else if (preferences.maxCookTime > this.maxCookTime) {
        errors.push(
          `Maximum cook time cannot exceed ${this.maxCookTime} minutes`,
        );
      } else if (preferences.maxCookTime < 5) {
        warnings.push('Very short cook time may limit recipe options');
      }
    }

    // Validate nutrition values
    if (preferences.calories !== undefined) {
      if (preferences.calories < 0) {
        errors.push('Calories cannot be negative');
      } else if (preferences.calories > 2000) {
        warnings.push('Very high calorie target for a single meal');
      } else if (preferences.calories < 100) {
        warnings.push('Very low calorie target may be difficult to achieve');
      }
    }

    if (preferences.protein !== undefined) {
      if (preferences.protein < 0) {
        errors.push('Protein cannot be negative');
      } else if (preferences.protein > 100) {
        warnings.push('Very high protein target for a single meal');
      }
    }

    if (preferences.carbs !== undefined) {
      if (preferences.carbs < 0) {
        errors.push('Carbs cannot be negative');
      } else if (preferences.carbs > 150) {
        warnings.push('Very high carb target for a single meal');
      }
    }

    if (preferences.fat !== undefined) {
      if (preferences.fat < 0) {
        errors.push('Fat cannot be negative');
      } else if (preferences.fat > 100) {
        warnings.push('Very high fat target for a single meal');
      }
    }

    // Validate allergies
    if (preferences.allergies) {
      const invalidAllergies = preferences.allergies.filter(
        allergy =>
          !this.validAllergies.includes(
            allergy as (typeof COMMON_ALLERGIES)[number],
          ),
      );
      if (invalidAllergies.length > 0) {
        warnings.push(`Unknown allergies: ${invalidAllergies.join(', ')}`);
      }
    }

    // Validate dietary restrictions
    if (preferences.dietaryRestrictions) {
      const invalidRestrictions = preferences.dietaryRestrictions.filter(
        restriction =>
          !this.validDietaryRestrictions.includes(
            restriction as (typeof DIETARY_RESTRICTIONS)[number],
          ),
      );
      if (invalidRestrictions.length > 0) {
        warnings.push(
          `Unknown dietary restrictions: ${invalidRestrictions.join(', ')}`,
        );
      }
    }

    // Validate cuisines
    if (preferences.cuisinePreferences) {
      const invalidCuisines = preferences.cuisinePreferences.filter(
        cuisine =>
          !this.validCuisines.includes(
            cuisine as (typeof CUISINE_TYPES)[number],
          ),
      );
      if (invalidCuisines.length > 0) {
        warnings.push(`Unknown cuisines: ${invalidCuisines.join(', ')}`);
      }
    }

    // Check for conflicting preferences
    if (
      preferences.dietaryRestrictions?.includes('Vegan') &&
      preferences.dietaryRestrictions?.includes('Keto')
    ) {
      warnings.push('Vegan and Keto diets may be difficult to combine');
    }

    if (
      preferences.dietaryRestrictions?.includes('Low-carb') &&
      preferences.carbs &&
      preferences.carbs > 50
    ) {
      warnings.push(
        'High carb target conflicts with low-carb dietary restriction',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Apply global preferences to all meals in a category
   */
  applyGlobalOverrides(
    existingPreferences: MealPreferences[],
    globalOverrides: MealPreferences,
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): MealPreferences[] {
    return existingPreferences.map(prefs =>
      this.mergeTwoPreferences(prefs, globalOverrides, category),
    );
  }

  /**
   * Create category-specific default preferences
   */
  getCategoryDefaults(
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): MealPreferences {
    const baseDefaults: MealPreferences = {
      allergies: [],
      dietaryRestrictions: [],
      cuisinePreferences: [],
      difficultyLevel: 'easy',
    };

    switch (category) {
      case 'breakfast':
        return {
          ...baseDefaults,
          maxPrepTime: 20,
          maxCookTime: 30,
          calories: 400,
          protein: 15,
          carbs: 45,
          fat: 15,
        };

      case 'lunch':
        return {
          ...baseDefaults,
          maxPrepTime: 30,
          maxCookTime: 45,
          calories: 500,
          protein: 25,
          carbs: 50,
          fat: 20,
        };

      case 'dinner':
        return {
          ...baseDefaults,
          maxPrepTime: 45,
          maxCookTime: 60,
          calories: 600,
          protein: 30,
          carbs: 60,
          fat: 25,
          difficultyLevel: 'medium',
        };

      case 'snack':
        return {
          ...baseDefaults,
          maxPrepTime: 10,
          maxCookTime: 15,
          calories: 200,
          protein: 8,
          carbs: 20,
          fat: 8,
        };

      default:
        return baseDefaults;
    }
  }

  /**
   * Generate preference preset combinations for common dietary patterns
   */
  getPreferencePresets(): Record<string, MealPreferences> {
    return {
      'low-carb': {
        dietaryRestrictions: ['Low-carb'],
        carbs: 20,
        protein: 35,
        fat: 25,
      },

      'high-protein': {
        protein: 40,
        carbs: 30,
        fat: 15,
        cuisinePreferences: ['Mediterranean', 'American'],
      },

      'quick-meals': {
        maxPrepTime: 15,
        maxCookTime: 20,
        difficultyLevel: 'easy',
      },

      'vegetarian-balanced': {
        dietaryRestrictions: ['Vegetarian'],
        protein: 20,
        carbs: 50,
        fat: 20,
        cuisinePreferences: ['Mediterranean', 'Indian', 'Italian'],
      },

      'keto-friendly': {
        dietaryRestrictions: ['Keto'],
        carbs: 10,
        protein: 25,
        fat: 35,
      },

      mediterranean: {
        cuisinePreferences: ['Mediterranean', 'Greek', 'Italian'],
        dietaryRestrictions: ['Mediterranean'],
        fat: 25,
      },

      'comfort-food': {
        cuisinePreferences: ['American', 'Italian'],
        calories: 650,
        difficultyLevel: 'medium',
      },
    };
  }

  /**
   * Extract preferences from user's nutrition profile
   */
  private extractPreferencesFromNutritionProfile(
    profile: NutritionProfile | undefined,
    mealCategory: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): MealPreferences {
    if (!profile) {
      return this.getCategoryDefaults(mealCategory);
    }

    // Estimate meal-specific nutrition targets from daily totals
    const mealFraction = this.getMealNutritionFraction(mealCategory);

    return {
      allergies: profile.allergies || [],
      dietaryRestrictions: profile.dietaryRestrictions || [],
      cuisinePreferences: profile.cuisinePreferences || [],
      calories: profile.dailyCalories
        ? Math.round(profile.dailyCalories * mealFraction)
        : undefined,
      protein: profile.macroProtein
        ? Math.round(profile.macroProtein * mealFraction)
        : undefined,
      carbs: profile.macroCarbs
        ? Math.round(profile.macroCarbs * mealFraction)
        : undefined,
      fat: profile.macroFat
        ? Math.round(profile.macroFat * mealFraction)
        : undefined,
      // goals property removed to match MealPreferences type
    };
  }

  /**
   * Get the typical fraction of daily nutrition that a meal category represents
   */
  private getMealNutritionFraction(
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): number {
    const fractions = {
      breakfast: 0.25, // 25% of daily calories
      lunch: 0.35, // 35% of daily calories
      dinner: 0.3, // 30% of daily calories
      snack: 0.1, // 10% of daily calories
    };

    return fractions[category];
  }

  /**
   * Merge two preference objects with the second taking priority
   */
  private mergeTwoPreferences(
    base: MealPreferences,
    override: MealPreferences,
    _category: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): MealPreferences {
    return {
      allergies: this.mergeArrayPreferences([
        base.allergies || [],
        override.allergies || [],
      ]),
      dietaryRestrictions: this.mergeArrayPreferences([
        base.dietaryRestrictions || [],
        override.dietaryRestrictions || [],
      ]),
      cuisinePreferences: this.mergeArrayPreferences([
        base.cuisinePreferences || [],
        override.cuisinePreferences || [],
      ]),
      maxPrepTime: override.maxPrepTime ?? base.maxPrepTime,
      maxCookTime: override.maxCookTime ?? base.maxCookTime,
      difficultyLevel: override.difficultyLevel ?? base.difficultyLevel,
      calories: override.calories ?? base.calories,
      protein: override.protein ?? base.protein,
      carbs: override.carbs ?? base.carbs,
      fat: override.fat ?? base.fat,
    };
  }

  /**
   * Merge multiple arrays of preferences, removing duplicates
   */
  private mergeArrayPreferences(arrays: string[][]): string[] {
    const merged = arrays.flat();
    return [...new Set(merged)]; // Remove duplicates
  }

  /**
   * Convert GenerateMealRequest to MealPreferences format
   */
  convertGenerateMealRequest(request: GenerateMealRequest): MealPreferences {
    return request.customPreferences || {};
  }

  /**
   * Check if preferences are significantly different from defaults
   */
  hasSignificantOverrides(
    preferences: MealPreferences,
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ): boolean {
    const defaults = this.getCategoryDefaults(category);

    // Check if any key values differ significantly from defaults
    const significantDifferences = [
      preferences.allergies && preferences.allergies.length > 0,
      preferences.dietaryRestrictions &&
        preferences.dietaryRestrictions.length > 0,
      preferences.cuisinePreferences &&
        preferences.cuisinePreferences.length > 0,
      preferences.maxPrepTime &&
        Math.abs(preferences.maxPrepTime - (defaults.maxPrepTime || 0)) > 10,
      preferences.maxCookTime &&
        Math.abs(preferences.maxCookTime - (defaults.maxCookTime || 0)) > 15,
      preferences.difficultyLevel &&
        preferences.difficultyLevel !== defaults.difficultyLevel,
      preferences.calories &&
        Math.abs(preferences.calories - (defaults.calories || 0)) > 100,
      preferences.protein &&
        Math.abs(preferences.protein - (defaults.protein || 0)) > 10,
      preferences.carbs &&
        Math.abs(preferences.carbs - (defaults.carbs || 0)) > 15,
      preferences.fat && Math.abs(preferences.fat - (defaults.fat || 0)) > 10,
    ];

    return significantDifferences.some(Boolean);
  }
}

// Export singleton instance
export const preferenceOverrideService = new PreferenceOverrideService();
