'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  CheckIcon,
} from '@/components/icons';
import { OrderDto } from '@/lib/order-service';

interface OrderTrackingPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { orderNumber } = use(params);

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrSuccessMsg, setUtrSuccessMsg] = useState<string | null>(null);
  const [utrErrorMsg, setUtrErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (!res.ok) {
          throw new Error('Order not found');
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrErrorMsg(null);
    setUtrSuccessMsg(null);

    const cleanUtr = utrInput.trim();
    if (!/^[0-9A-Za-z]{12,22}$/.test(cleanUtr)) {
      setUtrErrorMsg('Please enter a valid 12-digit Indian Bank UTR or UPI Reference Number.');
      return;
    }

    setIsSubmittingUtr(true);

    try {
      const res = await fetch(`/api/orders/${orderNumber}/submit-utr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimedUtr: cleanUtr }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit UPI reference');
      }

      setUtrSuccessMsg(data.message || 'UTR reference recorded successfully.');
      setOrder(data.order);
      setUtrInput('');
    } catch (err: unknown) {
      setUtrErrorMsg(err instanceof Error ? err.message : 'Error submitting UTR reference');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-stone-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircleIcon className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl text-stone-900">Order Not Found</h1>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          We could not locate reference <span className="font-mono font-semibold">{orderNumber}</span>. Please verify the link or contact our studio on WhatsApp.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-maroon text-white rounded text-xs font-semibold hover:bg-brand-deepMaroon"
        >
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  const isUpi = order.paymentMethod === 'UPI_MERCHANT_QR';
  const isPaymentVerified = order.payment?.status === 'VERIFIED';
  const hasSubmittedUtr = Boolean(order.payment?.claimedUtr);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
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
        <span className="text-stone-900 font-medium">Order {order.orderNumber}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
              Order {order.orderNumber}
            </h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                isPaymentVerified || order.status === 'PAYMENT_CONFIRMED' || order.status === 'PROCESSING'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'AWAITING_PAYMENT_VERIFICATION'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-stone-100 text-stone-800'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} &bull; Direct dispatch from Bengaluru Studio
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-stone-500 block">Total Amount</span>
          <span className="font-serif text-2xl font-bold text-brand-maroon">
            {formatPrice(order.totalPaise)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Payment Verification & Instructions */}
        <div className="lg:col-span-7 space-y-6">
          {isUpi ? (
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <h2 className="font-serif text-lg font-medium text-stone-900">
                  BharatPe Merchant UPI Payment
                </h2>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  Zero Transaction Surcharge
                </span>
              </div>

              {isPaymentVerified ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckIcon className="w-5 h-5 text-emerald-700" />
                    <span>Payment Verified &amp; Settled</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 pl-7">
                    Bank Credit Reference: <span className="font-mono font-bold">{order.payment?.verifiedTransactionId}</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 pl-7">
                    Verified on {order.payment?.verifiedAt ? new Date(order.payment.verifiedAt).toLocaleString('en-IN') : 'Confirmed'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step 1: Scan & Pay Details */}
                  <div className="space-y-4 text-xs">
                    <p className="text-stone-600 leading-relaxed">
                      Please scan our official BharatPe UPI QR code below with any UPI application (Google Pay, PhonePe, Paytm, BHIM) or tap the link on mobile.
                    </p>

                    <div className="bg-brand-cream/60 rounded-xl border border-brand-sand/70 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                            Beneficiary UPI VPA
                          </span>
                          <span className="font-mono font-bold text-stone-900 text-sm select-all">
                            nava.creations@bharatpe
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                            Merchant Name
                          </span>
                          <span className="font-medium text-stone-800">
                            NAVA CREATIONS STUDIO
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                            Exact Amount Payable
                          </span>
                          <span className="font-serif font-bold text-brand-maroon text-lg">
                            {formatPrice(order.totalPaise)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                            Order Remarks Tag
                          </span>
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-700 font-semibold select-all">
                            NAVA-{order.orderNumber}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-stone-200 text-center">
                        {/* QR Placeholder/Image */}
                        <div className="w-36 h-36 bg-stone-50 border border-stone-300 rounded flex flex-col items-center justify-center p-2">
                          <ShoppingBagIcon className="w-8 h-8 text-brand-maroon mb-1" />
                          <span className="text-[9px] font-mono text-stone-500 font-semibold">
                            BHARATPE QR
                          </span>
                          <span className="text-[8px] text-stone-400">
                            Scan with any UPI App
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 mt-2 block">
                          Instant NPCI Direct Settlement
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Customer UTR Submission */}
                  <div className="border-t border-stone-100 pt-6 space-y-4">
                    <h3 className="font-serif text-sm font-medium text-stone-900">
                      Submit Your 12-Digit UPI UTR Reference
                    </h3>

                    {utrSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs">
                        {utrSuccessMsg}
                      </div>
                    )}

                    {utrErrorMsg && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs">
                        {utrErrorMsg}
                      </div>
                    )}

                    {hasSubmittedUtr ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <CheckIcon className="w-4 h-4 text-amber-700" />
                          <span>UTR Reference Recorded</span>
                        </div>
                        <p className="text-[11px] text-amber-800 pl-6">
                          Claimed Reference: <span className="font-mono font-bold">{order.payment?.claimedUtr}</span>
                        </p>
                        <p className="text-[10px] text-amber-700 pl-6">
                          Our atelier manager is currently matching this reference against our bank settlement ledger. You will receive dispatch updates as soon as verified.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitUtr} className="space-y-3">
                        <p className="text-xs text-stone-600">
                          After making the UPI payment, find the 12-digit UPI Transaction ID / UTR in your GPay/PhonePe receipt and enter it here:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            required
                            maxLength={22}
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                            placeholder="e.g. 431289110099 (12 digits)"
                            className="flex-1 text-xs font-mono border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingUtr}
                            className="px-5 py-2 bg-brand-maroon text-white text-xs font-semibold rounded hover:bg-brand-deepMaroon transition-colors disabled:opacity-60"
                          >
                            {isSubmittingUtr ? 'Recording...' : 'Submit UTR Reference'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Cash on Delivery */
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">
                Cash on Delivery (COD) Instructions
              </h2>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900">
                  <TruckIcon className="w-5 h-5 text-brand-maroon" />
                  <span>Doorstep Cash Collection</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Please keep exact cash of <span className="font-bold text-stone-900">{formatPrice(order.totalPaise)}</span> ready upon arrival. Our courier partner will collect payment at your shipping address before handover.
                </p>
              </div>
            </div>
          )}

          {/* Delivery Address Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-3">
            <h2 className="font-serif text-base font-medium text-stone-900 border-b border-stone-100 pb-2">
              Shipping Destination
            </h2>
            <div className="text-xs text-stone-700 space-y-1">
              <span className="font-semibold text-stone-900 block">{order.shippingAddress.name}</span>
              <span>{order.shippingAddress.addressLine1}</span>
              {order.shippingAddress.addressLine2 && <span>, {order.shippingAddress.addressLine2}</span>}
              <span className="block">
                {order.shippingAddress.city}, {order.shippingAddress.stateName} — {order.shippingAddress.postalCode}
              </span>
              <span className="block text-stone-500 pt-1">
                Contact: {order.shippingAddress.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Item Breakdown & Studio Guarantee */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">
              Order Breakdown ({order.items.length} piece{order.items.length > 1 ? 's' : ''})
            </h2>

            <div className="divide-y divide-stone-100 space-y-3 text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex justify-between gap-3">
                  <div>
                    <span className="font-medium text-stone-900 block">{item.title}</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      SKU: {item.sku} &bull; Qty: {item.quantity}
                    </span>
                  </div>
                  <span className="font-semibold text-stone-900 flex-shrink-0">
                    {formatPrice(item.totalPaise)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">{formatPrice(order.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Pan-India Courier</span>
                <span className="font-medium text-stone-900">
                  {order.shippingPaise === 0 ? 'FREE' : formatPrice(order.shippingPaise)}
                </span>
              </div>
              <div className="border-t border-stone-100 pt-2 flex justify-between items-baseline font-semibold text-sm text-stone-900">
                <span>Total</span>
                <span className="font-serif text-xl font-bold text-brand-maroon">
                  {formatPrice(order.totalPaise)}
                </span>
              </div>
            </div>

            {order.courierAwb && (
              <div className="p-3 bg-stone-50 rounded border border-stone-200 text-xs text-stone-700 space-y-1">
                <span className="font-semibold block text-stone-900">Courier Tracking</span>
                <span>AWB / Reference: <span className="font-mono font-bold">{order.courierAwb}</span></span>
              </div>
            )}
          </div>

          <div className="bg-brand-cream/60 rounded-xl border border-brand-sand/60 p-4 space-y-3 text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-brand-maroon flex-shrink-0" />
              <span>Artisanal Kundan &amp; velvet bangles handcrafted in Bengaluru.</span>
            </div>
            <div className="flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-brand-maroon flex-shrink-0" />
              <span>Packaged in secure velvet boxes for zero transit distortion.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
