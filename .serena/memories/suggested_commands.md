# Suggested Commands for AI Petite

## Development Workflow

```bash
# Start development server
pnpm dev

# Run pre-build checks (recommended before committing)
pnpm pre-build

# Individual checks
pnpm type-check
pnpm lint:check
pnpm format:check

# Fix formatting/linting issues
pnpm format
pnpm lint:fix
```

## Database Operations

```bash
# Setup database (first time)
pnpm db:setup

# Run migrations
pnpm db:migrate

# Generate new migrations after schema changes
pnpm db:generate

# Open database studio
pnpm db:studio

# Seed database with test data
pnpm db:seed
```

## Testing

```bash
# Run all tests
pnpm test

# Run AI-specific tests
pnpm test:ai

# Run tests in watch mode
pnpm test:watch
```

## Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Stripe Development

```bash
# Listen for Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## When Task is Completed

Always run these commands before considering a task complete:

1. `pnpm type-check` - Ensure no TypeScript errors
2. `pnpm lint:check` - Ensure code follows linting rules
3. `pnpm format:check` - Ensure code is properly formatted

Or use the combined command: `pnpm pre-build`
