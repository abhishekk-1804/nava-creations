import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware for NAVA CREATIONS
 *
 * Enforces security boundaries and route protection:
 * 1. Restricts unauthenticated access to /admin hierarchy.
 * 2. Injects security response headers (CSP, HSTS, frame options).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

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
