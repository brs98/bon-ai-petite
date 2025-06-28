import { setSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { stripe } from '@/lib/payments/stripe';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  console.log('Checkout API called with session_id:', sessionId);

  if (!sessionId) {
    console.log('No session_id provided, redirecting to pricing');
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    console.log('Retrieving Stripe session...');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    console.log('Stripe session retrieved successfully');

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer data from Stripe.');
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error('No subscription found for this session.');
    }

    console.log('Retrieving subscription details...');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const plan = subscription.items.data[0]?.price;

    if (!plan) {
      throw new Error('No plan found for this subscription.');
    }

    const productId = (plan.product as Stripe.Product).id;

    if (!productId) {
      throw new Error('No product ID found for this subscription.');
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    console.log('Starting database operations for user:', userId);

    // Try to update the database with a timeout, but don't fail the entire flow if it times out
    try {
      // Add a timeout wrapper for database operations
      const dbOperationPromise = (async () => {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (user.length === 0) {
          throw new Error('User not found in database.');
        }

        await db
          .update(users)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeProductId: productId,
            planName: (plan.product as Stripe.Product).name,
            subscriptionStatus: subscription.status,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user[0].id));

        await setSession(user[0]);
        return user[0];
      })();

      // Set a 10-second timeout for database operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Database operation timeout')),
          10000,
        );
      });

      await Promise.race([dbOperationPromise, timeoutPromise]);
      console.log('Successfully updated database for user:', userId);
    } catch (dbError) {
      console.error('Database error during checkout processing:', dbError);
      console.log(
        'Continuing with redirect - webhook will handle subscription update',
      );
      // Continue to redirect even if database update fails
      // The webhook will handle the subscription update later
    }

    console.log('Redirecting to profile with success status');
    // Always redirect to dashboard, even if database update failed
    return NextResponse.redirect(
      new URL('/dashboard?payment=success', request.url),
    );
  } catch (error) {
    console.error('Error handling successful checkout:', error);
    console.log('Redirecting to profile with error status');
    // Still redirect to dashboard with an error flag so user isn't stuck
    return NextResponse.redirect(
      new URL('/dashboard?payment=error', request.url),
    );
  }
}
