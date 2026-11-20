import React from 'react';

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-pulse" aria-busy="true" aria-label="Loading Shop">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-10 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-14 bg-brand-sand/80 rounded" />
      </div>

      {/* Page Header Skeleton */}
      <div className="border-b border-brand-sand pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-brand-darkGold/40 rounded" />
          <div className="h-8 w-64 bg-brand-sand/80 rounded" />
          <div className="h-3 w-40 bg-brand-sand/50 rounded" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-8 w-48 sm:w-60 bg-brand-sand/40 rounded" />
          <div className="h-8 w-28 bg-brand-sand/40 rounded" />
          <div className="h-8 w-28 bg-brand-sand/40 rounded" />
          <div className="h-8 w-16 bg-brand-maroon/30 rounded" />
        </div>
      </div>

      {/* Category Pills Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <div className="h-7 w-20 bg-brand-maroon/40 rounded-full" />
        <div className="h-7 w-32 bg-brand-sand/50 rounded-full" />
        <div className="h-7 w-28 bg-brand-sand/50 rounded-full" />
        <div className="h-7 w-36 bg-brand-sand/50 rounded-full" />
        <div className="h-7 w-24 bg-brand-sand/50 rounded-full" />
      </div>

      {/* 8-Card Product Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex flex-col bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-sm p-4 space-y-4"
          >
            <div className="relative aspect-square w-full bg-brand-cream/70 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-brand-darkGold/30 rounded" />
              <div className="h-4 w-3/4 bg-brand-sand/70 rounded" />
              <div className="flex gap-1.5 pt-1">
                <div className="h-4 w-8 bg-brand-cream rounded" />
                <div className="h-4 w-8 bg-brand-cream rounded" />
                <div className="h-4 w-8 bg-brand-cream rounded" />
              </div>
            </div>
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div className="h-5 w-20 bg-brand-sand/80 rounded" />
              <div className="h-9 w-24 bg-brand-maroon/30 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
