# 🧪 AI Testing Strategy & Documentation

This document outlines the comprehensive testing approach for the AI-powered
recipe generation system built with OpenAI and the AI SDK.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Pyramid](#testing-pyramid)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Mock Testing Strategy](#mock-testing-strategy)
- [Error Handling Tests](#error-handling-tests)
- [Performance Tests](#performance-tests)
- [Security Tests](#security-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Manual Testing Checklist](#manual-testing-checklist)
- [Test Data & Fixtures](#test-data--fixtures)
- [CI/CD Integration](#cicd-integration)

---

## 🔍 Overview

The AI testing strategy focuses on ensuring:

- **Reliability**: AI responses are consistent and valid
- **Safety**: Dietary restrictions and allergies are respected
- **Performance**: API calls are optimized and cached appropriately
- **Error Resilience**: Graceful handling of AI service failures
- **Security**: API keys and user data are protected

---

## 🏗️ Testing Pyramid

```
        E2E Tests (5%)
       /              \
    Integration Tests (25%)
   /                      \
  Unit Tests (70%)
```

### Test Distribution:

- **Unit Tests (70%)**: Service logic, validation, utility functions
- **Integration Tests (25%)**: AI API interactions, database operations
- **E2E Tests (5%)**: Complete user workflows

---

## 🔧 Unit Tests

### Core AI Services

#### `RecipeGeneratorService`

```typescript
describe('RecipeGeneratorService', () => {
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
    it('should include nutritional targets in prompt', () => {
      const request = {
        mealType: 'dinner' as const,
        calories: 600,
        protein: 30,
        carbs: 45,
        fat: 20,
      };

      const prompt = service.buildPrompt(request);

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

      const prompt = service.buildPrompt(request);

      expect(prompt).toContain('MUST AVOID (allergies): nuts, dairy');
    });

    it('should include dietary restrictions', () => {
      const request = {
        mealType: 'lunch' as const,
        dietaryRestrictions: ['vegan', 'gluten-free'],
      };

      const prompt = service.buildPrompt(request);

      expect(prompt).toContain('Dietary restrictions: vegan, gluten-free');
    });

    it('should include user profile context', () => {
      const request = {
        mealType: 'dinner' as const,
        userProfile: {
          goals: 'gain_muscle',
          activityLevel: 'very_active',
        },
      };

      const prompt = service.buildPrompt(request);

      expect(prompt).toContain('User goal: gain_muscle');
    });
  });

  describe('generateRecipe', () => {
    it('should return valid recipe schema', async () => {
      // Mock successful AI response
      const mockResponse = {
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
      };

      jest.spyOn(generateText, 'generateText').mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await service.generateRecipe({
        mealType: 'breakfast',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid JSON response', async () => {
      jest.spyOn(generateText, 'generateText').mockResolvedValue({
        text: 'invalid json',
      });

      await expect(
        service.generateRecipe({
          mealType: 'breakfast',
        }),
      ).rejects.toThrow('Invalid JSON response from AI service');
    });

    it('should handle schema validation errors', async () => {
      jest.spyOn(generateText, 'generateText').mockResolvedValue({
        text: JSON.stringify({ invalid: 'schema' }),
      });

      await expect(
        service.generateRecipe({
          mealType: 'breakfast',
        }),
      ).rejects.toThrow('Recipe validation failed');
    });
  });
});
```

#### `PromptBuilderService`

```typescript
describe('PromptBuilderService', () => {
  describe('buildRecipePrompt', () => {
    it('should return system and user prompts', () => {
      const request = { mealType: 'lunch' as const };
      const result = service.buildRecipePrompt(request);

      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('user');
      expect(typeof result.system).toBe('string');
      expect(typeof result.user).toBe('string');
    });

    it('should include safety warnings for allergies', () => {
      const request = {
        mealType: 'dinner' as const,
        allergies: ['shellfish', 'peanuts'],
      };

      const result = service.buildRecipePrompt(request);

      expect(result.user).toContain('⚠️ CRITICAL - ALLERGIES TO AVOID');
      expect(result.user).toContain('ABSOLUTELY NO ingredients');
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
  });
});
```

### Schema Validation Tests

```typescript
describe('Recipe Schemas', () => {
  describe('RecipeSchema', () => {
    it('should validate complete recipe object', () => {
      const validRecipe = {
        name: 'Test Recipe',
        description: 'A delicious test recipe',
        ingredients: [{ name: 'flour', quantity: 2, unit: 'cups' }],
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

      expect(() => RecipeSchema.parse(validRecipe)).not.toThrow();
    });

    it('should reject recipe with missing required fields', () => {
      const invalidRecipe = {
        name: 'Incomplete Recipe',
        // Missing other required fields
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });

    it('should reject recipe with invalid nutrition values', () => {
      const invalidRecipe = {
        name: 'Test Recipe',
        description: 'Test',
        ingredients: [{ name: 'test', quantity: 1, unit: 'cup' }],
        instructions: ['test'],
        nutrition: {
          calories: -100, // Invalid negative calories
          protein: 10,
          carbs: 20,
          fat: 5,
        },
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        difficulty: 'easy' as const,
        mealType: 'lunch' as const,
      };

      expect(() => RecipeSchema.parse(invalidRecipe)).toThrow();
    });
  });

  describe('RecipeGenerationRequestSchema', () => {
    it('should validate generation request', () => {
      const validRequest = {
        mealType: 'breakfast' as const,
        calories: 400,
        protein: 25,
        allergies: ['nuts'],
        dietaryRestrictions: ['vegetarian'],
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(validRequest),
      ).not.toThrow();
    });

    it('should reject invalid meal type', () => {
      const invalidRequest = {
        mealType: 'invalid_meal', // Invalid meal type
      };

      expect(() =>
        RecipeGenerationRequestSchema.parse(invalidRequest),
      ).toThrow();
    });
  });
});
```

---

## 🔗 Integration Tests

### OpenAI API Integration

```typescript
describe('OpenAI Integration', () => {
  beforeEach(() => {
    // Use test API key or mock in CI
    process.env.OPENAI_API_KEY = process.env.TEST_OPENAI_API_KEY || 'test-key';
  });

  describe('Recipe Generation with Real API', () => {
    it('should generate valid recipe from OpenAI', async () => {
      // Skip in CI without real API key
      if (!process.env.TEST_OPENAI_API_KEY) {
        test.skip();
      }

      const request = {
        mealType: 'breakfast' as const,
        calories: 350,
        protein: 20,
      };

      const recipe = await recipeGenerator.generateRecipe(request);

      expect(recipe).toBeDefined();
      expect(recipe.name).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.instructions.length).toBeGreaterThan(0);
      expect(recipe.nutrition.calories).toBeCloseTo(350, 50); // Within 50 calories
      expect(recipe.nutrition.protein).toBeGreaterThanOrEqual(20);
    });

    it('should respect dietary restrictions', async () => {
      if (!process.env.TEST_OPENAI_API_KEY) {
        test.skip();
      }

      const request = {
        mealType: 'lunch' as const,
        allergies: ['dairy'],
        dietaryRestrictions: ['vegan'],
      };

      const recipe = await recipeGenerator.generateRecipe(request);

      // Check that no ingredients contain dairy
      const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
      const dairyTerms = ['milk', 'cheese', 'butter', 'cream', 'yogurt'];

      dairyTerms.forEach(term => {
        expect(ingredientNames.some(name => name.includes(term))).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting', async () => {
      // Mock rate limit response
      jest
        .spyOn(generateText, 'generateText')
        .mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(
        recipeGenerator.generateRecipe({
          mealType: 'dinner',
        }),
      ).rejects.toThrow();
    });

    it('should handle invalid API key', async () => {
      process.env.OPENAI_API_KEY = 'invalid-key';

      await expect(
        recipeGenerator.generateRecipe({
          mealType: 'breakfast',
        }),
      ).rejects.toThrow();
    });
  });
});
```

### Database Integration Tests

```typescript
describe('Recipe Database Integration', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestDatabase();
  });

  describe('Recipe Storage', () => {
    it('should save generated recipe to database', async () => {
      const recipe = await recipeGenerator.generateRecipe({
        mealType: 'breakfast',
      });

      const savedRecipe = await saveRecipe(recipe, testUserId);

      expect(savedRecipe.id).toBeDefined();
      expect(savedRecipe.userId).toBe(testUserId);
    });

    it('should retrieve saved recipes by user', async () => {
      // Create test recipes
      await createTestRecipes(testUserId, 3);

      const userRecipes = await getUserRecipes(testUserId);

      expect(userRecipes).toHaveLength(3);
      userRecipes.forEach(recipe => {
        expect(recipe.userId).toBe(testUserId);
      });
    });
  });
});
```

---

## 🎭 Mock Testing Strategy

### AI Service Mocks

```typescript
// __mocks__/ai.ts
export const generateText = jest.fn();

// Test utilities
export const createMockRecipe = (overrides = {}) => ({
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

export const mockSuccessfulGeneration = (recipe = createMockRecipe()) => {
  generateText.mockResolvedValue({
    text: JSON.stringify(recipe),
  });
};

export const mockFailedGeneration = (error = new Error('API Error')) => {
  generateText.mockRejectedValue(error);
};

export const mockInvalidJsonResponse = () => {
  generateText.mockResolvedValue({
    text: 'invalid json response',
  });
};

export const mockInvalidSchemaResponse = () => {
  generateText.mockResolvedValue({
    text: JSON.stringify({ invalid: 'schema' }),
  });
};
```

### Environment Variable Mocks

```typescript
// jest.setup.ts
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: 'test-api-key',
  };
});

afterEach(() => {
  process.env = originalEnv;
});
```

---

## ⚠️ Error Handling Tests

### API Error Scenarios

```typescript
describe('Error Handling', () => {
  describe('OpenAI API Errors', () => {
    const errorScenarios = [
      {
        name: 'Network timeout',
        error: new Error('ETIMEDOUT'),
        expectedMessage: 'Failed to generate recipe',
      },
      {
        name: 'Rate limit exceeded',
        error: new Error('Rate limit exceeded'),
        expectedMessage: 'Failed to generate recipe',
      },
      {
        name: 'Invalid API key',
        error: new Error('Invalid API key'),
        expectedMessage: 'Failed to generate recipe',
      },
      {
        name: 'Model overloaded',
        error: new Error('Model is currently overloaded'),
        expectedMessage: 'Failed to generate recipe',
      },
    ];

    errorScenarios.forEach(({ name, error, expectedMessage }) => {
      it(`should handle ${name}`, async () => {
        mockFailedGeneration(error);

        await expect(
          recipeGenerator.generateRecipe({
            mealType: 'breakfast',
          }),
        ).rejects.toThrow(expectedMessage);
      });
    });
  });

  describe('Response Parsing Errors', () => {
    it('should handle malformed JSON', async () => {
      mockInvalidJsonResponse();

      await expect(
        recipeGenerator.generateRecipe({
          mealType: 'lunch',
        }),
      ).rejects.toThrow('Invalid JSON response from AI service');
    });

    it('should handle schema validation failures', async () => {
      mockInvalidSchemaResponse();

      await expect(
        recipeGenerator.generateRecipe({
          mealType: 'dinner',
        }),
      ).rejects.toThrow('Recipe validation failed');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid meal types', async () => {
      await expect(
        recipeGenerator.generateRecipe({
          mealType: 'invalid' as any,
        }),
      ).rejects.toThrow();
    });

    it('should reject negative calorie targets', async () => {
      await expect(
        recipeGenerator.generateRecipe({
          mealType: 'breakfast',
          calories: -100,
        }),
      ).rejects.toThrow();
    });
  });
});
```

---

## 🚀 Performance Tests

### API Response Time

```typescript
describe('Performance Tests', () => {
  describe('Recipe Generation Performance', () => {
    it('should generate recipe within acceptable time limit', async () => {
      const startTime = Date.now();

      await recipeGenerator.generateRecipe({
        mealType: 'breakfast',
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          recipeGenerator.generateRecipe({
            mealType: 'lunch',
          }),
        );

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds for 5 requests
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during multiple generations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate multiple recipes
      for (let i = 0; i < 10; i++) {
        await recipeGenerator.generateRecipe({
          mealType: 'dinner',
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
```

---

## 🔒 Security Tests

### API Key Protection

```typescript
describe('Security Tests', () => {
  describe('API Key Protection', () => {
    it('should not expose API key in error messages', async () => {
      process.env.OPENAI_API_KEY = 'secret-key-12345';

      mockFailedGeneration(new Error('API Error with key: secret-key-12345'));

      try {
        await recipeGenerator.generateRecipe({
          mealType: 'breakfast',
        });
      } catch (error) {
        expect(error.message).not.toContain('secret-key-12345');
      }
    });

    it('should validate environment variable presence', () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => new RecipeGeneratorService()).toThrow(
        'OPENAI_API_KEY environment variable is required',
      );
    });
  });

  describe('Input Sanitization', () => {
    it('should handle malicious input in prompts', async () => {
      const maliciousRequest = {
        mealType: 'breakfast' as const,
        allergies: ['<script>alert("xss")</script>'],
        dietaryRestrictions: ['${process.env.SECRET}'],
      };

      // Should not throw or execute malicious code
      expect(async () => {
        await recipeGenerator.generateRecipe(maliciousRequest);
      }).not.toThrow();
    });

    it('should limit prompt length to prevent prompt injection', async () => {
      const longString = 'a'.repeat(10000);

      const request = {
        mealType: 'dinner' as const,
        allergies: [longString],
      };

      // Should handle gracefully or limit input
      await expect(async () => {
        await recipeGenerator.generateRecipe(request);
      }).not.toThrow();
    });
  });
});
```

---

## 🎯 End-to-End Tests

### Complete User Workflows

```typescript
describe('E2E Recipe Generation Workflow', () => {
  it('should complete full recipe generation flow', async () => {
    // 1. User sets up nutrition profile
    const nutritionProfile = {
      userId: testUserId,
      dailyCalories: 2000,
      macroProtein: 150,
      macroCarbs: 200,
      macroFat: 65,
      allergies: ['nuts'],
      dietaryRestrictions: ['vegetarian'],
    };

    await saveNutritionProfile(nutritionProfile);

    // 2. User requests recipe generation
    const request = {
      mealType: 'lunch' as const,
      calories: 500,
      protein: 25,
    };

    const recipe = await recipeGenerator.generateRecipe(request);

    // 3. Recipe is validated and saved
    expect(recipe).toBeDefined();
    expect(recipe.nutrition.calories).toBeCloseTo(500, 100);
    expect(recipe.nutrition.protein).toBeGreaterThanOrEqual(20);

    const savedRecipe = await saveRecipe(recipe, testUserId);

    // 4. User can retrieve saved recipe
    const retrievedRecipe = await getRecipeById(savedRecipe.id);
    expect(retrievedRecipe).toEqual(savedRecipe);

    // 5. User provides feedback
    await saveRecipeFeedback({
      recipeId: savedRecipe.id,
      userId: testUserId,
      liked: true,
    });

    const feedback = await getRecipeFeedback(savedRecipe.id, testUserId);
    expect(feedback.liked).toBe(true);
  });
});
```

---

## ✅ Manual Testing Checklist

### Recipe Generation Quality

- [ ] **Nutritional Accuracy**

  - [ ] Generated recipes meet calorie targets (±10%)
  - [ ] Protein targets are achieved or exceeded
  - [ ] Carb and fat ratios are reasonable
  - [ ] Serving sizes make sense for nutritional values

- [ ] **Dietary Safety**

  - [ ] No allergens appear in recipes when specified
  - [ ] Dietary restrictions are respected (vegan, gluten-free, etc.)
  - [ ] Cross-contamination risks are noted when relevant

- [ ] **Recipe Quality**
  - [ ] Ingredient quantities are realistic and precise
  - [ ] Cooking instructions are clear and sequential
  - [ ] Prep and cook times are accurate
  - [ ] Difficulty ratings match recipe complexity

### Edge Cases

- [ ] **Extreme Nutritional Requirements**

  - [ ] Very low calorie requests (under 200 calories)
  - [ ] High protein requirements (over 50g per meal)
  - [ ] Multiple severe allergies
  - [ ] Conflicting dietary restrictions

- [ ] **API Failure Scenarios**
  - [ ] No internet connection
  - [ ] API rate limiting
  - [ ] Invalid API responses
  - [ ] Timeout scenarios

### User Experience

- [ ] **Error Messages**

  - [ ] Clear, user-friendly error messages
  - [ ] No technical jargon exposed to users
  - [ ] Helpful suggestions for resolution

- [ ] **Performance**
  - [ ] Acceptable loading times (under 10 seconds)
  - [ ] Progressive loading indicators
  - [ ] Graceful degradation when slow

---

## 📊 Test Data & Fixtures

### Sample Recipes

```typescript
export const testRecipes = {
  breakfast: {
    simple: createMockRecipe({
      name: 'Simple Scrambled Eggs',
      mealType: 'breakfast',
      nutrition: { calories: 250, protein: 20, carbs: 5, fat: 18 },
      difficulty: 'easy',
    }),
    complex: createMockRecipe({
      name: 'Eggs Benedict with Hollandaise',
      mealType: 'breakfast',
      nutrition: { calories: 450, protein: 25, carbs: 30, fat: 28 },
      difficulty: 'hard',
    }),
  },
  // ... more test recipes
};

export const testUsers = {
  basic: { id: 1, email: 'test@example.com' },
  withAllergies: {
    id: 2,
    email: 'allergic@example.com',
    allergies: ['nuts', 'dairy'],
  },
  vegan: {
    id: 3,
    email: 'vegan@example.com',
    dietaryRestrictions: ['vegan'],
  },
};
```

### Mock API Responses

```typescript
export const mockOpenAIResponses = {
  validRecipe: JSON.stringify(testRecipes.breakfast.simple),
  invalidJson: 'This is not valid JSON',
  incompleteRecipe: JSON.stringify({
    name: 'Incomplete Recipe',
    // Missing required fields
  }),
  emptyResponse: '',
  malformedNutrition: JSON.stringify({
    ...testRecipes.breakfast.simple,
    nutrition: { calories: 'invalid' },
  }),
};
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: AI Testing

on: [push, pull_request]

jobs:
  ai-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Run AI unit tests
        run: pnpm test:ai:unit

      - name: Run AI integration tests (mocked)
        run: pnpm test:ai:integration:mock

      - name: Run AI integration tests (real API)
        if: github.ref == 'refs/heads/main'
        env:
          TEST_OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
        run: pnpm test:ai:integration:real

      - name: Performance tests
        run: pnpm test:ai:performance

      - name: Security tests
        run: pnpm test:ai:security
```

### Test Scripts in `package.json`

```json
{
  "scripts": {
    "test:ai": "jest lib/ai types/recipe --passWithNoTests",
    "test:ai:unit": "jest lib/ai --testNamePattern='Unit'",
    "test:ai:integration": "jest lib/ai --testNamePattern='Integration'",
    "test:ai:integration:mock": "jest lib/ai --testNamePattern='Integration.*Mock'",
    "test:ai:integration:real": "jest lib/ai --testNamePattern='Integration.*Real'",
    "test:ai:performance": "jest lib/ai --testNamePattern='Performance'",
    "test:ai:security": "jest lib/ai --testNamePattern='Security'",
    "test:ai:e2e": "jest --testPathPattern='e2e.*ai'",
    "test:ai:watch": "jest lib/ai --watch",
    "test:ai:coverage": "jest lib/ai --coverage"
  }
}
```

---

## 📈 Test Metrics & Reporting

### Coverage Targets

- **Unit Tests**: 95% line coverage
- **Integration Tests**: 80% of API endpoints
- **E2E Tests**: 100% of critical user paths

### Quality Gates

```typescript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
    './lib/ai/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
```

### Monitoring & Alerts

- API response time monitoring
- Error rate tracking
- Recipe quality feedback analysis
- Cost monitoring for OpenAI API usage

---

## 🚀 Future Testing Enhancements

### Advanced Testing Strategies

1. **A/B Testing Framework**

   - Test different prompt strategies
   - Compare recipe quality metrics
   - Measure user satisfaction

2. **Chaos Engineering**

   - Introduce random API failures
   - Test system resilience
   - Validate error recovery

3. **Load Testing**

   - Simulate high user volumes
   - Test concurrent recipe generation
   - Validate rate limiting

4. **AI Model Testing**

   - Test with different OpenAI models
   - Compare response quality
   - Measure cost vs. quality trade-offs

5. **Nutrition Accuracy Validation**
   - Cross-reference with nutrition databases
   - Validate calorie calculations
   - Test portion size accuracy

---

## 📚 Additional Resources

- [Jest Testing Framework](https://jestjs.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [AI SDK Testing Guide](https://sdk.vercel.ai/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/testing-best-practices)

---

**Next Steps**: Implement the test suites outlined in this document, starting
with unit tests for the core AI services, then expanding to integration and E2E
tests.
