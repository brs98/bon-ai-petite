import { RecipeGenerationRequest } from '../../../types/recipe';
import { PromptBuilderService } from '../prompt-builder';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  // Remove all tests for buildRecipePrompt (deprecated/removed)

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
      // Pass [] for recentRecipes in tests
      const result = service.buildMarkdownAlignedPrompt(request, undefined, []);

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
      // Pass [] for recentRecipes in tests
      const result = service.buildMarkdownAlignedPrompt(request, undefined, []);

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

      // Pass [] for recentRecipes in tests
      const result = service.buildMarkdownAlignedPrompt(request, undefined, []);

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

      // Pass [] for recentRecipes in tests
      const result = service.buildMarkdownAlignedPrompt(
        complexRequest,
        undefined,
        [],
      );

      // Should handle complexity without becoming too long
      expect(result.user.length).toBeLessThan(5000);
      expect(result.system.length).toBeLessThan(2000);

      // Should include all parameters
      expect(result.user).toContain('600');
      expect(result.user).toContain('nuts');
      expect(result.user).toContain('gluten-free');
      expect(result.user).toContain('Mediterranean');
      expect(result.user).toContain('gain muscle');
    });
  });
});
