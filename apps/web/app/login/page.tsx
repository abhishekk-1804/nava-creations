'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRightIcon, AlertCircleIcon, CheckIcon, UserIcon } from '@/components/icons';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already authenticated, automatically redirect customer to /account
  useEffect(() => {
    let isMounted = true;
    async function checkExistingAuth() {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            window.location.href = redirectUrl;
            return;
          }
        }

        const res = await fetch('/api/auth/me');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            window.location.href = redirectUrl;
          }
        }
      } catch (_e) {
        // Continue to display login form
      }
    }

    checkExistingAuth();
    return () => {
      isMounted = false;
    };
  }, [redirectUrl]);

  // Unified Email / Mobile Phone + Password Authentication Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setError('Please provide your email/phone and password.');
      setLoading(false);
      return;
    }

    // Utility: determine if the identifier string is an email (contains @) or a phone number
    const isEmail = cleanIdentifier.includes('@');
    const formattedIdentifier = isEmail ? cleanIdentifier.toLowerCase() : cleanIdentifier;

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const credentials = isEmail
          ? { email: formattedIdentifier, password }
          : { phone: formattedIdentifier, password };

        const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);

        if (signInError) {
          throw new Error(signInError.message);
        }

        if (data?.session) {
          // Sync customer session to server cookie
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: formattedIdentifier, password }),
          }).catch(() => {});

          setSuccess('Signed in successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 200);
          return;
        }
      }

      // Prototype / Offline Test Mode fallback
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formattedIdentifier,
          email: isEmail ? formattedIdentifier : undefined,
          phone: !isEmail ? formattedIdentifier : undefined,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      setSuccess('Signed in successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth via Supabase PKCE flow
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const origin = window.location.origin;
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
          },
        });
        if (oauthError) throw oauthError;
      } else {
        setError('Google OAuth provider requires live Supabase client credentials in environment.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Fast Test Customer Login (for E2E automated testing / local prototype verification)
  const handleTestCustomerLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'customer@nava-creations.in',
          password: 'Password123!',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test login failed');

      setSuccess('Logged in as test customer. Redirecting...');
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-brand-sand/60 border border-brand-gold/40 flex items-center justify-center text-brand-maroon mx-auto mb-4">
          <UserIcon className="w-6 h-6" />
        </div>
        <span className="font-serif text-2xl tracking-[0.2em] font-semibold text-brand-maroon block">
          NAVA
        </span>
        <span className="text-xs uppercase tracking-widest text-brand-darkGold block font-medium mt-0.5">
          Customer Account Login
        </span>
        <p className="mt-2 text-xs text-stone-500">
          Sign in to view your orders, track shipments, and manage saved addresses.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white border border-brand-sand py-8 px-6 sm:px-10 rounded-2xl shadow-sm space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h2 className="text-base font-serif font-semibold text-stone-900 tracking-wide">
              Sign In
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your credentials to access your NAVA account.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckIcon className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Unified Email / Mobile Phone + Password Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
              >
                Email Address or Mobile Number
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com or +91 98765 43210"
                className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-brand-maroon focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-brand-maroon focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-maroon hover:bg-brand-deepMaroon text-white font-medium text-xs rounded-xl tracking-wider uppercase transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Secondary Option: Continue with Google */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-stone-400 font-medium tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 border border-stone-300 hover:border-stone-400 bg-white text-stone-700 font-medium text-xs rounded-xl tracking-wider transition-colors shadow-sm flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>New to NAVA Creations?</span>
              <Link
                href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
                prefetch={true}
                className="text-brand-maroon font-semibold hover:underline"
              >
                Join Atelier Account
              </Link>
            </div>

            {/* Test Helper for automated E2E & Local Verification */}
            <div className="pt-2 border-t border-dashed border-stone-200 text-center">
              <button
                type="button"
                onClick={handleTestCustomerLogin}
                className="text-[11px] text-stone-400 hover:text-brand-maroon transition-colors"
              >
                Prototype Mode: Instant Seed Login (Priya Sharma)
              </button>
            </div>
          </div>
        </div>

        {/* Discrete Admin Gateway Link for Store Owners & Management */}
        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-brand-maroon transition-colors py-1.5 px-3.5 rounded-full hover:bg-white/80 border border-transparent hover:border-brand-sand shadow-none hover:shadow-sm"
          >
            <span>Studio Admin Login</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center text-xs text-stone-500">
          Loading login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
