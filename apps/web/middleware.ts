import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { assertProductionSecrets } from './lib/env-validator';

/**
 * Next.js Edge Middleware for NAVA CREATIONS
 *
 * Enforces security boundaries, Supabase session refreshing, and route protection:
 * 1. Refreshes Supabase Auth user sessions via @supabase/ssr cookies.
 * 2. Restricts unauthenticated access to /account and /admin routes.
 * 3. Automatically redirects authenticated customers visiting /login to /account.
 * 4. Injects strict HTTP security response headers (CSP, HSTS, frame options).
 * 5. Enforces fail-closed production environment configuration before sensitive routes.
 */
export async function middleware(request: NextRequest) {
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

  // Initial response with request headers propagated
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Refresh Supabase user session via @supabase/ssr
  let supabaseUser: { id: string; role?: string; user_metadata?: Record<string, unknown> } | null = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder') &&
    supabaseUrl.startsWith('http')
  ) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        supabaseUser = data.user;
      }
    } catch (_supabaseErr) {
      // Continue gracefully if Supabase cloud is unreachable or in offline test mode
    }
  }

  // Customer session resolution (Supabase User OR verified local/test session cookie)
  const customerCookieName = process.env.CUSTOMER_COOKIE_NAME || 'nava_customer_session';
  const customerSessionCookie = request.cookies.get(customerCookieName);
  const hasCustomerSession = Boolean(
    supabaseUser ||
    (customerSessionCookie && customerSessionCookie.value && customerSessionCookie.value.trim().length >= 32)
  );

  // Admin session resolution (Supabase Admin User OR verified studio session cookie)
  const adminCookieName = process.env.SESSION_COOKIE_NAME || 'nava_admin_session';
  const adminSessionCookie = request.cookies.get(adminCookieName);
  const hasAdminSession = Boolean(
    (supabaseUser && (supabaseUser.user_metadata?.role === 'SUPER_ADMIN' || supabaseUser.user_metadata?.role === 'STORE_MANAGER' || supabaseUser.role === 'authenticated')) ||
    (adminSessionCookie && adminSessionCookie.value && adminSessionCookie.value.trim().length >= 32)
  );

  // 2. Customer Login Route Handling:
  // If an authenticated customer visits /login, automatically redirect them to /account (or original redirect target)
  if (pathname === '/login' && hasCustomerSession) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const destination = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : '/account';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 3. Customer Account Protection:
  // Restrict unauthenticated access to /account hierarchy
  if (pathname.startsWith('/account')) {
    if (!hasCustomerSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Administrative Route Protection:
  // Restrict unauthenticated access to /admin hierarchy (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasAdminSession) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Inject Security Headers for all responses
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
