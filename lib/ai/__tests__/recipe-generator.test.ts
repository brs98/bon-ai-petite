import { generateText } from 'ai';
import { RecipeGeneratorService } from '../recipe-generator';

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
  generateObject: jest.fn(),
}));

const mockedGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>;

// Test utilities for creating mock recipes
const createMockRecipe = (overrides = {}) => ({
  name: 'Mock Recipe',
  description: 'A mock recipe for testing',
  ingredients: [{ name: 'mock ingredient', quantity: 1, unit: 'cup' }],
  instructions: ['Mock instruction 1', 'Mock instruction 2'],
  nutrition: {
    calories: 300,
    protein: 15,
    carbs: 30,
    fat: 10,
  },
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  difficulty: 'easy' as const,
  mealType: 'lunch' as const,
  ...overrides,
});

const mockSuccessfulGeneration = (recipe = createMockRecipe()) => {
  mockedGenerateText.mockResolvedValue({
    text: JSON.stringify(recipe),
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    response: { headers: {}, body: {} },
    toolCalls: [],
    toolResults: [],
    reasoning: undefined,
    reasoningDetails: undefined,
    sources: [],
    files: [],
    warnings: undefined,
  } as any);
};

const mockFailedGeneration = (error = new Error('API Error')) => {
  mockedGenerateText.mockRejectedValue(error);
};

const mockInvalidJsonResponse = () => {
  mockedGenerateText.mockResolvedValue({
    text: 'invalid json response',
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    response: { headers: {}, body: {} },
    toolCalls: [],
    toolResults: [],
    reasoning: undefined,
    reasoningDetails: undefined,
    sources: [],
    files: [],
    warnings: undefined,
  } as any);
};

const mockInvalidSchemaResponse = () => {
  mockedGenerateText.mockResolvedValue({
    text: JSON.stringify({ invalid: 'schema' }),
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    response: { headers: {}, body: {} },
    toolCalls: [],
    toolResults: [],
    reasoning: undefined,
    reasoningDetails: undefined,
    sources: [],
    files: [],
    warnings: undefined,
  } as any);
};

describe('RecipeGeneratorService', () => {
  let service: RecipeGeneratorService;

  beforeEach(() => {
    // Ensure OPENAI_API_KEY is set for each test
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('constructor', () => {
    it('should throw error when OPENAI_API_KEY is missing', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new RecipeGeneratorService()).toThrow(
        'OPENAI_API_KEY environment variable is required',
      );
    });

    it('should initialize successfully with valid API key', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      expect(() => new RecipeGeneratorService()).not.toThrow();
    });
  });

  describe('buildPrompt', () => {
    beforeEach(() => {
      service = new RecipeGeneratorService();
    });

    it('should include nutritional targets in prompt', () => {
      const request = {
        mealType: 'dinner' as const,
        calories: 600,
        protein: 30,
        carbs: 45,
        fat: 20,
      };

      // Use reflection to access private method for testing
      const prompt = (service as any).buildPrompt(request);

      expect(prompt).toContain('Target calories: 600');
      expect(prompt).toContain('Protein: at least 30g');
      expect(prompt).toContain('Carbohydrates: around 45g');
      expect(prompt).toContain('Fat: around 20g');
    });

    it('should prioritize allergies in prompt', () => {
      const request = {
        mealType: 'breakfast' as const,
        allergies: ['nuts', 'dairy'],
      };

      const prompt = (service as any).buildPrompt(request);

      expect(prompt).toContain('MUST AVOID (allergies): nuts, dairy');
    });

    it('should include dietary restrictions', () => {
      const request = {
        mealType: 'lunch' as const,
        dietaryRestrictions: ['vegan', 'gluten-free'],
      };

      const prompt = (service as any).buildPrompt(request);

      expect(prompt).toContain('Dietary restrictions: vegan, gluten-free');
    });

    it('should include user profile context', () => {
      const request = {
        mealType: 'dinner' as const,
        userProfile: {
          goals: 'gain_muscle',
        },
      };

      const prompt = (service as any).buildPrompt(request);

      expect(prompt).toContain('User goal: gain_muscle');
    });

    it('should include meal type in JSON structure requirement', () => {
      const request = {
        mealType: 'snack' as const,
      };

      const prompt = (service as any).buildPrompt(request);

      expect(prompt).toContain('"mealType": "snack"');
    });
  });

  describe('generateRecipe', () => {
    beforeEach(() => {
      service = new RecipeGeneratorService();
    });

    it('should return valid recipe schema', async () => {
      // Mock successful AI response with correct mealType
      const mockResponse = createMockRecipe({
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [{ name: 'egg', quantity: 2, unit: 'whole' }],
        instructions: ['Cook the egg'],
        nutrition: { calories: 150, protein: 12, carbs: 1, fat: 10 },
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        difficulty: 'easy' as const,
        mealType: 'breakfast' as const,
      });

      mockSuccessfulGeneration(mockResponse);

      const result = await service.generateRecipe({
        mealType: 'breakfast',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid JSON response', async () => {
      mockInvalidJsonResponse();

      await expect(
        service.generateRecipe({
          mealType: 'breakfast',
        }),
      ).rejects.toThrow('Invalid JSON response from AI service');
    });

    it('should handle schema validation errors', async () => {
      mockInvalidSchemaResponse();

      await expect(
        service.generateRecipe({
          mealType: 'breakfast',
        }),
      ).rejects.toThrow('Recipe validation failed');
    });

    it('should handle API errors gracefully', async () => {
      mockFailedGeneration(new Error('Network timeout'));

      await expect(
        service.generateRecipe({
          mealType: 'lunch',
        }),
      ).rejects.toThrow('Failed to generate recipe');
    });

    it('should validate required nutrition values are positive', async () => {
      const invalidRecipe = createMockRecipe({
        nutrition: {
          calories: -100, // Invalid negative calories
          protein: 10,
          carbs: 20,
          fat: 5,
        },
        mealType: 'dinner' as const,
      });

      mockSuccessfulGeneration(invalidRecipe);

      await expect(
        service.generateRecipe({
          mealType: 'dinner',
        }),
      ).rejects.toThrow('Recipe validation failed');
    });

    it('should validate ingredients array is not empty', async () => {
      const invalidRecipe = createMockRecipe({
        ingredients: [], // Invalid empty ingredients
        mealType: 'dinner' as const,
      });

      mockSuccessfulGeneration(invalidRecipe);

      await expect(
        service.generateRecipe({
          mealType: 'dinner',
        }),
      ).rejects.toThrow('Recipe validation failed');
    });

    it('should validate instructions array is not empty', async () => {
      const invalidRecipe = createMockRecipe({
        instructions: [], // Invalid empty instructions
        mealType: 'dinner' as const,
      });

      mockSuccessfulGeneration(invalidRecipe);

      await expect(
        service.generateRecipe({
          mealType: 'dinner',
        }),
      ).rejects.toThrow('Recipe validation failed');
    });
  });
});
