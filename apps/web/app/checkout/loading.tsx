import React from 'react';

export default function CheckoutLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-pulse" aria-busy="true" aria-label="Loading Checkout">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-10 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-10 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-20 bg-brand-sand/80 rounded" />
      </div>

      <div className="h-8 w-48 bg-brand-sand/80 rounded" />

      {/* Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <div className="h-5 w-40 bg-brand-sand/80 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-10 bg-stone-100 rounded-lg" />
              <div className="h-10 bg-stone-100 rounded-lg" />
            </div>
            <div className="h-10 bg-stone-100 rounded-lg" />
            <div className="h-10 bg-stone-100 rounded-lg" />
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-5">
          <div className="bg-brand-cream/60 rounded-xl border border-brand-sand p-6 space-y-4">
            <div className="h-5 w-36 bg-brand-sand/80 rounded" />
            <div className="space-y-3 py-3 border-y border-brand-sand/50">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-brand-sand/40 rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-3/4 bg-brand-sand/70 rounded" />
                  <div className="h-3 w-20 bg-brand-sand/40 rounded" />
                </div>
              </div>
            </div>
            <div className="h-12 w-full bg-brand-maroon/40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
