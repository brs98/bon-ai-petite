/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/ai/**/*.ts',
    'lib/utils/**/*.ts',
    'app/api/nutrition/**/*.ts',
    'types/**/*.ts',
    '!**/__tests__/**', // Exclude test files
    '!**/*.test.ts', // Exclude test files
    '!**/*.spec.ts', // Exclude spec files
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './lib/ai/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/utils/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/utils/nutrition.ts': {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
