'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import {
  ShoppingBagIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from '@/components/icons';

const INDIAN_STATES = [
  { code: '29', name: 'Karnataka' },
  { code: '27', name: 'Maharashtra' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '32', name: 'Kerala' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '07', name: 'Delhi NCR' },
  { code: '24', name: 'Gujarat' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '19', name: 'West Bengal' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '06', name: 'Haryana' },
  { code: '21', name: 'Odisha' },
  { code: '10', name: 'Bihar' },
  { code: '30', name: 'Goa' },
  { code: '18', name: 'Assam' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalPaise, formatPrice, totalItems, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateCode: '29',
    stateName: 'Karnataka',
    postalCode: '',
    paymentMethod: 'UPI_MERCHANT_QR' as 'UPI_MERCHANT_QR' | 'COD',
    customerNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Promotional Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponCode: string;
    discountPaise: number;
    discountRupees: string;
  } | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Authoritative Dynamic Shipping Configuration
  const [shippingConfig, setShippingConfig] = useState({
    freeShippingThresholdPaise: 199900,
    standardShippingFeePaise: 15000,
  });

  // Customer Authentication & Saved Addresses Integration
  const [customerUser, setCustomerUser] = useState<{ id: string; name?: string | null; email?: string | null; phone?: string | null } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string;
    recipientName: string;
    phone: string;
    streetLine1: string;
    streetLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    isDefault: boolean;
  }>>([]);

  useEffect(() => {
    // Check if customer is authenticated
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCustomerUser(data.user);
          setFormData((prev) => ({
            ...prev,
            name: prev.name || data.user?.name || '',
            email: prev.email || data.user?.email || '',
            phone: prev.phone || data.user?.phone || '',
          }));

          // Fetch saved addresses
          fetch('/api/customer/addresses')
            .then((res) => (res.ok ? res.json() : null))
            .then((addrData) => {
              if (addrData?.addresses && addrData.addresses.length > 0) {
                setSavedAddresses(addrData.addresses);
                const defaultAddr = addrData.addresses.find((a: { isDefault: boolean }) => a.isDefault) || addrData.addresses[0];
                if (defaultAddr) {
                  const stateMatch = INDIAN_STATES.find(
                    (s) => s.name.toLowerCase() === defaultAddr.state.toLowerCase()
                  );
                  setFormData((prev) => ({
                    ...prev,
                    name: prev.name || defaultAddr.recipientName,
                    phone: prev.phone || defaultAddr.phone,
                    addressLine1: defaultAddr.streetLine1,
                    addressLine2: defaultAddr.streetLine2 || '',
                    city: defaultAddr.city,
                    stateName: defaultAddr.state,
                    stateCode: stateMatch?.code || '29',
                    postalCode: defaultAddr.postalCode,
                  }));
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const [paymentSettings, setPaymentSettings] = useState<{
    codEnabled: boolean;
    isMerchantConfirmed: boolean;
    upiVpa?: string;
    merchantName?: string;
  }>({
    codEnabled: true,
    isMerchantConfirmed: true,
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          setShippingConfig({
            freeShippingThresholdPaise: data.settings.freeShippingThresholdPaise ?? 199900,
            standardShippingFeePaise: data.settings.standardShippingFeePaise ?? 15000,
          });
          setPaymentSettings({
            codEnabled: data.settings.codEnabled !== false,
            isMerchantConfirmed: data.settings.isMerchantConfirmed !== false,
            upiVpa: data.settings.upiVpa,
            merchantName: data.settings.merchantName,
          });
          if (data.settings.codEnabled === false) {
            setFormData((prev) => (prev.paymentMethod === 'COD' ? { ...prev, paymentMethod: 'UPI_MERCHANT_QR' } : prev));
          }
        }
      })
      .catch(() => {
        // Silently preserve safe fallback configuration
      });
  }, []);

  const discountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const netSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);
  const shippingPaise =
    netSubtotalPaise >= shippingConfig.freeShippingThresholdPaise
      ? 0
      : shippingConfig.standardShippingFeePaise;
  const totalPayablePaise = netSubtotalPaise + shippingPaise;

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);
    setCouponMsg(null);

    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsCheckingCoupon(true);

    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, subtotalPaise }),
      });

      const data = await res.json();
      if (!res.ok || !data.result?.isValid) {
        setCouponError(data.result?.rejectionReason || data.message || 'Invalid coupon code.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          couponCode: data.result.couponCode,
          discountPaise: data.result.discountPaise,
          discountRupees: data.result.discountRupees,
        });
        setCouponMsg(`Coupon '${data.result.couponCode}' applied! You saved ₹${data.result.discountRupees}.`);
        setCouponInput('');
      }
    } catch (_e) {
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg(null);
    setCouponError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'stateCode') {
      const selected = INDIAN_STATES.find((s) => s.code === value);
      setFormData((prev) => ({
        ...prev,
        stateCode: value,
        stateName: selected?.name || 'Karnataka',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Your shopping bag is empty.');
      return;
    }

    if (!formData.name || formData.name.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!formData.addressLine1 || formData.addressLine1.trim().length < 5) {
      setErrorMessage('Please provide a complete street address (minimum 5 characters).');
      return;
    }

    if (!formData.city || formData.city.trim().length < 2) {
      setErrorMessage('Please specify your city.');
      return;
    }

    if (!formData.stateName || formData.stateName.trim().length < 2) {
      setErrorMessage('Please specify your state.');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(formData.postalCode.trim())) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code (must start with digits 1-9).');
      return;
    }

    if (formData.paymentMethod === 'UPI_MERCHANT_QR' && !paymentSettings.isMerchantConfirmed) {
      setErrorMessage('Merchant UPI collection is not yet configured or approved by the business owner.');
      return;
    }

    if (formData.paymentMethod === 'COD' && !paymentSettings.codEnabled) {
      setErrorMessage('Cash on Delivery is currently disabled by store management.');
      return;
    }

    if (formData.paymentMethod === 'COD' && totalPayablePaise > 500000) {
      setErrorMessage('Cash on Delivery is only available for orders up to ₹5,000. Please select UPI QR.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId || i.id,
            quantity: i.quantity,
          })),
          customer: {
            name: formData.name.trim(),
            phone: cleanPhone,
            email: formData.email.trim() || undefined,
          },
          shippingAddress: {
            name: formData.name.trim(),
            phone: cleanPhone,
            email: formData.email.trim() || undefined,
            addressLine1: formData.addressLine1.trim(),
            addressLine2: formData.addressLine2.trim() || undefined,
            city: formData.city.trim(),
            stateCode: formData.stateCode,
            stateName: formData.stateName,
            postalCode: formData.postalCode.trim(),
          },
          paymentMethod: formData.paymentMethod,
          customerNotes: formData.customerNotes.trim() || undefined,
          couponCode: appliedCoupon ? appliedCoupon.couponCode : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to place order');
      }

      // Order created successfully; order-scoped HttpOnly cookie was set by server response
      clearCart();
      router.push(`/orders/${data.order.orderNumber}`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred while placing order.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-brand-maroon mx-auto mb-4">
          <ShoppingBagIcon className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl text-stone-900 mb-2">Your Shopping Bag is Empty</h1>
        <p className="text-xs text-stone-600 mb-6">
          Add artisanal bangles or Kundan sets from our catalogue before checking out.
        </p>
        <Link
          href="/shop"
          prefetch={true}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-maroon text-white rounded text-xs font-semibold hover:bg-brand-deepMaroon transition-colors"
        >
          <span>Explore Jewellery</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" prefetch={true} className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link href="/cart" prefetch={true} className="hover:text-brand-maroon">
          Shopping Bag
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium">Checkout</span>
      </nav>

      <div className="border-b border-brand-sand pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900">
          Complete Your Order
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Direct dispatch from our Bengaluru studio. Zero payment gateway transaction fees.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer Contact */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-medium text-stone-900">
                1. Customer Information
              </h2>
              {customerUser ? (
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                  Logged in as {customerUser.name || customerUser.email || 'Customer'}
                </span>
              ) : (
                <Link
                  href="/login?redirect=/checkout"
                  prefetch={true}
                  className="text-xs text-brand-maroon hover:underline font-medium"
                >
                  Sign in for saved addresses &rarr;
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Mobile Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit Indian Mobile"
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="For order dispatch and invoice notifications"
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">
              2. Shipping Address (Pan-India Courier)
            </h2>

            {savedAddresses.length > 0 && (
              <div className="p-3 bg-brand-cream/30 border border-brand-sand rounded-xl space-y-2">
                <span className="text-xs font-semibold text-stone-700 block">
                  Select from Saved Addresses:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedAddresses.map((addr) => {
                    const isSelected =
                      formData.addressLine1 === addr.streetLine1 &&
                      formData.postalCode === addr.postalCode;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          const stateMatch = INDIAN_STATES.find(
                            (s) => s.name.toLowerCase() === addr.state.toLowerCase()
                          );
                          setFormData((prev) => ({
                            ...prev,
                            name: addr.recipientName,
                            phone: addr.phone,
                            addressLine1: addr.streetLine1,
                            addressLine2: addr.streetLine2 || '',
                            city: addr.city,
                            stateName: addr.state,
                            stateCode: stateMatch?.code || '29',
                            postalCode: addr.postalCode,
                          }));
                        }}
                        className={`p-2.5 text-left rounded-lg text-xs border transition-all ${
                          isSelected
                            ? 'bg-white border-brand-maroon ring-1 ring-brand-maroon'
                            : 'bg-white/80 border-stone-200 hover:border-brand-gold'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-stone-900">{addr.recipientName}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-brand-sand/50 text-brand-maroon px-1.5 py-0.2 rounded font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-stone-500 text-[11px] truncate">
                          {addr.streetLine1}, {addr.city}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Street Address / House No. / Apartment *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  required
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="e.g. 104, Royal Palms, 2nd Main"
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Landmark / Area (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Near Metro Station, Indiranagar"
                  className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Bengaluru"
                    className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    State *
                  </label>
                  <select
                    name="stateCode"
                    value={formData.stateCode}
                    onChange={handleInputChange}
                    className="w-full text-xs border border-stone-300 rounded px-2.5 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="6 digits"
                    className="w-full text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method Selection */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">
              3. Payment Selection (Sovereign Zero-MDR)
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                  paymentSettings.isMerchantConfirmed ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'
                } ${
                  formData.paymentMethod === 'UPI_MERCHANT_QR'
                    ? 'border-brand-maroon bg-brand-cream/50 ring-1 ring-brand-maroon'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI_MERCHANT_QR"
                  disabled={!paymentSettings.isMerchantConfirmed}
                  checked={formData.paymentMethod === 'UPI_MERCHANT_QR'}
                  onChange={handleInputChange}
                  className="mt-0.5 text-brand-maroon focus:ring-brand-maroon"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-900">
                      BharatPe Merchant UPI QR &amp; UPI Intent (Recommended)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium">
                      0% Convenience Fee
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Scan our verified studio merchant QR code using GPay, PhonePe, Paytm, or BHIM.
                    After completing the transfer, submit your 12-digit UPI Bank UTR on the next screen.
                  </p>
                  {paymentSettings.upiVpa && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded text-[11px] font-mono text-stone-700">
                      <span>UPI ID:</span>
                      <span className="font-semibold text-brand-maroon">{paymentSettings.upiVpa}</span>
                    </div>
                  )}
                  {!paymentSettings.isMerchantConfirmed && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded font-medium">
                      Merchant UPI onboarding is currently unapproved or unconfigured (MERCHANT_ONBOARDING_APPROVED is false).
                    </p>
                  )}
                </div>
              </label>

              {paymentSettings.codEnabled ? (
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    formData.paymentMethod === 'COD'
                      ? 'border-brand-maroon bg-brand-cream/50 ring-1 ring-brand-maroon'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleInputChange}
                    className="mt-0.5 text-brand-maroon focus:ring-brand-maroon"
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-stone-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Pay in cash upon doorstep delivery by our courier partner. Available across eligible PIN codes.
                    </p>
                  </div>
                </label>
              ) : (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-500 text-xs">
                  Cash on Delivery is currently disabled by store management (COD_ENABLED is false).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Placement */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4 sticky top-6">
            <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-stone-100 pb-3">
              Order Summary ({totalItems} pieces)
            </h2>

            {/* Line Items */}
            <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto space-y-3 pr-1 text-xs">
              {items.map((item) => (
                <div key={item.variantId || item.id} className="pt-3 first:pt-0 flex justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-medium text-stone-900 block">{item.name}</span>
                    <span className="text-[10px] text-stone-500 block">
                      Size: {item.size || 'Standard'} &bull; Qty: {item.quantity}
                    </span>
                  </div>
                  <span className="font-semibold text-stone-900 flex-shrink-0">
                    {formatPrice(item.pricePaise * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="border-t border-stone-100 pt-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code (e.g. BRIDAL10)"
                  className="flex-1 px-3 py-1.5 text-xs uppercase border border-stone-300 rounded bg-stone-50 focus:bg-white focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
                  disabled={isCheckingCoupon || Boolean(appliedCoupon)}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-1.5 text-xs text-red-600 font-semibold hover:text-red-800"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={isCheckingCoupon || !couponInput.trim()}
                    className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {isCheckingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                )}
              </div>

              {couponMsg && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                  <span>✓</span> {couponMsg}
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠</span> {couponError}
                </p>
              )}
            </div>

            {/* Financial Calculations */}
            <div className="space-y-2 text-xs border-t border-stone-100 pt-4">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">{formatPrice(subtotalPaise)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount ({appliedCoupon.couponCode})</span>
                  <span>- ₹{appliedCoupon.discountRupees}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Pan-India Delivery</span>
                <span className="font-medium text-stone-900">
                  {shippingPaise === 0 ? (
                    <span className="text-emerald-700 font-semibold">FREE (Over ₹1,999)</span>
                  ) : (
                    formatPrice(shippingPaise)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Taxes &amp; Packaging</span>
                <span className="text-stone-500">Included in MRP</span>
              </div>

              <div className="border-t border-stone-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-stone-900">Total Payable</span>
                <span className="font-serif text-2xl font-bold text-brand-maroon">
                  {formatPrice(totalPayablePaise)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-brand-maroon text-white rounded-lg text-sm font-semibold hover:bg-brand-deepMaroon transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Placing Your Order...</span>
              ) : (
                <>
                  <span>Confirm &amp; Place Order</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-stone-500 text-center">
              By confirming your order, you agree to our{' '}
              <Link href="/policies/terms" target="_blank" className="underline hover:text-brand-maroon">
                Terms
              </Link>
              ,{' '}
              <Link href="/policies/privacy" target="_blank" className="underline hover:text-brand-maroon">
                Privacy
              </Link>
              , and{' '}
              <Link href="/policies/returns" target="_blank" className="underline hover:text-brand-maroon">
                Return Policy
              </Link>
              .
            </p>

            <div className="bg-brand-cream/60 rounded-lg p-3 space-y-2 text-[11px] text-stone-600 border border-brand-sand/60">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-brand-maroon flex-shrink-0" />
                <span>Direct UPI / Cash on Delivery. Server-authoritative integer paise.</span>
              </div>
              <div className="flex items-center gap-2">
                <TruckIcon className="w-4 h-4 text-brand-maroon flex-shrink-0" />
                <span>Protective keepsake box packaging for safe delivery.</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
