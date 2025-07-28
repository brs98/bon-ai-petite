import { signToken, verifyToken } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  // If app is not launched, only allow access to waitlist page
  if (!env.APP_LAUNCHED) {
    // Allow access to waitlist page and static assets
    if (
      pathname === '/waitlist' ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    // Redirect all other requests to waitlist
    return NextResponse.redirect(new URL('/waitlist', request.url));
  }

  // App is launched - normal flow
  // Redirect to /pricing if accessing /sign-up without a plan
  if (pathname === '/sign-up' && request.method === 'GET') {
    const plan = request.nextUrl.searchParams.get('plan');
    if (!plan) {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
  }

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);

      // For protected routes, verify user has active subscription
      if (isProtectedRoute) {
        const { getUser } = await import('@/lib/db/queries');
        const user = await getUser();

        if (
          !user ||
          !user.subscriptionStatus ||
          (user.subscriptionStatus !== 'active' &&
            user.subscriptionStatus !== 'trialing')
        ) {
          res.cookies.delete('session');
          return NextResponse.redirect(new URL('/pricing', request.url));
        }
      }

      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
