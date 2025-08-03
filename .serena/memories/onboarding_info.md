# Project Onboarding - AI Petite

## Project Purpose

AI Petite is a Next.js SaaS application for AI-powered nutrition and meal
planning services. It provides personalized meal plans, dietary preferences
management, and subscription-based AI features with Essential/Premium tiers.

## Tech Stack

- **Framework**: Next.js 15.4.0 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe integration
- **AI**: OpenAI API with AI SDK from Vercel
- **UI**: shadcn/ui with Tailwind CSS, Framer Motion for animations
- **Authentication**: JWT-based auth with cookies
- **Language**: TypeScript

## Commands

- **Development**: `pnpm dev` (with turbopack)
- **Build**: `pnpm build`
- **Type check**: `pnpm type-check`
- **Lint**: `pnpm lint` (check), `pnpm lint:fix`
- **Format**: `pnpm format` (write), `pnpm format:check`
- **Pre-build checks**: `pnpm pre-build` (runs type-check, lint:check,
  format:check)
- **Database**: `pnpm db:setup`, `pnpm db:migrate`, `pnpm db:studio`
- **Testing**: `pnpm test`, `pnpm test:ai` (AI-specific tests)

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Protected dashboard routes
│   ├── (login)/           # Authentication routes (sign-in, sign-up)
│   ├── pricing/           # Public pricing page
│   ├── profile/           # User profile page
│   └── api/               # API routes
├── components/ui/         # Reusable UI components (shadcn/ui)
├── lib/
│   ├── auth/             # Authentication logic (JWT, sessions)
│   ├── db/               # Database schema, queries (Drizzle)
│   ├── payments/         # Stripe integration
│   └── ai/               # AI services, recipe generation
├── types/                # TypeScript definitions
└── middleware.ts         # Route protection middleware
```

## Key Features & Payment Flow

1. **Landing Page** (`/`) → **Pricing Page** (`/pricing`) → **Sign-Up**
   (`/sign-up?plan=essential|premium`) → **Stripe Checkout** → **Profile Page**
   (`/profile`)
2. Subscription-based access (Essential/Premium plans)
3. 14-day free trial for all plans
4. AI-powered recipe generation with OpenAI
5. Personalized nutrition profiles with goal weight support

## Authentication Flow

- JWT tokens stored in httpOnly cookies
- Session management via `lib/auth/session.ts`
- Global middleware protects dashboard routes
- Users must have active/trialing subscription to access dashboard
