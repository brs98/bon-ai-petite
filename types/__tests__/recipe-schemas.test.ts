import {
  IngredientSchema,
  NutritionProfileSchema,
  NutritionSchema,
  RecipeFeedbackSchema,
  RecipeGenerationRequestSchema,
  RecipeSchema,
  type NutritionProfile,
  type Recipe,
  type RecipeGenerationRequest,
} from '../recipe';

describe('Recipe Schemas', () => {
  describe('RecipeSchema', () => {
    const validRecipe = {
      name: 'Test Recipe',
      description: 'A delicious test recipe',
      ingredients: [
        { name: 'flour', quantity: 2, unit: 'cups' },
        { name: 'eggs', quantity: 3, unit: 'whole' },
      ],
      instructions: ['Mix ingredients', 'Cook for 20 minutes'],
      nutrition: {
        calories: 300,
        protein: 10,
        carbs: 45,
        fat: 8,
      },
      prepTime: 15,
      cookTime: 25,
      servings: 4,
      difficulty: 'medium' as const,
      mealType: 'dinner' as const,
    };

    it('should validate complete recipe object', () => {
      expect(() => RecipeSchema.parse(validRecipe)).not.toThrow();

      const parsed = RecipeSchema.parse(validRecipe);
      expect(parsed).toEqual(validRecipe);
    });

    it('should accept optional fields', () => {
      const recipeWithOptionals = {
        ...validRecipe,
        id: 123,
        cuisineType: 'Italian',
        tags: ['healthy', 'quick'],
        isSaved: true,
        rating: 4.5,
        userId: 456,
        createdAt: new Date(),
      };

      expect(() => RecipeSchema.parse(recipeWithOptionals)).not.toThrow();
    });

    it('should reject recipe with missing required fields', () => {
      const incompleteRecipe = {
        name: 'Incomplete Recipe',
        // Missing other required fields
      };

      expect(() => RecipeSchema.parse(incompleteRecipe)).toThrow();
    });

    it('should reject recipe with empty name', () => {
      const invalidRecipe = {
        ...validRecipe,
        name: '',
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow(
        'Recipe name is required',
      );
    });

    it('should reject recipe with empty description', () => {
      const invalidRecipe = {
        ...validRecipe,
        description: '',
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow(
        'Recipe description is required',
      );
    });

    it('should reject recipe with empty ingredients array', () => {
      const invalidRecipe = {
        ...validRecipe,
        ingredients: [],
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow(
        'At least one ingredient is required',
      );
    });

    it('should reject recipe with empty instructions array', () => {
      const invalidRecipe = {
        ...validRecipe,
        instructions: [],
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow(
        'At least one instruction is required',
      );
    });

    it('should reject recipe with invalid nutrition values', () => {
      const invalidRecipe = {
        ...validRecipe,
        nutrition: {
          calories: -100, // Invalid negative calories
          protein: 10,
          carbs: 20,
          fat: 5,
        },
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should reject recipe with zero or negative calories', () => {
      const invalidRecipe = {
        ...validRecipe,
        nutrition: {
          ...validRecipe.nutrition,
          calories: 0,
        },
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should accept zero values for protein, carbs, and fat', () => {
      const recipeWithZeros = {
        ...validRecipe,
        nutrition: {
          calories: 100,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      };

      expect(() => RecipeSchema.parse(recipeWithZeros)).not.toThrow();
    });

    it('should reject negative prep time', () => {
      const invalidRecipe = {
        ...validRecipe,
        prepTime: -5,
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should reject negative cook time', () => {
      const invalidRecipe = {
        ...validRecipe,
        cookTime: -10,
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should reject zero or negative servings', () => {
      const invalidRecipe = {
        ...validRecipe,
        servings: 0,
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should reject invalid difficulty level', () => {
      const invalidRecipe = {
        ...validRecipe,
        difficulty: 'impossible' as any,
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should reject invalid meal type', () => {
      const invalidRecipe = {
        ...validRecipe,
        mealType: 'midnight_snack' as any,
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should validate ingredient structure', () => {
      const invalidRecipe = {
        ...validRecipe,
        ingredients: [
          { name: 'flour', quantity: -1, unit: 'cups' }, // Invalid negative quantity
        ],
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should reject invalid rating values', () => {
      const invalidRecipe = {
        ...validRecipe,
        rating: 6, // Rating should be between 1 and 5
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should accept valid rating values', () => {
      const recipeWithRating = {
        ...validRecipe,
        rating: 3.5,
      };

      expect(() => RecipeSchema.parse(recipeWithRating)).not.toThrow();
    });
  });

  describe('RecipeGenerationRequestSchema', () => {
    it('should validate generation request with only meal type', () => {
      const validRequest = {
        mealType: 'breakfast' as const,
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(validRequest),
      ).not.toThrow();
    });

    it('should validate complete generation request', () => {
      const validRequest = {
        mealType: 'breakfast' as const,
        calories: 400,
        protein: 25,
        carbs: 45,
        fat: 15,
        allergies: ['nuts'],
        dietaryRestrictions: ['vegetarian'],
        cuisinePreferences: ['Italian'],
        userProfile: {
          age: 30,
          weight: 70,
          height: 175,
          activityLevel: 'moderately_active',
          goals: 'gain_muscle',
        },
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(validRequest),
      ).not.toThrow();
    });

    it('should reject invalid meal type', () => {
      const invalidRequest = {
        mealType: 'invalid_meal' as any,
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(invalidRequest),
      ).toThrow();
    });

    it('should reject negative nutritional values', () => {
      const invalidRequest = {
        mealType: 'lunch' as const,
        calories: -500,
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(invalidRequest),
      ).toThrow();
    });

    it('should accept zero nutritional values', () => {
      const validRequest = {
        mealType: 'snack' as const,
        protein: 0,
        carbs: 0,
        fat: 0,
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(validRequest),
      ).not.toThrow();
    });

    it('should validate user profile structure', () => {
      const requestWithInvalidProfile = {
        mealType: 'dinner' as const,
        userProfile: {
          age: -25, // Invalid negative age
        },
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(requestWithInvalidProfile),
      ).toThrow();
    });

    it('should accept empty arrays for optional array fields', () => {
      const validRequest = {
        mealType: 'lunch' as const,
        allergies: [],
        dietaryRestrictions: [],
        cuisinePreferences: [],
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(validRequest),
      ).not.toThrow();
    });
  });

  describe('NutritionProfileSchema', () => {
    const validProfile = {
      userId: 123,
      age: 30,
      height: 175,
      weight: 70,
      activityLevel: 'moderately_active' as const,
      goals: ['maintain_weight'],
      dailyCalories: 2000,
      macroProtein: 150,
      macroCarbs: 200,
      macroFat: 65,
      allergies: ['nuts'],
      dietaryRestrictions: ['vegetarian'],
      cuisinePreferences: ['Mediterranean'],
    };

    it('should validate complete nutrition profile', () => {
      expect(() => NutritionProfileSchema.parse(validProfile)).not.toThrow();
    });

    it('should require userId', () => {
      const invalidProfile = {
        ...validProfile,
      };
      delete (invalidProfile as any).userId;

      expect(() => NutritionProfileSchema.parse(invalidProfile)).toThrow();
    });

    it('should reject negative physical measurements', () => {
      const invalidProfile = {
        ...validProfile,
        weight: -70,
      };

      expect(() => NutritionProfileSchema.parse(invalidProfile)).toThrow();
    });

    it('should reject invalid activity level', () => {
      const invalidProfile = {
        ...validProfile,
        activityLevel: 'couch_potato' as any,
      };

      expect(() => NutritionProfileSchema.parse(invalidProfile)).toThrow();
    });

    it('should reject invalid goals', () => {
      const invalidProfile = {
        ...validProfile,
        goals: ['become_superhuman'] as any,
      };

      expect(() => NutritionProfileSchema.parse(invalidProfile)).toThrow();
    });

    it('should validate with minimal required fields', () => {
      const minimalProfile = {
        userId: 456,
      };

      expect(() => NutritionProfileSchema.parse(minimalProfile)).not.toThrow();
    });
  });

  describe('RecipeFeedbackSchema', () => {
    const validFeedback = {
      recipeId: 123,
      userId: 456,
      liked: true,
      feedback: 'Great recipe!',
      reportedIssues: ['too_salty'],
    };

    it('should validate complete feedback', () => {
      expect(() => RecipeFeedbackSchema.parse(validFeedback)).not.toThrow();
    });

    it('should require recipeId and userId', () => {
      const invalidFeedback = {
        liked: true,
      };

      expect(() => RecipeFeedbackSchema.parse(invalidFeedback)).toThrow();
    });

    it('should require liked boolean', () => {
      const invalidFeedback = {
        recipeId: 123,
        userId: 456,
      };

      expect(() => RecipeFeedbackSchema.parse(invalidFeedback)).toThrow();
    });

    it('should accept minimal feedback', () => {
      const minimalFeedback = {
        recipeId: 789,
        userId: 101,
        liked: false,
      };

      expect(() => RecipeFeedbackSchema.parse(minimalFeedback)).not.toThrow();
    });
  });

  describe('IngredientSchema', () => {
    it('should validate complete ingredient', () => {
      const validIngredient = {
        name: 'flour',
        quantity: 2.5,
        unit: 'cups',
      };

      expect(() => IngredientSchema.parse(validIngredient)).not.toThrow();
    });

    it('should reject negative quantity', () => {
      const invalidIngredient = {
        name: 'salt',
        quantity: -1,
        unit: 'tsp',
      };

      expect(() => IngredientSchema.parse(invalidIngredient)).toThrow();
    });

    it('should reject zero quantity', () => {
      const invalidIngredient = {
        name: 'pepper',
        quantity: 0,
        unit: 'tsp',
      };

      expect(() => IngredientSchema.parse(invalidIngredient)).toThrow();
    });

    it('should require all fields', () => {
      const incompleteIngredient = {
        name: 'sugar',
        quantity: 1,
        // Missing unit
      };

      expect(() => IngredientSchema.parse(incompleteIngredient)).toThrow();
    });
  });

  describe('NutritionSchema', () => {
    it('should validate complete nutrition info', () => {
      const validNutrition = {
        calories: 350,
        protein: 25,
        carbs: 40,
        fat: 15,
        fiber: 8,
        sugar: 5,
        sodium: 300,
      };

      expect(() => NutritionSchema.parse(validNutrition)).not.toThrow();
    });

    it('should require positive calories', () => {
      const invalidNutrition = {
        calories: 0,
        protein: 10,
        carbs: 20,
        fat: 5,
      };

      expect(() => NutritionSchema.parse(invalidNutrition)).toThrow();
    });

    it('should accept zero values for optional nutrients', () => {
      const validNutrition = {
        calories: 200,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };

      expect(() => NutritionSchema.parse(validNutrition)).not.toThrow();
    });

    it('should reject negative values for any nutrient', () => {
      const invalidNutrition = {
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: -5, // Invalid negative fat
      };

      expect(() => NutritionSchema.parse(invalidNutrition)).toThrow();
    });

    it('should validate with only required fields', () => {
      const minimalNutrition = {
        calories: 250,
        protein: 15,
        carbs: 30,
        fat: 10,
      };

      expect(() => NutritionSchema.parse(minimalNutrition)).not.toThrow();
    });
  });

  describe('Schema type inference', () => {
    it('should correctly infer Recipe type', () => {
      const recipe: Recipe = {
        name: 'Type Test Recipe',
        description: 'Testing type inference',
        ingredients: [{ name: 'test', quantity: 1, unit: 'cup' }],
        instructions: ['Test instruction'],
        nutrition: { calories: 100, protein: 5, carbs: 15, fat: 3 },
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        difficulty: 'easy',
        mealType: 'snack',
      };

      expect(recipe.name).toBe('Type Test Recipe');
      expect(recipe.difficulty).toBe('easy');
      expect(recipe.mealType).toBe('snack');
    });

    it('should correctly infer RecipeGenerationRequest type', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'breakfast',
        calories: 400,
        allergies: ['dairy'],
      };

      expect(request.mealType).toBe('breakfast');
      expect(request.calories).toBe(400);
      expect(request.allergies).toEqual(['dairy']);
    });

    it('should correctly infer NutritionProfile type', () => {
      const profile: NutritionProfile = {
        userId: 123,
        age: 30,
        weight: 180,
        height: 70,
        gender: 'male',
        activityLevel: 'very_active',
        goals: ['gain_muscle'],
      };

      expect(profile.userId).toBe(123);
      expect(profile.activityLevel).toBe('very_active');
      expect(profile.goals).toEqual(['gain_muscle']);
    });
  });

  describe('Edge cases and boundary values', () => {
    it('should handle very large nutritional values', () => {
      const extremeRecipe = {
        name: 'Extreme Recipe',
        description: 'Testing extreme values',
        ingredients: [{ name: 'mega food', quantity: 1000, unit: 'tons' }],
        instructions: ['Handle with care'],
        nutrition: {
          calories: 999999,
          protein: 50000,
          carbs: 100000,
          fat: 25000,
        },
        prepTime: 0,
        cookTime: 0,
        servings: 1000,
        difficulty: 'hard' as const,
        mealType: 'dinner' as const,
      };

      expect(() => RecipeSchema.parse(extremeRecipe)).not.toThrow();
    });

    it('should handle decimal values for nutrition', () => {
      const decimalRecipe = {
        name: 'Decimal Recipe',
        description: 'Testing decimal nutrition values',
        ingredients: [
          { name: 'precise ingredient', quantity: 0.5, unit: 'cups' },
        ],
        instructions: ['Be precise'],
        nutrition: {
          calories: 123.45,
          protein: 12.7,
          carbs: 15.3,
          fat: 8.9,
        },
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        difficulty: 'easy' as const,
        mealType: 'snack' as const,
      };

      expect(() => RecipeSchema.parse(decimalRecipe)).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const longStringRecipe = {
        name: longString,
        description: longString,
        ingredients: [{ name: longString, quantity: 1, unit: longString }],
        instructions: [longString],
        nutrition: { calories: 100, protein: 10, carbs: 10, fat: 5 },
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        difficulty: 'medium' as const,
        mealType: 'lunch' as const,
      };

      expect(() => RecipeSchema.parse(longStringRecipe)).not.toThrow();
    });
  });
});
