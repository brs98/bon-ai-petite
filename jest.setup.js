// Global test setup

// Set up environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key';

// Store original environment for cleanup
const originalEnv = process.env;

beforeEach(() => {
  // Reset modules before each test to ensure clean state
  jest.resetModules();

  // Restore default test environment
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: 'test-api-key',
  };
});

afterEach(() => {
  // Clean up mocks
  jest.clearAllMocks();
});

// Configure longer timeout for AI service tests
jest.setTimeout(10000);
