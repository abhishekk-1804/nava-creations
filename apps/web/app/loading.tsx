import React from 'react';

export default function RootLoading() {
  return (
    <div className="w-full animate-pulse" aria-busy="true" aria-label="Loading NAVA Creations">
      {/* Top Hero Showcase Skeleton */}
      <div className="bg-brand-cream border-b border-brand-sand py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="h-6 w-64 bg-brand-sand/60 rounded-full" />
            <div className="h-12 w-3/4 bg-brand-sand/80 rounded-xl" />
            <div className="h-4 w-full bg-brand-sand/50 rounded" />
            <div className="h-4 w-2/3 bg-brand-sand/50 rounded" />
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-44 bg-brand-maroon/40 rounded-lg" />
              <div className="h-12 w-36 bg-brand-sand/60 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md h-96 bg-brand-maroon/20 rounded-t-[140px] rounded-b-2xl border border-brand-gold/30" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-brand-sand/70 rounded" />
            <div className="h-8 w-48 bg-brand-sand rounded" />
          </div>
          <div className="h-6 w-20 bg-brand-sand/50 rounded" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
              <div className="w-full aspect-square bg-brand-cream rounded-lg" />
              <div className="h-4 w-3/4 bg-brand-sand/70 rounded" />
              <div className="h-4 w-1/2 bg-brand-sand/50 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-20 bg-brand-sand/70 rounded" />
                <div className="h-9 w-24 bg-brand-maroon/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
