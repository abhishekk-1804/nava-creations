'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LockIcon, ArrowRightIcon, AlertCircleIcon, CheckIcon } from '@/components/icons';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [authMode, setAuthMode] = useState<'credentials' | 'token'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already authenticated as administrator, redirect to /admin
  useEffect(() => {
    let isMounted = true;
    async function checkExistingAdmin() {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            window.location.href = '/admin';
            return;
          }
        }
      } catch (_e) {
        // Continue displaying admin login
      }
    }

    checkExistingAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Primary: Strictly authenticate via Supabase Auth when configured
      if (authMode === 'credentials' && isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (signInError) {
          throw new Error(signInError.message);
        }

        if (data?.session) {
          // Establish server-side admin session cookie for legacy API handlers
          await fetch('/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password }),
          }).catch(() => {});

          setSuccess(true);
          setTimeout(() => {
            window.location.href = '/admin';
          }, 200);
          return;
        }
      }

      // Fallback for local prototype verification / test runner environments
      const payload =
        authMode === 'credentials' && cleanEmail
          ? { email: cleanEmail, password }
          : { token: (token || password).trim() };

      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin';
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillSeedAdmin = () => {
    setAuthMode('credentials');
    setEmail('admin@nava-creations.internal');
    setPassword('Admin@Nava2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-deepMaroon border border-brand-gold/40 flex items-center justify-center text-brand-lightGold mx-auto mb-4 shadow-lg">
          <LockIcon className="w-7 h-7" />
        </div>
        <span className="font-serif text-2xl tracking-[0.2em] font-semibold text-white block">
          NAVA
        </span>
        <span className="text-xs uppercase tracking-widest text-brand-lightGold block font-medium">
          Studio Administration Portal
        </span>
        <p className="mt-2 text-xs text-stone-400">
          Private back-office interface for Bangalore store managers and inventory operators.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-stone-800/90 border border-stone-700/80 py-8 px-6 sm:px-10 rounded-xl shadow-2xl backdrop-blur-sm space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-stone-700 pb-2 gap-4 text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode('credentials'); setError(null); }}
              className={`pb-1 font-medium transition-colors border-b-2 ${
                authMode === 'credentials'
                  ? 'border-brand-gold text-brand-lightGold'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Email &amp; Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('token'); setError(null); }}
              className={`pb-1 font-medium transition-colors border-b-2 ${
                authMode === 'token'
                  ? 'border-brand-gold text-brand-lightGold'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Auth Token
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded text-xs flex items-center gap-2">
              <CheckIcon className="w-4 h-4 flex-shrink-0" />
              <span>Session authenticated! Redirecting to studio overview...</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {authMode === 'credentials' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nava-creations.internal"
                    className="w-full px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                  Administrative Secret Key / Token
                </label>
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter 32-character admin auth secret"
                  className="w-full px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-brand-gold font-mono"
                />
                <span className="text-[10px] text-stone-500 block mt-1">
                  Enter the secret configured in ADMIN_AUTH_SECRET
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-maroon hover:bg-brand-deepMaroon text-white rounded-lg text-xs font-semibold tracking-wider uppercase transition-all shadow disabled:opacity-40"
            >
              <span>{loading ? 'Verifying with Supabase...' : 'Authenticate Studio Session'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Prototype Helper */}
          <div className="pt-3 border-t border-stone-700/80">
            <button
              type="button"
              onClick={fillSeedAdmin}
              className="w-full py-1.5 px-3 bg-stone-900/80 hover:bg-stone-900 text-[11px] text-brand-lightGold border border-brand-gold/30 rounded transition-colors"
            >
              Use Seed Admin: admin@nava-creations.internal
            </button>
          </div>

          <div className="pt-2 border-t border-stone-700 text-center">
            <Link
              href="/"
              className="text-xs text-stone-400 hover:text-white transition-colors"
            >
              &larr; Return to Customer Storefront
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-stone-400">
          Enforcing Phase 3 Supabase Auth Governance &bull; Zero Public Registration
        </div>
      </div>
    </div>
  );
}
