# ESLint + Prettier Integration

This project uses ESLint and Prettier together for comprehensive code quality
and formatting. They work in harmony without conflicts.

## 🎯 Division of Responsibilities

- **ESLint**: Code quality, bug prevention, best practices
- **Prettier**: Code formatting, consistent style

## 📦 Installation

All packages are installed as development dependencies:

```bash
pnpm install eslint@latest @eslint/js@latest typescript-eslint@latest --save-dev
pnpm install prettier@latest eslint-config-prettier@latest globals --save-dev --save-exact
```

## ⚙️ Configuration Files

### ESLint Configuration (`eslint.config.js`)

- **Modern flat config** format
- **TypeScript ESLint** with type-aware linting
- **Global definitions** for browser, Node.js, and React
- **eslint-config-prettier** integration (disables conflicting rules)
- **File-specific configurations** for different contexts

### Prettier Configuration (`prettier.config.js`)

- **Matches ESLint preferences**: single quotes, semicolons, trailing commas
- **React/JSX optimized** settings
- **File-specific overrides** for JSON, Markdown, YAML

## 📜 Scripts

### ESLint Scripts

```bash
# Lint all files
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Strict mode (zero warnings)
pnpm lint:check
```

### Prettier Scripts

```bash
# Format all files
pnpm format

# Check formatting without changes
pnpm format:check

# Watch for changes and auto-format
pnpm format:watch
```

### Combined Workflow

```bash
# Type check + lint + format check
pnpm pre-build
```

## 🔧 VS Code Integration

### Required Extensions

- **ESLint** (`ms-vscode.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

### Automatic Actions on Save

- ✅ **Format with Prettier**
- ✅ **Fix ESLint issues**
- ✅ **Organize imports**

## 📋 Configuration Synchronization

The configurations are carefully synchronized:

| Aspect              | ESLint Rule                   | Prettier Config        | Status    |
| ------------------- | ----------------------------- | ---------------------- | --------- |
| **Quotes**          | ~~`quotes`~~ (disabled)       | `singleQuote: true`    | ✅ Synced |
| **Semicolons**      | ~~`semi`~~ (disabled)         | `semi: true`           | ✅ Synced |
| **Trailing Commas** | ~~`comma-dangle`~~ (disabled) | `trailingComma: 'all'` | ✅ Synced |
| **JSX Quotes**      | ~~`jsx-quotes`~~ (disabled)   | `jsxSingleQuote: true` | ✅ Synced |
| **Line Length**     | ~~`max-len`~~ (disabled)      | `printWidth: 80`       | ✅ Synced |

## 🛠️ How It Works

### 1. ESLint Configuration Order

```javascript
export default tseslint.config(
  // ... base configs
  eslintConfigPrettier, // MUST BE LAST - disables conflicting rules
);
```

### 2. Rule Categories

- **✅ Enabled**: Code quality rules (`no-unused-vars`, `no-floating-promises`)
- **❌ Disabled**: Formatting rules (handled by Prettier)
- **🔧 Custom**: Project-specific rules for different file types

### 3. Global Variables

- **Browser**: `fetch`, `window`, `document`, etc.
- **Node.js**: `process`, `Buffer`, `setTimeout`, etc.
- **React**: `React`, `JSX`
- **ES2022**: Modern JavaScript features

## 🎨 Code Style

### Prettier Settings

```javascript
{
  singleQuote: true,           // 'hello' not "hello"
  semi: true,                  // statement;
  trailingComma: 'all',        // { a, b, }
  tabWidth: 2,                 // 2 space indentation
  jsxSingleQuote: true,        // <div className='foo' />
  bracketSameLine: false,      // Closing > on new line
  arrowParens: 'avoid',        // x => x not (x) => x
  endOfLine: 'lf',             // Unix line endings
}
```

### ESLint Focus Areas

- **Type Safety**: TypeScript strict checking
- **Promise Handling**: Await/catch requirements
- **Import Organization**: No duplicates, proper structure
- **Code Quality**: Unused variables, debugging statements

## 📁 File-Specific Rules

### React Components (`**/*.{ts,tsx}`)

- Full TypeScript + React linting
- Browser globals available
- JSX support enabled

### API Routes (`**/app/api/**/*.{ts,tsx}`)

- Node.js globals available
- Console statements allowed
- Server-side focus

### Configuration Files (`**/*.config.{js,ts}`)

- Node.js environment
- Relaxed console rules
- Build tool considerations

### Test Files (`**/*.{test,spec}.{ts,tsx,js}`)

- Jest globals available
- Relaxed type checking
- Testing utilities allowed

## 🚫 Ignored Files

### ESLint Ignores

- Build outputs (`.next/`, `dist/`, `build/`)
- Dependencies (`node_modules/`)
- Generated files (`drizzle/`, `components.json`)

### Prettier Ignores

- Same as ESLint, plus:
- Lock files (`pnpm-lock.yaml`, `package-lock.json`)
- Log files (`*.log`)
- Environment files (`.env*`)

## 🔄 Workflow Integration

### Development

1. **Write code** in VS Code
2. **Auto-format on save** (Prettier)
3. **Auto-fix ESLint issues** on save
4. **Manual check**: `pnpm lint` for remaining issues

### Pre-commit

```bash
pnpm pre-build  # Type check + lint + format check
```

### CI/CD

```bash
pnpm type-check  # TypeScript validation
pnpm lint:check  # ESLint validation (zero warnings)
pnpm format:check  # Prettier validation
```

## 🛡️ Conflict Resolution

### No More Conflicts!

With `eslint-config-prettier`, formatting rules are automatically disabled in
ESLint:

- ❌ `quotes` rule disabled → Prettier handles quotes
- ❌ `semi` rule disabled → Prettier handles semicolons
- ❌ `comma-dangle` rule disabled → Prettier handles trailing commas
- ❌ `indent` rule disabled → Prettier handles indentation

### Remaining ESLint Rules

Only **code quality** and **error prevention** rules remain:

- `@typescript-eslint/no-unused-vars`
- `@typescript-eslint/no-floating-promises`
- `no-duplicate-imports`
- `prefer-const`
- `no-debugger`

## 📊 Benefits

### 🎯 Developer Experience

- **No configuration conflicts**
- **Consistent formatting** across team
- **Automatic fixes** on save
- **Clear separation** of concerns

### 🔍 Code Quality

- **Type safety** with TypeScript
- **Promise handling** validation
- **Import organization**
- **Best practices** enforcement

### 🚀 Performance

- **Fast formatting** with Prettier
- **Efficient linting** with flat config
- **Minimal rule conflicts**
- **Optimized VS Code** integration

## 🐛 Troubleshooting

### Common Issues

#### ESLint + Prettier Conflicts

**Problem**: Rules fighting each other **Solution**: Ensure
`eslint-config-prettier` is **last** in config

#### Formatting Not Applied

**Problem**: Code not formatting on save **Solution**: Check VS Code settings
for Prettier as default formatter

#### Global Variables Not Recognized

**Problem**: `fetch is not defined` errors **Solution**: Verify `globals`
package is installed and configured

#### TypeScript Errors in ESLint

**Problem**: ESLint not recognizing TypeScript **Solution**: Ensure
`projectService: true` is set

### Reset Configuration

If you need to start fresh:

```bash
# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Reformat everything
pnpm format

# Check for remaining issues
pnpm lint
```

## 🔄 Updating

### Package Updates

```bash
# Update ESLint ecosystem
pnpm update eslint @eslint/js typescript-eslint

# Update Prettier ecosystem
pnpm update prettier eslint-config-prettier

# Update globals
pnpm update globals
```

### Configuration Maintenance

- Review ESLint rules quarterly
- Update Prettier config for new features
- Sync with team style preferences
- Monitor for new conflicting rules

This setup provides a robust, conflict-free development environment with
automatic code quality and formatting! 🎉
