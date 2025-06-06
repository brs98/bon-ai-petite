'use server';

import {
    validatedAction,
    validatedActionWithUser,
} from '@/lib/auth/middleware';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { getUserWithTeam } from '@/lib/db/queries';
import {
    invitations,
    teamMembers,
    teams,
    users,
    type NewTeam,
    type NewTeamMember,
    type NewUser
} from '@/lib/db/schema';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const userWithTeam = await db
    .select({
      user: users,
      team: teams,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithTeam.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

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
    return createCheckoutSession({ team: foundTeam, priceId });
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
  plan: z.enum(['essential', 'premium']).optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;

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
    role: 'owner', // Default role, will be overridden if there's an invitation
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  let teamId: number;
  let userRole: string;
  let createdTeam: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    // Check if there's a valid invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);

    if (invitation) {
      teamId = invitation.teamId;
      userRole = invitation.role;

      await db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id));

      [createdTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
    } else {
      return { error: 'Invalid or expired invitation.', email, password };
    }
  } else {
    // Create a new team if there's no invitation
    const newTeam: NewTeam = {
      name: `${email}'s Team`,
    };

    [createdTeam] = await db.insert(teams).values(newTeam).returning();

    if (!createdTeam) {
      return {
        error: 'Failed to create team. Please try again.',
        email,
        password,
      };
    }

    teamId = createdTeam.id;
    userRole = 'owner';
  }

  const newTeamMember: NewTeamMember = {
    userId: createdUser.id,
    teamId: teamId,
    role: userRole,
  };

  await Promise.all([
    db.insert(teamMembers).values(newTeamMember),
    setSession(createdUser),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  const selectedPlan = formData.get('plan') as string | null;

  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: createdTeam, priceId });
  }

  // If a plan is selected, redirect to Stripe checkout
  if (selectedPlan && createdTeam) {
    // Get Stripe prices and products to find the correct price ID
    const { getStripePrices, getStripeProducts } = await import(
      '@/lib/payments/stripe'
    );
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);

    // Map plan names to product names
    const planToProductName = {
      essential: 'Base',
      premium: 'Plus',
    };

    const productName =
      planToProductName[selectedPlan as keyof typeof planToProductName];

    if (productName) {
      const product = products.find(p => p.name === productName);
      const price = prices.find(p => p.productId === product?.id);

      if (price?.id) {
        return createCheckoutSession({ team: createdTeam, priceId: price.id });
      } else {
        // Fallback: redirect to profile if Stripe products are not set up
        redirect('/profile');
      }
    } else {
      // Fallback: redirect to profile if plan mapping is incorrect
      redirect('/profile');
    }
  }

  redirect('/dashboard');
});

export async function signOut() {
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return {
        error: 'Current password is incorrect.',
        currentPassword,
        newPassword,
        confirmPassword,
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        error: 'New passwords do not match.',
        currentPassword,
        newPassword,
        confirmPassword,
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, user.id));

    return { success: 'Password updated successfully!' };
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
      return { error: 'Incorrect password. Please try again.', password };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    // Soft delete
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, user.id));

    (await cookies()).delete('session');
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
    const userWithTeam = await getUserWithTeam(user.id);

    await db.update(users).set({ name, email }).where(eq(users.id, user.id));

    return { success: 'Account updated successfully!' };
  },
);

const removeTeamMemberSchema = z.object({
  memberId: z.string(),
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team.' };
    }

    const memberToRemove = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.id, parseInt(memberId)),
          eq(teamMembers.teamId, userWithTeam.teamId),
        ),
      )
      .limit(1);

    if (memberToRemove.length === 0) {
      return { error: 'Team member not found.' };
    }

    await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, parseInt(memberId)));

    return { success: 'Team member removed successfully!' };
  },
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team.' };
    }

    // Check if user is owner
    const currentMember = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.userId, user.id),
          eq(teamMembers.teamId, userWithTeam.teamId),
        ),
      )
      .limit(1);

    if (currentMember.length === 0 || currentMember[0].role !== 'owner') {
      return { error: 'Only team owners can invite new members.' };
    }

    // Check if invitation already exists
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email.' };
    }

    // Check if user is already a team member
    const existingUser = await db
      .select({ userId: users.id })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(
        and(
          eq(users.email, email),
          eq(teamMembers.teamId, userWithTeam.teamId),
        ),
      )
      .limit(1);

    if (existingUser.length > 0) {
      return { error: 'This user is already a member of your team.' };
    }

    await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email,
      role,
      invitedBy: user.id,
    });

    return { success: `Invitation sent to ${email}!` };
  },
); 