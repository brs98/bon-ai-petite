/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  // Match ESLint single quote preference
  singleQuote: true,

  // Match ESLint semicolon preference
  semi: true,

  // Match ESLint trailing comma preference
  trailingComma: 'all',

  // Standard settings for React/Next.js projects
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,

  // JSX preferences
  jsxSingleQuote: true,
  bracketSameLine: false,
  bracketSpacing: true,

  // Additional formatting options
  arrowParens: 'avoid',
  endOfLine: 'lf',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        singleQuote: false,
        trailingComma: 'none',
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.yaml',
      options: {
        singleQuote: false,
      },
    },
  ],
};

export default config;
