// @ts-check

import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores (equivalent to .eslintignore)
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/.cache/**',
      '**/public/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      '**/drizzle/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      '**/*.config.cjs',
      '**/components.json',
    ],
  },

  // Base ESLint recommended rules for all files
  eslint.configs.recommended,

  // TypeScript ESLint recommended configuration WITHOUT type checking (for basic rules)
  ...tseslint.configs.recommended,

  // TypeScript ESLint configuration WITH type checking - ONLY for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Add type-aware rules manually for TypeScript files
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      '@typescript-eslint/require-await': 'error',

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',

      // General ESLint rules (formatting rules removed - handled by Prettier)
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Keep only non-formatting rules that don't conflict with Prettier
      'no-case-declarations': 'error',
      'no-undef': 'error',
      'no-unused-expressions': 'error',
    },
  },

  // Configuration for JavaScript files (disable type-aware linting)
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    ...tseslint.configs.disableTypeChecked,
    rules: {
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-case-declarations': 'error',
      'no-undef': 'error',
      'no-unused-expressions': 'error',
    },
  },

  // API routes configuration
  {
    files: ['**/app/api/**/*.{ts,tsx}', '**/pages/api/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': 'off', // Allow console.log in API routes for debugging
    },
  },

  // Test files configuration
  {
    files: [
      '**/*.test.{ts,tsx,js}',
      '**/*.spec.{ts,tsx,js}',
      '**/__tests__/**',
      '**/jest.setup.js',
      '**/jest.config.{js,cjs}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Database and lib files
  {
    files: ['**/lib/db/**/*.{ts,tsx}', '**/drizzle/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': 'off', // Allow console in database files for debugging
    },
  },

  // Prettier config - MUST be last to override conflicting rules
  eslintConfigPrettier,
);
