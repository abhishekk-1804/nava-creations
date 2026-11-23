import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, CheckIcon, ArrowRightIcon, ShoppingBagIcon } from '@/components/icons';

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string;
    order_id?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const orderNumber = params.orderNumber || params.order_id || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-brand-maroon">
          Shop
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium">Order Confirmation</span>
      </nav>

      {/* Main Confirmation Card */}
      <div className="bg-white rounded-2xl border border-brand-sand shadow-sm p-8 sm:p-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
          <CheckIcon className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block">
            NAVA CREATIONS Atelier &bull; Bengaluru
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900">
            Order Successfully Placed
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            Thank you for shopping with NAVA Creations. Our Bengaluru artisans are preparing your bespoke jewellery parcel.
          </p>
        </div>

        {orderNumber ? (
          <div className="p-6 bg-brand-cream/60 rounded-xl border border-brand-sand max-w-md mx-auto space-y-3">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block">
              Your Atelier Order Identifier
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-brand-maroon tracking-wider select-all">
              {orderNumber}
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Please save this order number. For UPI payments, submit your 12-digit Bank UTR reference on the order tracking desk to confirm verification.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 max-w-md mx-auto text-xs text-amber-900">
            Order confirmed. You can view all your active orders in your customer account.
          </div>
        )}

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          {orderNumber ? (
            <Link
              href={`/orders/${encodeURIComponent(orderNumber)}`}
              prefetch={true}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-maroon text-white rounded-xl text-xs font-semibold hover:bg-brand-deepMaroon transition-all shadow-sm"
            >
              <span>Track Order &amp; Submit UTR</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/account"
              prefetch={true}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-maroon text-white rounded-xl text-xs font-semibold hover:bg-brand-deepMaroon transition-all shadow-sm"
            >
              <span>View My Account Orders</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/shop"
            prefetch={true}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-300 text-stone-800 rounded-xl text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            <ShoppingBagIcon className="w-4 h-4 text-stone-500" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
