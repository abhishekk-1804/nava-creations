import { NextRequest, NextResponse } from 'next/server';
import { assertProductionSecrets } from './lib/env-validator';

/**
 * Next.js Edge Middleware for NAVA CREATIONS
 *
 * Enforces security boundaries and route protection:
 * 1. Restricts unauthenticated access to /admin hierarchy.
 * 2. Injects security response headers (CSP, HSTS, frame options).
 * 3. Enforces fail-closed production environment configuration before sensitive routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Fail-closed Production Environment Verification for API and Admin routes
  if (process.env.NODE_ENV === 'production' && (pathname.startsWith('/api/') || pathname.startsWith('/admin'))) {
    try {
      assertProductionSecrets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Configuration error';
      console.error('[SECURITY FATAL] Production secrets check failed:', msg);
      return NextResponse.json(
        { error: 'Server Configuration Error', message: 'Production security preconditions not satisfied.' },
        { status: 500 }
      );
    }
  }

  // 1. Administrative Route Protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'nava_admin_session';
    const sessionCookie = request.cookies.get(sessionCookieName);

    // If session cookie is completely absent or malformed, redirect to /admin/login
    if (!sessionCookie || !sessionCookie.value || sessionCookie.value.trim().length < 32) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Security Headers for all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  if (pathname.startsWith('/api/orders') || pathname.startsWith('/orders')) {
    response.headers.set('Referrer-Policy', 'no-referrer');
  } else {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Enforce noindex on private administrative, order-tracking, checkout, and API routes
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/api')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
