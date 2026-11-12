'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderDto } from '@/lib/order-service';

export default function AtelierPackingSlipPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else {
          setError('Order not found or unauthorized.');
        }
      } catch (_e) {
        setError('Network error fetching order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto"></div>
          <p className="mt-3 text-xs text-stone-600 uppercase tracking-widest font-mono">
            Generating Atelier Packing Slip...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl border border-stone-200 max-w-md w-full text-center shadow-sm">
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-2">Slip Unavailable</h2>
          <p className="text-xs text-stone-500 mb-6">{error || 'Order record could not be loaded.'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded hover:bg-stone-800"
          >
            Return to Orders
          </button>
        </div>
      </div>
    );
  }

  const formatRupees = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 print:p-0 print:bg-white text-stone-900">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
        >
          &larr; Back to Orders Queue
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 shadow transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Print Packing Slip (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 / 80mm Compatible) */}
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 border border-stone-300 shadow-md print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-stone-900 pb-6 flex items-start justify-between">
          <div>
            <span className="font-serif text-2xl font-bold tracking-[0.2em] text-stone-900 block">
              NAVA CREATIONS
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-stone-600 block mt-0.5">
              Handcrafted Artisanal Jewellery &bull; Bengaluru Atelier
            </span>
            <span className="text-[11px] text-stone-500 block mt-1">
              Dispatch Origin: Bengaluru, Karnataka (GST State Code: 29)
            </span>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-stone-900 text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded">
              ATELIER PACKING SLIP
            </span>
            <div className="font-mono text-xs font-bold text-stone-900 mt-2">
              Order #{order.orderNumber}
            </div>
            <div className="text-[11px] text-stone-500">
              Date: {orderDate}
            </div>
          </div>
        </div>

        {/* Destination & Order Summary Grid */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-stone-200">
          <div>
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-2">
              Ship To Customer:
            </h3>
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm text-stone-900">{order.shippingAddress.name}</p>
              <p className="text-stone-700">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-stone-700">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="font-semibold text-stone-900">
                {order.shippingAddress.city}, {order.shippingAddress.stateName} &ndash; {order.shippingAddress.postalCode}
              </p>
              <p className="font-mono text-stone-700 pt-1">
                Phone: <span className="font-bold">{order.shippingAddress.phone}</span>
              </p>
            </div>
          </div>

          <div className="border-l border-stone-100 pl-6 text-xs space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 block">
                Payment Verification:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    order.payment?.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : order.paymentMethod === 'COD'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  {order.payment?.status === 'VERIFIED'
                    ? 'PREPAID — BANK CONFIRMED'
                    : order.paymentMethod === 'COD'
                    ? 'CASH ON DELIVERY (COLLECT CASH)'
                    : order.paymentMethod}
                </span>
              </div>
            </div>

            {order.payment?.claimedUtr && (
              <div>
                <span className="text-[10px] text-stone-400 block">Claimed Customer UTR:</span>
                <span className="font-mono text-[11px] font-semibold text-stone-800">
                  {order.payment.claimedUtr}
                </span>
              </div>
            )}

            {order.payment?.verifiedTransactionId && (
              <div>
                <span className="text-[10px] text-stone-400 block">Verified Bank Ref:</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-800">
                  {order.payment.verifiedTransactionId}
                </span>
              </div>
            )}

            {order.courierAwb && (
              <div>
                <span className="text-[10px] text-stone-400 block">Courier Tracking AWB:</span>
                <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                  {order.courierAwb}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Packing Item Manifest */}
        <div className="py-6 border-b border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-stone-500">
              Parcel Item Contents &amp; Sizing Checklist
            </h3>
            <span className="text-[10px] text-stone-500 italic">
              HSN Code: 7117 (Handcrafted Imitation Jewellery)
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-50 font-semibold text-stone-700">
                <th className="py-2 px-3 w-10 text-center">Packed</th>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-3">SKU / Size Variant</th>
                <th className="py-2 px-3 text-center">Qty</th>
                <th className="py-2 px-3 text-right">Unit Price</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="py-3 px-3 text-center">
                    <div className="w-4 h-4 border-2 border-stone-400 rounded-sm mx-auto"></div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold block">{item.title}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                    {item.sku}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatRupees(item.unitPricePaise)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    {formatRupees(item.totalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Atelier Quality Sign-off */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-stone-200">
          {/* Quality & Packing Checklist */}
          <div className="space-y-2 text-xs text-stone-700">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-2">
              Atelier Quality Inspection
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-stone-400 rounded-sm"></div>
                <span>Size &amp; Diameter Verified with Atelier Bangle Gauge</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-stone-400 rounded-sm"></div>
                <span>Velvet Storage Box &amp; Soft Cushion Enclosed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-stone-400 rounded-sm"></div>
                <span>Tamper-Evident Security Bubble Seal Applied</span>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between text-[11px] border-t border-stone-100">
              <span>Packer Signature: ____________________</span>
              <span>Date: {orderDate}</span>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatRupees(order.subtotalPaise)}</span>
            </div>

            {order.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Promotional Discount ({order.couponCode || 'APPLIED'}):</span>
                <span className="font-mono">&minus; {formatRupees(order.discountPaise)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>Shipping &amp; Delivery:</span>
              <span className="font-mono">
                {order.shippingPaise === 0 ? 'FREE' : formatRupees(order.shippingPaise)}
              </span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>GST (Included @ 3% HSN 7117):</span>
              <span className="font-mono">{formatRupees(order.taxPaise)}</span>
            </div>

            <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-300">
              <span>
                {order.paymentMethod === 'COD' ? 'Amount to Collect on Delivery:' : 'Total Amount Paid:'}
              </span>
              <span className="font-mono text-base">{formatRupees(order.totalPaise)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="pt-6 text-center text-[10px] text-stone-500 space-y-1">
          <p className="font-semibold text-stone-700">
            Thank you for supporting traditional Indian handmade jewellery artisans.
          </p>
          <p>
            For order support or custom bridal bangle resizing, WhatsApp us at +91 98765 43210 quoting Order #{order.orderNumber}.
          </p>
        </div>
      </div>
    </div>
  );
}
