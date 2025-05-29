import { generateText } from 'ai';
import {
  Ingredient,
  Nutrition,
  Recipe,
  RecipeGenerationRequest,
} from '../../../types/recipe';

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

export const mockedGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>;

/**
 * Factory function to create mock recipes with customizable properties
 */
export const createMockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  name: 'Mock Recipe',
  description: 'A delicious mock recipe for testing purposes',
  ingredients: [
    { name: 'mock ingredient 1', quantity: 1, unit: 'cup' },
    { name: 'mock ingredient 2', quantity: 2, unit: 'tablespoons' },
  ],
  instructions: [
    'Prepare your ingredients',
    'Mix them together',
    'Cook until done',
    'Serve and enjoy',
  ],
  nutrition: {
    calories: 300,
    protein: 15,
    carbs: 30,
    fat: 10,
  },
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  difficulty: 'easy',
  mealType: 'lunch',
  ...overrides,
});

/**
 * Factory function to create mock ingredients
 */
export const createMockIngredient = (
  overrides: Partial<Ingredient> = {},
): Ingredient => ({
  name: 'mock ingredient',
  quantity: 1,
  unit: 'cup',
  ...overrides,
});

/**
 * Factory function to create mock nutrition data
 */
export const createMockNutrition = (
  overrides: Partial<Nutrition> = {},
): Nutrition => ({
  calories: 250,
  protein: 12,
  carbs: 25,
  fat: 8,
  ...overrides,
});

/**
 * Factory function to create mock recipe generation requests
 */
export const createMockRequest = (
  overrides: Partial<RecipeGenerationRequest> = {},
): RecipeGenerationRequest => ({
  mealType: 'lunch',
  ...overrides,
});

/**
 * Mock a successful AI response with a given recipe
 */
export const mockSuccessfulGeneration = (
  recipe: Recipe = createMockRecipe(),
) => {
  mockedGenerateText.mockResolvedValue({
    text: JSON.stringify(recipe),
    finishReason: 'stop',
    usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
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

/**
 * Mock a failed AI generation with a specific error
 */
export const mockFailedGeneration = (error: Error = new Error('API Error')) => {
  mockedGenerateText.mockRejectedValue(error);
};

/**
 * Mock an invalid JSON response from AI
 */
export const mockInvalidJsonResponse = () => {
  mockedGenerateText.mockResolvedValue({
    text: 'This is not valid JSON { invalid syntax',
    finishReason: 'stop',
    usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 },
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

/**
 * Mock a response with invalid schema (valid JSON but wrong structure)
 */
export const mockInvalidSchemaResponse = () => {
  mockedGenerateText.mockResolvedValue({
    text: JSON.stringify({
      invalidField: 'This does not match Recipe schema',
      anotherField: 'Missing required fields',
    }),
    finishReason: 'stop',
    usage: { promptTokens: 80, completionTokens: 15, totalTokens: 95 },
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

/**
 * Mock an empty response from AI
 */
export const mockEmptyResponse = () => {
  mockedGenerateText.mockResolvedValue({
    text: '',
    finishReason: 'stop',
    usage: { promptTokens: 30, completionTokens: 0, totalTokens: 30 },
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

/**
 * Mock a partial response (incomplete JSON)
 */
export const mockPartialResponse = () => {
  mockedGenerateText.mockResolvedValue({
    text: '{"name": "Partial Recipe", "description": "This JSON is cut off...',
    finishReason: 'length',
    usage: { promptTokens: 150, completionTokens: 100, totalTokens: 250 },
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

/**
 * Create a recipe with specific nutritional violations for testing validation
 */
export const createInvalidNutritionRecipe = (
  violation:
    | 'negative_calories'
    | 'zero_protein'
    | 'negative_fat' = 'negative_calories',
): Recipe => {
  const base = createMockRecipe();

  switch (violation) {
    case 'negative_calories':
      base.nutrition.calories = -100;
      break;
    case 'zero_protein':
      base.nutrition.protein = 0;
      break;
    case 'negative_fat':
      base.nutrition.fat = -5;
      break;
  }

  return base;
};

/**
 * Create a recipe with invalid structure for testing validation
 */
export const createInvalidStructureRecipe = (
  violation:
    | 'empty_ingredients'
    | 'empty_instructions'
    | 'missing_name' = 'empty_ingredients',
): Partial<Recipe> => {
  const base = createMockRecipe();

  switch (violation) {
    case 'empty_ingredients':
      base.ingredients = [];
      break;
    case 'empty_instructions':
      base.instructions = [];
      break;
    case 'missing_name':
      delete (base as any).name;
      break;
  }

  return base;
};

/**
 * Collection of predefined recipes for different meal types
 */
export const mockRecipeLibrary = {
  breakfast: createMockRecipe({
    name: 'Protein Scrambled Eggs',
    mealType: 'breakfast',
    nutrition: { calories: 350, protein: 25, carbs: 5, fat: 22 },
    ingredients: [
      { name: 'eggs', quantity: 3, unit: 'large' },
      { name: 'milk', quantity: 2, unit: 'tbsp' },
      { name: 'butter', quantity: 1, unit: 'tsp' },
    ],
    instructions: [
      'Beat eggs with milk',
      'Heat butter in pan',
      'Scramble eggs until fluffy',
    ],
    difficulty: 'easy',
    prepTime: 5,
    cookTime: 8,
  }),

  lunch: createMockRecipe({
    name: 'Mediterranean Quinoa Salad',
    mealType: 'lunch',
    nutrition: { calories: 450, protein: 18, carbs: 55, fat: 16 },
    ingredients: [
      { name: 'quinoa', quantity: 1, unit: 'cup' },
      { name: 'cucumber', quantity: 1, unit: 'medium' },
      { name: 'tomatoes', quantity: 2, unit: 'medium' },
      { name: 'feta cheese', quantity: 50, unit: 'grams' },
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Dice cucumber and tomatoes',
      'Mix all ingredients',
      'Season with olive oil and lemon',
    ],
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 15,
  }),

  dinner: createMockRecipe({
    name: 'Grilled Salmon with Vegetables',
    mealType: 'dinner',
    nutrition: { calories: 650, protein: 45, carbs: 25, fat: 35 },
    ingredients: [
      { name: 'salmon fillet', quantity: 200, unit: 'grams' },
      { name: 'broccoli', quantity: 1, unit: 'cup' },
      { name: 'sweet potato', quantity: 1, unit: 'medium' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' },
    ],
    instructions: [
      'Preheat grill to medium-high',
      'Season salmon with salt and pepper',
      'Grill salmon 4-5 minutes per side',
      'Steam vegetables until tender',
      'Serve together',
    ],
    difficulty: 'medium',
    prepTime: 10,
    cookTime: 20,
  }),

  snack: createMockRecipe({
    name: 'Greek Yogurt with Berries',
    mealType: 'snack',
    nutrition: { calories: 180, protein: 15, carbs: 20, fat: 4 },
    ingredients: [
      { name: 'Greek yogurt', quantity: 150, unit: 'grams' },
      { name: 'mixed berries', quantity: 0.5, unit: 'cup' },
      { name: 'honey', quantity: 1, unit: 'tsp' },
    ],
    instructions: [
      'Place yogurt in bowl',
      'Top with berries',
      'Drizzle with honey',
    ],
    difficulty: 'easy',
    prepTime: 2,
    cookTime: 0,
  }),
};

/**
 * Error scenarios for comprehensive testing
 */
export const mockErrorScenarios = {
  networkTimeout: () => mockFailedGeneration(new Error('ETIMEDOUT')),
  rateLimitExceeded: () =>
    mockFailedGeneration(new Error('Rate limit exceeded')),
  invalidApiKey: () => mockFailedGeneration(new Error('Invalid API key')),
  modelOverloaded: () =>
    mockFailedGeneration(new Error('Model is currently overloaded')),
  contentFilter: () => mockFailedGeneration(new Error('Content filtered')),
  serverError: () => mockFailedGeneration(new Error('Internal server error')),
};

/**
 * Utility to reset all mocks before each test
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockedGenerateText.mockReset();
};

/**
 * Utility to assert that a recipe meets basic requirements
 */
export const assertValidRecipeStructure = (recipe: Recipe) => {
  expect(recipe.name).toBeTruthy();
  expect(recipe.description).toBeTruthy();
  expect(recipe.ingredients).toHaveLength(expect.any(Number));
  expect(recipe.ingredients.length).toBeGreaterThan(0);
  expect(recipe.instructions).toHaveLength(expect.any(Number));
  expect(recipe.instructions.length).toBeGreaterThan(0);
  expect(recipe.nutrition.calories).toBeGreaterThan(0);
  expect(recipe.nutrition.protein).toBeGreaterThanOrEqual(0);
  expect(recipe.nutrition.carbs).toBeGreaterThanOrEqual(0);
  expect(recipe.nutrition.fat).toBeGreaterThanOrEqual(0);
  expect(recipe.prepTime).toBeGreaterThanOrEqual(0);
  expect(recipe.cookTime).toBeGreaterThanOrEqual(0);
  expect(recipe.servings).toBeGreaterThan(0);
  expect(['easy', 'medium', 'hard']).toContain(recipe.difficulty);
  expect(['breakfast', 'lunch', 'dinner', 'snack']).toContain(recipe.mealType);
};

/**
 * Utility to check if a recipe meets nutritional targets within tolerance
 */
export const assertNutritionalTargets = (
  recipe: Recipe,
  targets: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  },
  tolerance: number = 0.1, // 10% tolerance by default
) => {
  if (targets.calories) {
    const calorieRange = targets.calories * tolerance;
    expect(recipe.nutrition.calories).toBeGreaterThanOrEqual(
      targets.calories - calorieRange,
    );
    expect(recipe.nutrition.calories).toBeLessThanOrEqual(
      targets.calories + calorieRange,
    );
  }

  if (targets.protein) {
    expect(recipe.nutrition.protein).toBeGreaterThanOrEqual(targets.protein);
  }

  if (targets.carbs) {
    const carbRange = targets.carbs * tolerance;
    expect(recipe.nutrition.carbs).toBeGreaterThanOrEqual(
      targets.carbs - carbRange,
    );
    expect(recipe.nutrition.carbs).toBeLessThanOrEqual(
      targets.carbs + carbRange,
    );
  }

  if (targets.fat) {
    const fatRange = targets.fat * tolerance;
    expect(recipe.nutrition.fat).toBeGreaterThanOrEqual(targets.fat - fatRange);
    expect(recipe.nutrition.fat).toBeLessThanOrEqual(targets.fat + fatRange);
  }
};

/**
 * Utility to measure execution time of async functions
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
};

/**
 * Utility to create deterministic mock responses for specific test scenarios
 */
export const createDeterministicMockResponse = (scenario: string): Recipe => {
  // Use scenario string to create predictable but varied responses
  const hash = scenario.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const calories = 200 + Math.abs(hash % 600);
  const protein = 10 + Math.abs(hash % 40);

  return createMockRecipe({
    name: `Test Recipe ${Math.abs(hash % 100)}`,
    nutrition: {
      calories,
      protein,
      carbs: Math.abs(hash % 80),
      fat: Math.abs(hash % 30),
    },
    prepTime: 5 + Math.abs(hash % 25),
    cookTime: 10 + Math.abs(hash % 40),
  });
};
