import React from 'react';

export default function CartLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-pulse" aria-busy="true" aria-label="Loading Bag">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-10 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-24 bg-brand-sand/80 rounded" />
      </div>

      <div className="h-8 w-48 bg-brand-sand/80 rounded" />

      {/* Cart Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        {/* Items Column */}
        <div className="lg:col-span-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-stone-200">
              <div className="w-24 h-24 bg-brand-cream/80 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-brand-sand/70 rounded" />
                <div className="h-3 w-20 bg-brand-sand/40 rounded" />
                <div className="h-4 w-16 bg-brand-sand/80 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-4">
          <div className="p-6 bg-white rounded-xl border border-stone-200 space-y-4">
            <div className="h-5 w-32 bg-brand-sand/80 rounded" />
            <div className="space-y-2 py-3 border-y border-stone-100">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-brand-sand/50 rounded" />
                <div className="h-3 w-16 bg-brand-sand/50 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-brand-sand/50 rounded" />
                <div className="h-3 w-16 bg-brand-sand/50 rounded" />
              </div>
            </div>
            <div className="h-12 w-full bg-brand-maroon/40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
