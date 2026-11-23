import React from 'react';

export default function CheckoutSuccessLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 animate-pulse space-y-8">
      <div className="h-4 w-48 bg-stone-200 rounded" />
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-stone-100 mx-auto" />
        <div className="h-8 w-64 bg-stone-200 mx-auto rounded" />
        <div className="h-24 w-80 bg-brand-cream/60 rounded-xl mx-auto" />
        <div className="h-10 w-44 bg-stone-200 mx-auto rounded-xl" />
      </div>
    </div>
  );
}
