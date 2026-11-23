import React from 'react';

export default function AdminSettingsLoading() {
  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-stone-200 rounded"></div>
      <div className="h-4 w-96 bg-stone-100 rounded"></div>
      <div className="space-y-6 mt-8">
        <div className="h-64 bg-white rounded-xl border border-stone-200 p-6"></div>
        <div className="h-48 bg-white rounded-xl border border-stone-200 p-6"></div>
      </div>
    </div>
  );
}
