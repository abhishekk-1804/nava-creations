'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import {
  ShoppingBagIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from '@/components/icons';
import { buildWhatsAppLink } from '@/lib/config';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotalPaise,
    formatPrice,
    totalItems,
    validateCartWithServer,
  } = useCart();
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (items.length > 0) {
      validateCartWithServer().then((warns) => {
        if (warns && warns.length > 0) {
          setWarnings(warns);
        }
      });
    }
  }, [items.length, validateCartWithServer]);

  const generateWhatsAppOrder = () => {
    let msg = 'Hello NAVA Creations! I would like to place an order from your website:\n\n';
    items.forEach((item, idx) => {
      msg += `*${idx + 1}. ${item.name}*\n`;
      msg += `   Size: ${item.size || 'Standard'}\n`;
      msg += `   Qty: ${item.quantity}\n`;
      msg += `   Price: ${formatPrice(item.pricePaise * item.quantity)}\n\n`;
    });
    msg += `*Subtotal:* ${formatPrice(subtotalPaise)}\n`;
    msg += `*Delivery Location:* Bengaluru / Other (Please confirm shipping charge)\n\n`;
    msg += 'Kindly confirm order availability and UPI/Bank transfer details. Thank you!';
    return msg;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium">Shopping Bag</span>
      </nav>

      <div className="border-b border-brand-sand pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900">
          Your Shopping Bag
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          {totalItems > 0
            ? `Review your ${totalItems} selected accessory piece${totalItems > 1 ? 's' : ''}.`
            : 'Your bag is currently empty.'}
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircleIcon className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Catalogue Inventory &amp; Price Reconciled</span>
          </div>
          {warnings.map((w, idx) => (
            <p key={idx} className="text-amber-800 text-[11px] pl-6">
              &bull; {w}
            </p>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-stone-200 p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-brand-maroon mx-auto mb-4">
            <ShoppingBagIcon className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl text-stone-900 mb-2">No items in your bag</h2>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            Explore our artisanal bangles, royal Kundan bridal sets, and handcrafted accessories.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 bg-brand-maroon text-white rounded text-sm font-medium hover:bg-brand-deepMaroon transition-colors"
          >
            <span>Explore Accessories</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-sm">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ShoppingBagIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Information */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-base font-medium text-stone-900">
                          <Link href={`/products/${item.productId}`} className="hover:text-brand-maroon">
                            {item.name}
                          </Link>
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-stone-400 hover:text-red-700 transition-colors ml-2"
                          aria-label="Remove item"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {item.size && (
                          <span className="px-2 py-0.5 text-xs bg-brand-cream text-stone-800 rounded font-medium">
                            Size: {item.size}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 font-mono">
                          SKU: {item.sku}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-stone-300 rounded bg-stone-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-stone-600 hover:text-stone-900"
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-base font-semibold text-stone-900">
                          {formatPrice(item.pricePaise * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[11px] text-stone-500">
                            {formatPrice(item.pricePaise)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-stone-500 pt-2">
              <Link href="/shop" className="hover:text-brand-maroon underline">
                &larr; Continue Shopping
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="hover:text-red-700 underline"
              >
                Clear Bag
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Bag Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-stone-900">{formatPrice(subtotalPaise)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Estimated Shipping</span>
                  <span className="text-emerald-700 font-medium">
                    {subtotalPaise >= 199900 ? 'Free Shipping' : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>GST Taxes</span>
                  <span className="text-stone-500">Included in price (MRP)</span>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-stone-900">Total Payable</span>
                <span className="font-serif text-2xl font-bold text-brand-maroon">
                  {formatPrice(subtotalPaise)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-maroon text-white rounded-lg text-sm font-semibold hover:bg-brand-deepMaroon transition-all shadow-sm hover:shadow"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-stone-400">or</span>
                  <div className="flex-grow border-t border-stone-200"></div>
                </div>

                <a
                  href={buildWhatsAppLink(generateWhatsAppOrder())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Order on WhatsApp (Concierge)</span>
                </a>

                <div className="p-3 bg-stone-50 rounded border border-stone-200 text-center">
                  <span className="text-[11px] text-stone-600 block">
                    Zero-fee BharatPe UPI QR &amp; Cash on Delivery (COD) supported.
                  </span>
                  <span className="text-[10px] text-brand-darkGold font-medium block mt-0.5">
                    Direct dispatch from Bengaluru studio with real-time tracking.
                  </span>
                </div>
              </div>
            </div>

            {/* Reassurance Features */}
            <div className="bg-brand-cream/60 rounded-xl border border-brand-sand p-4 space-y-3 text-xs text-stone-700">
              <div className="flex items-center gap-2.5">
                <ShieldCheckIcon className="w-4 h-4 text-brand-maroon flex-shrink-0" />
                <span>Safe velvet case packing for zero transit damage.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <TruckIcon className="w-4 h-4 text-brand-maroon flex-shrink-0" />
                <span>Pan-India courier with real-time tracking.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
