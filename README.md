# AI Petite - Next.js SaaS Starter

This is a starter template for building a SaaS application using **Next.js**
with support for authentication, Stripe integration for payments, and a
dashboard for logged-in users. This version has been customized for AI Petite,
an AI-powered nutrition and meal planning service.

**Demo:
[https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated elements and modern design
- Publicly accessible pricing page (`/pricing`) with plan selection
- Streamlined payment flow: Landing → Pricing → Sign-up → Stripe → Profile
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events
- User profile page (`/profile`) for account and subscription management
- **AI-powered recipe generation** with OpenAI integration
- **Nutrition profile management** with personalized meal planning
- **Subscription-based AI features** (Essential/Premium tiers)

## Payment Flow

The application implements a complete payment flow:

1. **Landing Page** (`/`) - Call-to-action buttons redirect to pricing
2. **Pricing Page** (`/pricing`) - Publicly accessible plan selection
   (Essential/Premium)
3. **Sign-Up** (`/sign-up?plan=essential|premium`) - User registration with
   selected plan preview
4. **Stripe Checkout** - Automatic redirect to Stripe for payment processing
5. **Profile Page** (`/profile`) - Success page with account and subscription
   details

### Key Features:

- Dynamic Stripe price lookup (no hardcoded environment variables)
- Plan selection with query parameters
- Comprehensive error handling and fallbacks
- Mobile-responsive design throughout
- Real-time plan preview during sign-up

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **AI**: [AI SDK](https://sdk.vercel.ai/) with [OpenAI](https://openai.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

**Important**: Add your OpenAI API key to your `.env` file:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the
app in action.

You can listen for Stripe webhooks locally through their CLI to handle
subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## AI Setup

The application uses OpenAI for recipe generation. To set this up:

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key from your OpenAI dashboard
3. Add the key to your `.env` file as `OPENAI_API_KEY`

The AI features include:

- Personalized recipe generation based on nutritional goals
- Dietary restriction and allergy support
- Cuisine preference customization
- Subscription-based usage limits (Essential: 3 recipes/day, Premium: unlimited)

## Testing Payments

To test the complete payment flow:

1. Visit the landing page at `http://localhost:3000`
2. Click "Start Your Journey" to go to pricing
3. Select either Essential or Premium plan
4. Sign up with test credentials
5. Use Stripe test card details for payment

### Stripe Test Card Details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Stripe Setup

The application dynamically fetches Stripe products and prices, so you need to
set up products in your Stripe dashboard:

1. Create two products in Stripe:
   - **Base** (for Essential plan)
   - **Plus** (for Premium plan)
2. Add recurring prices to each product
3. The application will automatically map plan selections to the correct Stripe
   prices

## Going to Production

When you're ready to deploy your SaaS application to production, follow these
steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production
   environment.
2. Set the endpoint URL to your production API route (e.g.,
   `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`,
   `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up
   your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary
environment variables. Make sure to update the values for the production
environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `STRIPE_SECRET_KEY`: Use your Stripe secret key for the production
   environment.
3. `STRIPE_WEBHOOK_SECRET`: Use the webhook secret from the production webhook
   you created in step 1.
4. `POSTGRES_URL`: Set this to your production database URL.
5. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will
   generate one.
6. `OPENAI_API_KEY`: Set this to your production OpenAI API key.

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   ├── (login)/             # Authentication routes
│   ├── pricing/             # Public pricing page
│   ├── profile/             # User profile page
│   └── api/                 # API routes
├── components/
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── auth/               # Authentication logic
│   ├── db/                 # Database schema and queries
│   ├── payments/           # Stripe integration
│   └── ai/                 # AI services and recipe generation
├── types/                  # TypeScript type definitions
└── middleware.ts           # Route protection
```

## Other Templates

While this template is intentionally minimal and to be used as a learning
resource, there are other paid versions in the community which are more
full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
