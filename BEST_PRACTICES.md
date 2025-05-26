# Best Practices Guide for Next.js SaaS Starter

This document outlines the best practices, patterns, and conventions used in this Next.js SaaS starter application. Follow these guidelines when extending or modifying the codebase to maintain consistency, security, and performance.

## Tech Stack Overview

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript with strict mode enabled
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **Payments**: Stripe integration with webhooks
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Styling**: Tailwind CSS with CSS variables for theming
- **Package Manager**: pnpm
- **Validation**: Zod schemas for runtime type checking

## Project Structure

### Directory Organization

```
├── app/                    # Next.js App Router pages and layouts
│   ├── (dashboard)/       # Route groups for protected pages
│   ├── (login)/          # Route groups for auth pages
│   ├── api/              # API routes
│   └── globals.css       # Global styles and Tailwind config
├── components/           # Reusable React components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utility functions and configurations
│   ├── auth/           # Authentication logic
│   ├── db/             # Database schema and queries
│   └── payments/       # Stripe integration
└── middleware.ts       # Global middleware for route protection
```

### File Naming Conventions

- Use kebab-case for directories and files: `user-settings.tsx`
- Use PascalCase for React components: `UserProfile.tsx`
- Use camelCase for utility functions and variables
- Use SCREAMING_SNAKE_CASE for constants and environment variables

## Authentication & Security

### Session Management

```typescript
// Always use HTTP-only cookies for session storage
export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}
```

### Route Protection

- Use global middleware for protecting entire route groups
- Implement route groups `(dashboard)` and `(login)` for organization
- Always redirect unauthenticated users to sign-in page

```typescript
// middleware.ts pattern
const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  // ... session refresh logic
}
```

### Password Security

- Always hash passwords with bcryptjs (minimum 10 salt rounds)
- Implement password strength requirements (minimum 8 characters)
- Use secure password comparison methods

```typescript
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}
```

## Database Patterns

### Schema Design

- Use Drizzle ORM with PostgreSQL
- Define clear relationships between entities
- Include audit fields (createdAt, updatedAt, deletedAt)
- Use proper foreign key constraints

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
```

### Type Safety

- Always export and use inferred types from schema
- Use type-safe query builders

```typescript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Query Patterns

- Centralize database queries in `lib/db/queries.ts`
- Use transactions for related operations
- Implement proper error handling

```typescript
export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
      teamRole: teamMembers.role,
      team: teams
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
```

## Server Actions & Form Handling

### Validation Middleware

- Always validate form data with Zod schemas
- Use custom validation middleware for consistent error handling
- Implement user authentication checks

```typescript
export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }
    return action(result.data, formData);
  };
}
```

### Form Validation Schemas

- Define clear Zod schemas for all forms
- Include appropriate constraints and error messages

```typescript
const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});
```

### Server Action Patterns

- Use `'use server'` directive at the top of action files
- Implement proper error handling and user feedback
- Log important activities for audit trails

```typescript
export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;
  
  // Validation logic...
  
  await Promise.all([
    setSession(foundUser),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN)
  ]);

  redirect('/dashboard');
});
```

## Component Architecture

### UI Components

- Use shadcn/ui as the base component library
- Implement consistent variant patterns with class-variance-authority
- Use compound component patterns for complex UI elements

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
```

### Client Components

- Use `'use client'` directive only when necessary
- Implement proper loading states with React's useActionState
- Handle form submission states appropriately

```typescript
export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <form action={formAction}>
      {/* Form fields */}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit'}
      </Button>
    </form>
  );
}
```

## Styling Guidelines

### Tailwind CSS Configuration

- Use CSS variables for theme customization
- Implement dark mode support with CSS custom properties
- Use the `cn()` utility for conditional classes

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Color System

- Define semantic color tokens in CSS variables
- Use HSL color format for better manipulation
- Implement consistent color usage across components

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}
```

## Payment Integration

### Stripe Best Practices

- Always validate webhooks with proper signature verification
- Handle subscription lifecycle events properly
- Implement proper error handling for payment failures

```typescript
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  // Handle events...
}
```

### Subscription Management

- Store subscription data in your database
- Sync subscription status with Stripe webhooks
- Implement proper trial period handling

```typescript
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const team = await getTeamByStripeCustomerId(customerId);

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status
    });
  }
}
```

## API Route Patterns

### Error Handling

- Always return proper HTTP status codes
- Implement consistent error response formats
- Log errors for debugging

```typescript
export async function GET(request: NextRequest) {
  try {
    // API logic...
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Request Validation

- Validate request parameters and body
- Use proper TypeScript types for request/response
- Implement rate limiting for production

## Environment Configuration

### Environment Variables

- Use descriptive names with proper prefixes
- Always provide example values in `.env.example`
- Validate required environment variables at startup

```bash
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/database

# Authentication
AUTH_SECRET=your-secret-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
BASE_URL=http://localhost:3000
```

### Configuration Validation

```typescript
const requiredEnvVars = [
  'POSTGRES_URL',
  'AUTH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'BASE_URL'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## Performance Optimization

### Next.js Features

- Use App Router for better performance and developer experience
- Implement proper caching strategies with `revalidate`
- Use React Server Components by default

```typescript
// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);
  // Component logic...
}
```

### Database Optimization

- Use proper indexes on frequently queried columns
- Implement connection pooling
- Use prepared statements for repeated queries

### Image and Asset Optimization

- Use Next.js Image component for automatic optimization
- Implement proper loading states
- Use appropriate image formats (WebP, AVIF)

## Testing Guidelines

### Unit Testing

- Test utility functions and business logic
- Mock external dependencies (Stripe, database)
- Use proper TypeScript types in tests

### Integration Testing

- Test API routes with proper request/response validation
- Test authentication flows
- Test payment integration with Stripe test mode

### End-to-End Testing

- Test critical user journeys (sign-up, payment, dashboard)
- Use proper test data and cleanup
- Test across different browsers and devices

## Security Considerations

### Input Validation

- Always validate and sanitize user input
- Use Zod schemas for runtime validation
- Implement proper SQL injection prevention

### Authentication Security

- Use secure session management
- Implement proper CSRF protection
- Use HTTPS in production

### Data Protection

- Implement soft deletes for user data
- Log important activities for audit trails
- Follow GDPR compliance guidelines

```typescript
// Soft delete implementation
await db
  .update(users)
  .set({
    deletedAt: sql`CURRENT_TIMESTAMP`,
    email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
  })
  .where(eq(users.id, user.id));
```

## Deployment Best Practices

### Vercel Deployment

- Use environment variables for configuration
- Implement proper build optimization
- Set up monitoring and error tracking

### Database Migrations

- Always run migrations before deployment
- Use proper migration rollback strategies
- Test migrations in staging environment

### Monitoring

- Implement proper logging
- Set up error tracking (Sentry, etc.)
- Monitor performance metrics

## Code Quality

### TypeScript Configuration

- Use strict mode for better type safety
- Enable all recommended TypeScript rules
- Use proper type definitions for external libraries

### Linting and Formatting

- Use ESLint with recommended rules
- Implement Prettier for consistent formatting
- Use pre-commit hooks for code quality

### Documentation

- Document complex business logic
- Use JSDoc for function documentation
- Keep README and setup instructions updated

## Activity Logging

### Audit Trail Implementation

- Log all important user actions
- Include relevant context (IP address, timestamp)
- Use enum types for activity types

```typescript
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
}

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) return;
  
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}
```

## Error Handling

### Global Error Handling

- Implement proper error boundaries
- Use consistent error message formats
- Log errors with proper context

### User-Friendly Error Messages

- Provide clear, actionable error messages
- Avoid exposing sensitive information
- Implement proper fallback UI states

## Conclusion

Following these best practices ensures:

- **Security**: Proper authentication, input validation, and data protection
- **Performance**: Optimized database queries, caching, and asset loading
- **Maintainability**: Consistent code patterns and clear documentation
- **Scalability**: Proper architecture and separation of concerns
- **User Experience**: Responsive design, loading states, and error handling

When extending this codebase, always refer back to these patterns and maintain consistency with the established conventions. 