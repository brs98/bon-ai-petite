# ESLint Configuration

This project uses ESLint with TypeScript support for code quality and
consistency.

## Installation

ESLint and related packages are installed as development dependencies:

```bash
pnpm install eslint@latest @eslint/js@latest typescript-eslint@latest --save-dev
```

## Configuration

The project uses the modern **flat config** format (`eslint.config.js`) with:

- **Base ESLint recommended rules**
- **TypeScript ESLint recommended + type-checked rules**
- **Custom rules for Next.js projects**
- **Specific configurations for different file types**

### Key Features

- ✅ TypeScript support with type-aware linting
- ✅ React/JSX support
- ✅ Next.js API routes support
- ✅ Automatic code formatting with consistent style
- ✅ Import validation and organization
- ✅ Unused variable detection
- ✅ Promise handling validation
- ✅ VS Code integration

### Rules Overview

- **Code Style**: Single quotes, semicolons, trailing commas
- **TypeScript**: Strict type checking, no floating promises, await validation
- **Imports**: No duplicate imports, proper organization
- **Variables**: No unused variables (except prefixed with `_`)
- **Console**: Warnings for console statements (disabled in API routes/debug
  files)

## Scripts

### Basic Linting

```bash
# Run ESLint on all files
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Check with zero warnings (strict mode)
pnpm lint:check
```

### Development Workflow

```bash
# Type check without emitting files
pnpm type-check

# Combined pre-build checks
pnpm pre-build
```

## VS Code Integration

The project includes VS Code settings (`.vscode/settings.json`) for:

- ✅ Automatic ESLint fixes on save
- ✅ Proper TypeScript integration
- ✅ Flat config support
- ✅ File type associations

### Required VS Code Extensions

- **ESLint** (`ms-vscode.vscode-eslint`)
- **TypeScript and JavaScript Language Features** (built-in)

## File-Specific Configurations

### TypeScript Files (`**/*.{ts,tsx}`)

- Full TypeScript ESLint rules
- Type-aware linting enabled
- JSX support for React components
- Strict error checking

### JavaScript Files (`**/*.{js,mjs}`)

- Basic ESLint rules only
- Type checking disabled
- Import/export validation

### Configuration Files

- Console statements allowed
- Less strict linting for build tools

### API Routes

- Console statements allowed for debugging
- Server-side specific rules

### Test Files

- Relaxed rules for testing utilities
- Console statements allowed

## Ignored Files

The following files and directories are ignored:

- `node_modules/`, `.next/`, `dist/`, `build/`
- `public/`, `coverage/`, `.cache/`
- `next-env.d.ts`, `components.json`
- Configuration files (`*.config.{js,ts,mjs}`)

## Common Issues & Solutions

### Import Duplicates

❌ **Error**: `'react' import is duplicated`

```typescript
import React from 'react';
import { useState } from 'react'; // Duplicate!
```

✅ **Fix**: Combine imports

```typescript
import React, { useState } from 'react';
```

### Unused Variables

❌ **Error**: `'someVar' is defined but never used`

✅ **Fix**: Prefix with underscore if intentionally unused

```typescript
const _unusedVar = someFunction();
```

### Floating Promises

❌ **Error**: `Promises must be awaited`

```typescript
someAsyncFunction(); // Missing await
```

✅ **Fix**: Handle the promise properly

```typescript
await someAsyncFunction();
// or
void someAsyncFunction(); // If intentionally not awaited
// or
someAsyncFunction().catch(console.error);
```

### Type Safety Issues

❌ **Error**: `Unsafe assignment of an 'any' value`

✅ **Fix**: Add proper type annotations

```typescript
const result = data as SomeType;
// or
const result: SomeType = data;
```

## Configuration Customization

To modify ESLint rules, edit `eslint.config.js`:

```javascript
// Add custom rules
rules: {
  'no-console': 'off',  // Allow console statements
  'prefer-const': 'warn',  // Change error to warning
  // Add more custom rules...
}
```

## Integration with CI/CD

For continuous integration, use the strict linting script:

```bash
pnpm lint:check  # Fails if any warnings or errors
```

This ensures code quality standards are maintained across the project.

## Performance Tips

- The configuration uses `projectService: true` for optimal TypeScript
  integration
- Files are cached automatically by ESLint
- Use `--cache` flag for faster subsequent runs in CI

## Troubleshooting

### ESLint not working in VS Code

1. Ensure the ESLint extension is installed and enabled
2. Check that `eslint.experimental.useFlatConfig: true` is set in VS Code
   settings
3. Restart VS Code after configuration changes

### TypeScript errors in ESLint

1. Ensure `tsconfig.json` is properly configured
2. Check that `projectService: true` is set in ESLint config
3. Verify TypeScript version compatibility

### Performance issues

1. Check that ignores are properly configured
2. Ensure TypeScript project references are correct
3. Consider excluding large directories from linting
