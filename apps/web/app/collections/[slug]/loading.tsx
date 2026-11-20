import React from 'react';

export default function CollectionLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 animate-pulse" aria-busy="true" aria-label="Loading Collection">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-10 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-16 bg-brand-sand/60 rounded" />
        <div className="h-3 w-3 bg-brand-sand/40 rounded-full" />
        <div className="h-3 w-28 bg-brand-sand/80 rounded" />
      </div>

      {/* Collection Hero Banner Skeleton */}
      <div className="bg-brand-deepMaroon rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-center">
        <div className="p-8 sm:p-12 lg:p-16 space-y-6">
          <div className="h-3 w-36 bg-brand-gold/40 rounded" />
          <div className="h-10 w-3/4 bg-white/20 rounded-lg" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-2/3 bg-white/10 rounded" />
          <div className="flex gap-4 pt-2">
            <div className="h-11 w-44 bg-brand-gold/40 rounded-lg" />
            <div className="h-11 w-44 bg-emerald-700/40 rounded-lg" />
          </div>
        </div>
        <div className="h-64 lg:h-full min-h-[320px] bg-[#250812] border-t lg:border-t-0 lg:border-l border-brand-gold/20 flex items-center justify-center p-6">
          <div className="w-full h-full max-h-[260px] bg-white/5 rounded-xl border border-brand-gold/20" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="space-y-6">
        <div className="h-7 w-56 bg-brand-sand/70 rounded border-b border-brand-sand pb-4" />
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
    </div>
  );
}
