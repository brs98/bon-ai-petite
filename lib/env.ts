import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Database
    POSTGRES_URL: z.string().url().optional(),

    // Authentication
    AUTH_SECRET: z.string().min(1).optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

    // OpenAI
    OPENAI_API_KEY: z.string().min(1).optional(),

    // Feature flags
    APP_LAUNCHED: z
      .enum(['true', 'false'])
      .default('false')
      .transform(val => val === 'true'),
  },
  client: {
    // Public keys that can be exposed to the client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  },
  clientPrefix: 'NEXT_PUBLIC_',
  runtimeEnv: {
    // Database
    POSTGRES_URL: process.env.POSTGRES_URL,

    // Authentication
    AUTH_SECRET: process.env.AUTH_SECRET,

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    // Feature flags
    APP_LAUNCHED: process.env.APP_LAUNCHED,

    // Public keys
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
