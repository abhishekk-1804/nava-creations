'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRightIcon, AlertCircleIcon, CheckIcon, UserIcon, ShieldCheckIcon } from '@/components/icons';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const [activeTab, setActiveTab] = useState<'email_otp' | 'google' | 'guest_track'>('email_otp');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [guestToken, setGuestToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testOtpHint, setTestOtpHint] = useState<string | null>(null);

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

  // Send Email OTP via Supabase Auth (or test fallback)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const origin = window.location.origin;
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
          },
        });
        if (otpError) throw otpError;

        setOtpSent(true);
        setSuccess(`Verification passcode dispatched to ${cleanEmail}. Check your inbox.`);
      } else {
        // Prototype / Automated test fallback
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, action: 'send_otp' }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to dispatch verification code');
        }

        setOtpSent(true);
        setSuccess(data.message || 'Verification passcode sent to your email.');
        if (data.testOtp) {
          setTestOtpHint(data.testOtp);
          setOtpCode(data.testOtp);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify Email OTP passcode
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'email',
        });
        if (verifyError) throw verifyError;

        if (data?.session) {
          setSuccess('Authenticated successfully. Redirecting to your account...');
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 300);
          return;
        }
      }

      // Fallback for prototype mode / test runners
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid passcode');
      }

      setSuccess('Authenticated successfully. Redirecting to your account...');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
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
          otp: '123456',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test login failed');

      setSuccess('Logged in as test customer. Redirecting...');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 200);
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
          {/* Method Tabs */}
          <div className="flex border-b border-stone-200 gap-4 text-xs font-medium pb-2 items-center">
            <button
              type="button"
              onClick={() => { setActiveTab('email_otp'); setError(null); }}
              className={`pb-1 transition-colors ${
                activeTab === 'email_otp'
                  ? 'border-b-2 border-brand-maroon text-brand-maroon font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('google'); setError(null); }}
              className={`pb-1 transition-colors ${
                activeTab === 'google'
                  ? 'border-b-2 border-brand-maroon text-brand-maroon font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Google
            </button>
            {/* Phone (SMS) - Disabled for Phase 3 with tooltip */}
            <button
              type="button"
              disabled
              title="SMS Gateway integration planned for Phase 4"
              className="pb-1 text-stone-300 cursor-not-allowed flex items-center gap-1 opacity-60"
            >
              <span>Phone (SMS)</span>
              <span className="text-[9px] bg-stone-100 text-stone-400 px-1 py-0.2 rounded font-mono">Phase 4</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('guest_track'); setError(null); }}
              className={`pb-1 transition-colors ${
                activeTab === 'guest_track'
                  ? 'border-b-2 border-brand-maroon text-brand-maroon font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Guest Order
            </button>
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

          {/* TAB 1: EMAIL OTP */}
          {activeTab === 'email_otp' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-brand-maroon focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-brand-maroon hover:bg-brand-deepMaroon text-white font-medium text-xs rounded-xl tracking-wider uppercase transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Sending Code...' : 'Send One-Time Passcode'}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    Passcode sent to <strong className="text-stone-900">{email}</strong>.{' '}
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      className="text-brand-maroon underline font-medium ml-1"
                    >
                      Change
                    </button>
                    {testOtpHint && (
                      <div className="mt-1 text-[11px] text-brand-darkGold font-mono">
                        Test Mode OTP: {testOtpHint}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Enter 6-Digit Passcode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      placeholder="123456"
                      className="w-full px-4 py-2.5 text-center text-lg tracking-[0.3em] font-mono bg-stone-50 border border-stone-200 rounded-xl focus:border-brand-maroon focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full py-3 px-4 bg-brand-maroon hover:bg-brand-deepMaroon text-white font-medium text-xs rounded-xl tracking-wider uppercase transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE SIGN-IN */}
          {activeTab === 'google' && (
            <div className="space-y-4 text-center py-2">
              <p className="text-xs text-stone-600">
                Sign in with your Google account for instantaneous, passwordless atelier access.
              </p>
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
            </div>
          )}

          {/* TAB 4: GUEST ORDER LOOKUP & CLAIM */}
          {activeTab === 'guest_track' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                Track a guest order or link it to your account using your Order Number and 32-byte Access Token.
              </p>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. NAV-2026-8821"
                  className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-brand-maroon focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Guest Access Token
                </label>
                <input
                  type="text"
                  value={guestToken}
                  onChange={(e) => setGuestToken(e.target.value)}
                  placeholder="32-byte hex token received on confirmation"
                  className="w-full px-4 py-2.5 text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl focus:border-brand-maroon focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (orderNumber.trim()) {
                    window.location.href = `/orders/${orderNumber.trim()}?token=${encodeURIComponent(guestToken.trim())}`;
                  }
                }}
                disabled={!orderNumber.trim()}
                className="w-full py-3 px-4 bg-brand-maroon hover:bg-brand-deepMaroon text-white font-medium text-xs rounded-xl tracking-wider uppercase transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span>Track Order</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Security Notice: Passwordless OTP Helper */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-center text-xs text-stone-600 font-medium bg-brand-cream/60 py-2 px-3 rounded-xl border border-brand-sand/70">
            <ShieldCheckIcon className="w-4 h-4 text-brand-darkGold flex-shrink-0" />
            <span>For security, we use passwordless OTP login.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>New to NAVA Creations?</span>
              <Link
                href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
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
