import React from 'react';

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading Studio Administration">
      {/* Admin Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="h-8 w-56 bg-stone-300 rounded" />
          <div className="h-3 w-80 max-w-full bg-stone-200 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-brand-maroon/40 rounded" />
          <div className="h-9 w-28 bg-stone-200 rounded" />
        </div>
      </div>

      {/* 4 Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-stone-200 rounded" />
              <div className="w-4 h-4 bg-stone-200 rounded-full" />
            </div>
            <div className="h-7 w-16 bg-stone-300 rounded" />
            <div className="h-2.5 w-32 bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      {/* Table Shimmer Skeleton */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-stone-100">
          <div className="h-5 w-40 bg-stone-300 rounded" />
          <div className="h-4 w-20 bg-stone-200 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex-shrink-0" />
                <div className="space-y-1">
                  <div className="h-3.5 w-48 bg-stone-200 rounded" />
                  <div className="h-2.5 w-24 bg-stone-100 rounded" />
                </div>
              </div>
              <div className="h-3.5 w-20 bg-stone-200 rounded" />
              <div className="h-6 w-20 bg-stone-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
