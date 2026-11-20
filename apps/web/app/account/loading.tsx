import React from 'react';

export default function AccountLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-pulse" aria-busy="true" aria-label="Loading Account">
      {/* Header Profile Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-brand-sand gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-sand/60 flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-brand-sand/80 rounded" />
            <div className="h-3 w-32 bg-brand-sand/40 rounded" />
          </div>
        </div>
        <div className="h-8 w-24 bg-stone-200 rounded-lg" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex border-b border-brand-sand space-x-8">
        <div className="pb-3 h-5 w-28 bg-brand-maroon/40 rounded" />
        <div className="pb-3 h-5 w-32 bg-brand-sand/40 rounded" />
        <div className="pb-3 h-5 w-36 bg-brand-sand/40 rounded" />
      </div>

      {/* Order Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-brand-sand rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-stone-100">
              <div className="space-y-1">
                <div className="h-4 w-32 bg-brand-sand/80 rounded" />
                <div className="h-3 w-24 bg-brand-sand/40 rounded" />
              </div>
              <div className="h-6 w-24 bg-brand-sand/50 rounded-full" />
            </div>
            <div className="flex items-center gap-4 py-2">
              <div className="w-16 h-16 bg-brand-cream rounded-lg flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/2 bg-brand-sand/70 rounded" />
                <div className="h-3 w-28 bg-brand-sand/40 rounded" />
              </div>
              <div className="h-4 w-16 bg-brand-sand/80 rounded" />
            </div>
            <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
              <div className="h-4 w-28 bg-brand-sand/50 rounded" />
              <div className="h-5 w-24 bg-brand-sand/80 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
