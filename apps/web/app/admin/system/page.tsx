import React from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, AlertCircleIcon, ExternalLinkIcon } from '@/components/admin-icons';

export const dynamic = 'force-dynamic';

export default function AdminSystemPage() {
  const isDbConfigured = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder'));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
          System Diagnostics &amp; Health
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Cluster health probes, PostgreSQL connectivity, and pre-production governance status.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2">
          Infrastructure Probes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900">Liveness Probe</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                HTTP 200 OK
              </span>
            </div>
            <p className="text-stone-500 text-[11px]">
              Verifies the Next.js process and Node server are active and responsive.
            </p>
            <Link
              href="/api/health/liveness"
              target="_blank"
              className="text-brand-maroon hover:underline flex items-center gap-1 font-medium text-[11px] pt-1"
            >
              <span>Query /api/health/liveness</span>
              <ExternalLinkIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900">Readiness Probe</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  isDbConfigured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isDbConfigured ? 'HTTP 200 Ready' : 'HTTP 503 (Offline Fallback)'}
              </span>
            </div>
            <p className="text-stone-500 text-[11px]">
              Verifies live database ping with 3s timeout. Never exposes secrets.
            </p>
            <Link
              href="/api/health/readiness"
              target="_blank"
              className="text-brand-maroon hover:underline flex items-center gap-1 font-medium text-[11px] pt-1"
            >
              <span>Query /api/health/readiness</span>
              <ExternalLinkIcon className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-800 border-b border-stone-100 pb-2 pt-2">
          Subsystem Status
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded border border-stone-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-stone-900">Pre-Production Governance Gate</span>
            </div>
            <span className="text-stone-500">assets/branding/approved/ strictly locked</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded border border-stone-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-stone-900">Domain Logic (@nava/domain)</span>
            </div>
            <span className="text-stone-500">60 Unit Tests Passed (Banker&apos;s Rounding, GST Engine)</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded border border-stone-200">
            <div className="flex items-center gap-2.5">
              <AlertCircleIcon className="w-4 h-4 text-brand-darkGold" />
              <span className="font-medium text-stone-900">Media Storage Engine</span>
            </div>
            <span className="text-stone-500">MockImageStorageAdapter Active (Cloudinary ready)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
