import { RecipeGenerationRequest } from '../../../types/recipe';
import { PromptBuilderService } from '../prompt-builder';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  describe('buildRecipePrompt', () => {
    it('should return system and user prompts', () => {
      const request: RecipeGenerationRequest = { mealType: 'lunch' };
      const result = service.buildRecipePrompt(request);

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('user');
      expect(typeof result.system).toBe('string');
      expect(typeof result.user).toBe('string');
    });

    it('should include safety warnings for allergies', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'dinner',
        allergies: ['shellfish', 'peanuts'],
      };

      const result = service.buildRecipePrompt(request);

      expect(result.user).toContain('⚠️ CRITICAL - ALLERGIES TO AVOID');
      expect(result.user).toContain('ABSOLUTELY NO ingredients');
      expect(result.user).toContain('shellfish');
      expect(result.user).toContain('peanuts');
    });

    it('should include nutritional targets when provided', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'breakfast',
        calories: 400,
        protein: 25,
        carbs: 45,
        fat: 20,
      };

      const result = service.buildRecipePrompt(request);

      expect(result.user).toContain('Calories: ~400 kcal');
      expect(result.user).toContain('Protein: 25g or more');
      expect(result.user).toContain('Carbohydrates: ~45g');
      expect(result.user).toContain('Fat: ~20g');
    });

    it('should include dietary restrictions', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'lunch',
        dietaryRestrictions: ['vegan', 'gluten-free'],
      };

      const result = service.buildRecipePrompt(request);

      expect(result.user).toContain('Dietary Restrictions:');
      expect(result.user).toContain('vegan');
      expect(result.user).toContain('gluten-free');
    });

    it('should include cuisine preferences', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'dinner',
        cuisinePreferences: ['Italian', 'Mediterranean'],
      };

      const result = service.buildRecipePrompt(request);

      expect(result.user).toContain('Preferred Cuisines:');
      expect(result.user).toContain('Italian');
      expect(result.user).toContain('Mediterranean');
    });

    it('should include user profile context', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'dinner',
        userProfile: {
          goals: 'gain_muscle',
          activityLevel: 'very_active',
        },
      };

      const result = service.buildRecipePrompt(request);

      expect(result.user).toContain('User Context:');
      expect(result.user).toContain('Goal: gain_muscle');
      expect(result.user).toContain('Activity Level: very_active');
    });

    it('should include the correct meal type in JSON structure', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'snack',
      };

      const result = service.buildRecipePrompt(request);

      expect(result.user).toContain('"mealType": "snack"');
    });

    it('should handle empty arrays gracefully', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'breakfast',
        allergies: [],
        dietaryRestrictions: [],
        cuisinePreferences: [],
      };

      const result = service.buildRecipePrompt(request);

      // Should not include sections for empty arrays
      expect(result.user).not.toContain('ALLERGIES TO AVOID');
      expect(result.user).not.toContain('Dietary Restrictions:');
      expect(result.user).not.toContain('Preferred Cuisines:');
    });

    it('should prioritize allergies over other requirements', () => {
      const request: RecipeGenerationRequest = {
        mealType: 'lunch',
        allergies: ['nuts'],
        dietaryRestrictions: ['vegetarian'],
      };

      const result = service.buildRecipePrompt(request);

      // Allergies should appear before dietary restrictions in the prompt
      const allergyIndex = result.user.indexOf('ALLERGIES TO AVOID');
      const dietaryIndex = result.user.indexOf('Dietary Restrictions');

      expect(allergyIndex).toBeLessThan(dietaryIndex);
      expect(allergyIndex).toBeGreaterThan(-1);
      expect(dietaryIndex).toBeGreaterThan(-1);
    });
  });

  describe('getFewShotExamples', () => {
    it('should return valid example prompts and responses', () => {
      const examples = service.getFewShotExamples();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);

      examples.forEach(example => {
        expect(example).toHaveProperty('prompt');
        expect(example).toHaveProperty('response');
        expect(typeof example.prompt).toBe('string');
        expect(typeof example.response).toBe('string');

        // Validate that response is valid JSON
        expect(() => JSON.parse(example.response)).not.toThrow();
      });
    });

    it('should return examples with valid recipe structure', () => {
      const examples = service.getFewShotExamples();

      examples.forEach(example => {
        const recipe = JSON.parse(example.response);

        // Check required fields
        expect(recipe).toHaveProperty('name');
        expect(recipe).toHaveProperty('description');
        expect(recipe).toHaveProperty('ingredients');
        expect(recipe).toHaveProperty('instructions');
        expect(recipe).toHaveProperty('nutrition');
        expect(recipe).toHaveProperty('prepTime');
        expect(recipe).toHaveProperty('cookTime');
        expect(recipe).toHaveProperty('servings');
        expect(recipe).toHaveProperty('difficulty');
        expect(recipe).toHaveProperty('mealType');

        // Check types
        expect(typeof recipe.name).toBe('string');
        expect(typeof recipe.description).toBe('string');
        expect(Array.isArray(recipe.ingredients)).toBe(true);
        expect(Array.isArray(recipe.instructions)).toBe(true);
        expect(typeof recipe.nutrition).toBe('object');
        expect(typeof recipe.prepTime).toBe('number');
        expect(typeof recipe.cookTime).toBe('number');
        expect(typeof recipe.servings).toBe('number');
        expect(typeof recipe.difficulty).toBe('string');
        expect(typeof recipe.mealType).toBe('string');

        // Check nutrition object
        expect(recipe.nutrition).toHaveProperty('calories');
        expect(recipe.nutrition).toHaveProperty('protein');
        expect(recipe.nutrition).toHaveProperty('carbs');
        expect(recipe.nutrition).toHaveProperty('fat');

        // Check that arrays are not empty
        expect(recipe.ingredients.length).toBeGreaterThan(0);
        expect(recipe.instructions.length).toBeGreaterThan(0);

        // Check ingredient structure
        recipe.ingredients.forEach((ingredient: any) => {
          expect(ingredient).toHaveProperty('name');
          expect(ingredient).toHaveProperty('quantity');
          expect(ingredient).toHaveProperty('unit');
          expect(typeof ingredient.name).toBe('string');
          expect(typeof ingredient.quantity).toBe('number');
          expect(typeof ingredient.unit).toBe('string');
        });
      });
    });

    it('should return examples with realistic nutritional values', () => {
      const examples = service.getFewShotExamples();

      examples.forEach(example => {
        const recipe = JSON.parse(example.response);
        const nutrition = recipe.nutrition;

        // Check that nutritional values are positive
        expect(nutrition.calories).toBeGreaterThan(0);
        expect(nutrition.protein).toBeGreaterThan(0);
        expect(nutrition.carbs).toBeGreaterThanOrEqual(0);
        expect(nutrition.fat).toBeGreaterThanOrEqual(0);

        // Check realistic ranges for a single serving
        expect(nutrition.calories).toBeLessThan(2000); // Reasonable upper limit
        expect(nutrition.protein).toBeLessThan(100); // Reasonable upper limit
        expect(nutrition.carbs).toBeLessThan(200); // Reasonable upper limit
        expect(nutrition.fat).toBeLessThan(100); // Reasonable upper limit
      });
    });

    it('should return examples with valid difficulty levels', () => {
      const examples = service.getFewShotExamples();
      const validDifficulties = ['easy', 'medium', 'hard'];

      examples.forEach(example => {
        const recipe = JSON.parse(example.response);
        expect(validDifficulties).toContain(recipe.difficulty);
      });
    });

    it('should return examples with valid meal types', () => {
      const examples = service.getFewShotExamples();
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

      examples.forEach(example => {
        const recipe = JSON.parse(example.response);
        expect(validMealTypes).toContain(recipe.mealType);
      });
    });
  });

  describe('buildSystemPrompt', () => {
    it('should contain essential instructions for AI', () => {
      const request: RecipeGenerationRequest = { mealType: 'lunch' };
      const result = service.buildRecipePrompt(request);

      // Key instructions should be present
      expect(result.system).toContain('professional chef');
      expect(result.system).toContain('nutritionist');
      expect(result.system).toContain('dietary restrictions');
      expect(result.system).toContain('allergies');
      expect(result.system).toContain('JSON format');
      expect(result.system).toContain('NEVER include ingredients');
    });

    it('should emphasize safety for allergies and restrictions', () => {
      const request: RecipeGenerationRequest = { mealType: 'lunch' };
      const result = service.buildRecipePrompt(request);

      expect(result.system).toContain('this is critical for safety');
      expect(result.system).toContain(
        'NEVER include ingredients that conflict',
      );
    });
  });

  describe('prompt length limits', () => {
    it('should handle requests with many allergies without excessive length', () => {
      const manyAllergies = [
        'dairy',
        'eggs',
        'fish',
        'shellfish',
        'tree nuts',
        'peanuts',
        'wheat',
        'soy',
        'sesame',
        'sulfites',
        'mustard',
        'celery',
      ];

      const request: RecipeGenerationRequest = {
        mealType: 'dinner',
        allergies: manyAllergies,
      };

      const result = service.buildRecipePrompt(request);

      // Prompt should be reasonable length (less than 4000 characters)
      expect(result.user.length).toBeLessThan(4000);
      expect(result.system.length).toBeLessThan(2000);

      // All allergies should still be included
      manyAllergies.forEach(allergy => {
        expect(result.user).toContain(allergy);
      });
    });

    it('should handle complex requests with all parameters', () => {
      const complexRequest: RecipeGenerationRequest = {
        mealType: 'dinner',
        calories: 600,
        protein: 40,
        carbs: 50,
        fat: 25,
        allergies: ['nuts', 'dairy', 'shellfish'],
        dietaryRestrictions: ['gluten-free', 'low-sodium'],
        cuisinePreferences: ['Mediterranean', 'Italian'],
        userProfile: {
          age: 30,
          weight: 70,
          height: 175,
          activityLevel: 'moderately_active',
          goals: 'gain_muscle',
        },
      };

      const result = service.buildRecipePrompt(complexRequest);

      // Should handle complexity without becoming too long
      expect(result.user.length).toBeLessThan(5000);
      expect(result.system.length).toBeLessThan(2000);

      // Should include all parameters
      expect(result.user).toContain('600');
      expect(result.user).toContain('nuts');
      expect(result.user).toContain('gluten-free');
      expect(result.user).toContain('Mediterranean');
      expect(result.user).toContain('gain_muscle');
    });
  });
});
