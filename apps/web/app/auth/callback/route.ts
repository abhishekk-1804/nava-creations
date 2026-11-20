import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { syncSupabaseUserToDatabase } from '@/lib/customer-auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Supabase OAuth & OTP PKCE Authentication Callback Handler
 * 
 * Exchanges authorization code for an authenticated Supabase session,
 * persists session cookies via @supabase/ssr, syncs customer identity to PostgreSQL,
 * and securely redirects the user to /account (or requested destination).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/account';

  // Prevent open redirect vulnerabilities: ensure next is a relative path
  let next = '/account';
  if (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')) {
    next = rawNext;
  }

  if (code && isSupabaseConfigured()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const redirectResponse = NextResponse.redirect(new URL(next, origin));

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        // Synchronize customer identity into PostgreSQL users table
        try {
          await syncSupabaseUserToDatabase(data.user);
        } catch (dbErr) {
          console.warn('[AUTH_CALLBACK] Customer database synchronization deferred:', dbErr);
        }

        return redirectResponse;
      }

      if (error) {
        console.error('[AUTH_CALLBACK] PKCE code exchange failed:', error.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
        );
      }
    } catch (exchangeErr) {
      console.error('[AUTH_CALLBACK] Unexpected error during code exchange:', exchangeErr);
      return NextResponse.redirect(
        new URL('/login?error=authentication_failed', origin)
      );
    }
  }

  // Fallback if no code provided or Supabase unconfigured
  return NextResponse.redirect(
    new URL(code ? next : '/login?error=missing_auth_code', origin)
  );
}
