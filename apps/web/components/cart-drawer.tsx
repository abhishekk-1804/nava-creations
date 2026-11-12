'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import {
  CloseIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingBagIcon,
  WhatsAppIcon,
  ArrowRightIcon,
} from './icons';
import { buildWhatsAppLink } from '@/lib/config';

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    totalItems,
    subtotalPaise,
    formatPrice,
  } = useCart();

  if (!isDrawerOpen) return null;

  const generateWhatsAppMessage = () => {
    let msg = 'Hello NAVA Creations! I would like to place an order for the following items:\n\n';
    items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.name} (${item.size || 'Standard'}) x ${item.quantity} — ${formatPrice(item.pricePaise * item.quantity)}\n`;
    });
    msg += `\n*Subtotal:* ${formatPrice(subtotalPaise)}\n`;
    msg += 'Please confirm availability and dispatch timeline. Thank you!';
    return msg;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-brand-ivory">
            <div className="flex items-center gap-2">
              <ShoppingBagIcon className="w-5 h-5 text-brand-maroon" />
              <h2 className="font-serif text-lg font-medium text-stone-900">
                Shopping Bag ({totalItems})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-2 text-stone-500 hover:text-stone-800 rounded focus:outline-none"
              aria-label="Close cart"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-stone-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-stone-400 mb-4">
                  <ShoppingBagIcon className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg text-stone-800 mb-1">Your bag is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Discover our handmade bangles, royal Kundan jewellery, and bridal heirlooms.
                </p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-maroon text-white rounded text-sm font-medium hover:bg-brand-deepMaroon transition-colors"
                >
                  <span>Explore Accessories</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-4 pt-2">
                {items.map((item) => (
                  <li key={item.id} className="pt-4 flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <ShoppingBagIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-stone-900 leading-snug line-clamp-2">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-stone-400 hover:text-red-700 transition-colors ml-2"
                            aria-label="Remove item"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        {item.size && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[11px] bg-stone-100 text-stone-700 rounded font-medium">
                            Size: {item.size}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-stone-200 rounded">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-stone-600 hover:text-stone-900"
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-sm font-semibold text-stone-900">
                            {formatPrice(item.pricePaise * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[10px] text-stone-500">
                              {formatPrice(item.pricePaise)} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer & Actions */}
          {items.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-brand-ivory space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-stone-600">Subtotal</span>
                <span className="text-lg font-serif font-semibold text-stone-900">
                  {formatPrice(subtotalPaise)}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Taxes included. Standard shipping calculated at checkout.
              </p>

              <div className="pt-2 space-y-2">
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-maroon text-white rounded text-sm font-medium hover:bg-brand-deepMaroon transition-colors"
                >
                  <span>View Bag &amp; Full Details</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>

                <a
                  href={buildWhatsAppLink(generateWhatsAppMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 text-white rounded text-sm font-medium hover:bg-emerald-800 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Order Directly on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
