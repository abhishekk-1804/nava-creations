import React from 'react';

export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 animate-pulse" aria-busy="true" aria-label="Loading Product">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-10 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-12 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-28 bg-brand-sand/80 rounded" />
      </div>

      {/* Main Product Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery Column */}
        <div className="space-y-4">
          <div className="w-full aspect-square bg-brand-cream/80 rounded-2xl border border-brand-sand" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-20 h-20 rounded-lg bg-brand-cream/60 border border-stone-200" />
            ))}
          </div>
        </div>

        {/* Product Info Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-brand-darkGold/40 rounded" />
            <div className="h-9 w-4/5 bg-brand-sand/80 rounded" />
            <div className="h-3 w-24 bg-brand-sand/40 rounded" />
          </div>

          {/* Price Box */}
          <div className="p-4 bg-brand-cream/60 rounded-lg border border-brand-sand flex justify-between items-center">
            <div className="h-8 w-32 bg-brand-sand/80 rounded" />
            <div className="h-4 w-28 bg-brand-sand/50 rounded" />
          </div>

          {/* Size Pills Row */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-brand-sand/70 rounded" />
              <div className="h-3 w-36 bg-brand-sand/50 rounded" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-white rounded-lg border border-stone-200" />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="h-12 w-full bg-brand-maroon/40 rounded-xl" />
            <div className="h-12 w-full bg-emerald-700/30 rounded-xl" />
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-brand-sand">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-brand-cream/50 rounded-lg border border-brand-sand/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
