'use server';

import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { users, type NewUser } from '@/lib/db/schema';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const foundUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (foundUsers.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const foundUser = foundUsers[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash,
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  await setSession(foundUser);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ user: foundUser, priceId });
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(['essential', 'premium']).optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'owner',
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  await setSession(createdUser);

  const redirectTo = formData.get('redirect') as string | null;
  const selectedPlan = formData.get('plan') as string | null;

  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ user: createdUser, priceId });
  }

  // If a plan is selected, redirect to Stripe checkout
  if (selectedPlan) {
    // Get Stripe prices and products to find the correct price ID
    const { getStripePrices, getStripeProducts } = await import(
      '@/lib/payments/stripe'
    );
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);

    // Find the product that matches the selected plan
    const targetProduct = products.find(product => {
      const productName = product.name.toLowerCase();
      if (selectedPlan === 'essential') {
        return (
          productName.includes('base') || productName.includes('essential')
        );
      } else if (selectedPlan === 'premium') {
        return productName.includes('plus') || productName.includes('premium');
      }
      return false;
    });

    if (targetProduct) {
      // Find the price for this product
      const targetPrice = prices.find(
        price => price.productId === targetProduct.id,
      );

      if (targetPrice) {
        return createCheckoutSession({
          user: createdUser,
          priceId: targetPrice.id,
        });
      }
    }
  }

  redirect('/dashboard');
});

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/sign-in');
}

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword } = data;

    const isCurrentPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return { error: 'Current password is incorrect.' };
    }

    if (currentPassword === newPassword) {
      return {
        error: 'New password must be different from the current password.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: 'Password updated successfully.' };
  },
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      return { error: 'Incorrect password. Account deletion failed.' };
    }

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const cookieStore = await cookies();
    cookieStore.delete('session');
    redirect('/sign-in');
  },
);

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().min(3).max(255),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;

    await db
      .update(users)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: 'Account updated successfully.' };
  },
);
const continueCheckoutSchema = z.object({
  plan: z.enum(['essential', 'premium']),
});

export const continueCheckout = validatedActionWithUser(
  continueCheckoutSchema,
  async (data, _, user) => {
    const { plan } = data;

    // Get Stripe prices and products to find the correct price ID
    const { getStripePrices, getStripeProducts } = await import(
      '@/lib/payments/stripe'
    );
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);

    // Find the product that matches the selected plan
    const targetProduct = products.find(product => {
      const productName = product.name.toLowerCase();
      if (plan === 'essential') {
        return (
          productName.includes('base') || productName.includes('essential')
        );
      } else if (plan === 'premium') {
        return productName.includes('plus') || productName.includes('premium');
      }
      return false;
    });

    if (targetProduct) {
      // Find the price for this product
      const targetPrice = prices.find(
        price => price.productId === targetProduct.id,
      );

      if (targetPrice) {
        return createCheckoutSession({
          user,
          priceId: targetPrice.id,
        });
      }
    }

    return { error: 'Plan not found. Please try again.' };
  },
);
