'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  TruckIcon,
  TrashIcon,
  PlusIcon,
  AlertCircleIcon,
  ChevronRightIcon,
} from '@/components/icons';

interface CustomerUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  createdAt?: string | null;
}

interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  stateName: string;
  stateCode?: string;
  postalCode: string;
  isDefault: boolean;
  // Fallback compatibility
  streetLine1?: string;
  streetLine2?: string | null;
  state?: string;
  recipientName?: string;
  phone?: string;
}

interface OrderItem {
  id: string;
  title: string;
  variantTitle?: string | null;
  sku: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

interface Order {
  id: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalPaise: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
}

export default function CustomerAccountPage() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: '',
    phone: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    state: 'Karnataka',
    postalCode: '',
    isDefault: false,
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          window.location.href = '/login?redirect=/account';
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        window.location.href = '/login?redirect=/account';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load orders when orders tab active
  useEffect(() => {
    if (user && activeTab === 'orders') {
      setOrdersLoading(true);
      fetch('/api/customer/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.orders) setOrders(data.orders);
        })
        .catch((err) => console.error('Failed to load orders', err))
        .finally(() => setOrdersLoading(false));
    }
  }, [user, activeTab]);

  // Load addresses when addresses tab active
  useEffect(() => {
    if (user && activeTab === 'addresses') {
      setAddressesLoading(true);
      fetch('/api/customer/addresses')
        .then((res) => res.json())
        .then((data) => {
          if (data.addresses) setAddresses(data.addresses);
        })
        .catch((err) => console.error('Failed to load addresses', err))
        .finally(() => setAddressesLoading(false));
    }
  }, [user, activeTab]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    setAddressSubmitting(true);

    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressLine1: newAddress.streetLine1,
          addressLine2: newAddress.streetLine2,
          streetLine1: newAddress.streetLine1,
          streetLine2: newAddress.streetLine2,
          city: newAddress.city,
          stateName: newAddress.state,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          isDefault: newAddress.isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save address');
      }

      setAddresses((prev) => [data.address, ...prev]);
      setShowAddAddress(false);
      setNewAddress({
        recipientName: '',
        phone: '',
        streetLine1: '',
        streetLine2: '',
        city: '',
        state: 'Karnataka',
        postalCode: '',
        isDefault: false,
      });
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;

    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete address', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-brand-maroon border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-cream/20 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white border border-brand-sand rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-sand/60 border border-brand-gold/40 flex items-center justify-center text-brand-maroon text-xl font-serif font-bold">
              {(user?.name || user?.email || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900">
                Welcome back, {user?.name || user?.email || 'Customer'}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {user?.email || 'Customer Account'} {user?.phone ? `\u2022 ${user.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-sand space-x-8">
          <button
            onClick={() => React.startTransition(() => setActiveTab('orders'))}
            className={`pb-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${
              activeTab === 'orders'
                ? 'border-brand-maroon text-brand-maroon'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            My Orders ({orders.length})
          </button>
          <button
            onClick={() => React.startTransition(() => setActiveTab('addresses'))}
            className={`pb-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${
              activeTab === 'addresses'
                ? 'border-brand-maroon text-brand-maroon'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Saved Addresses
          </button>
          <button
            onClick={() => React.startTransition(() => setActiveTab('profile'))}
            className={`pb-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-brand-maroon text-brand-maroon'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Profile Information
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="bg-white border border-brand-sand rounded-2xl p-12 text-center text-stone-500 text-sm">
                Fetching your orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-brand-sand rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-brand-sand/40 text-brand-maroon rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBagIcon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-medium text-stone-800">
                  No orders placed yet
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Explore our handcrafted bangles, bridal adornments, and Kundan artistry to place your first order.
                </p>
                <Link
                  href="/shop"
                  prefetch={true}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-maroon text-white rounded-xl text-xs font-medium hover:bg-brand-deepMaroon transition-colors"
                >
                  <span>Explore Catalogue</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-brand-sand rounded-2xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
                      <div>
                        <span className="font-mono text-sm font-bold text-brand-maroon">
                          {order.orderNumber}
                        </span>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.paymentStatus === 'CLAIMED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            order.fulfillmentStatus === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.fulfillmentStatus === 'DISPATCHED'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{item.title}</p>
                            {item.variantTitle && (
                              <p className="text-xs text-stone-400">Variant: {item.variantTitle}</p>
                            )}
                            <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-stone-900">
                              ₹{(item.totalPricePaise / 100).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-stone-500">Total Amount:</span>{' '}
                        <span className="text-base font-bold text-stone-900">
                          ₹{(order.totalPaise / 100).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-brand-maroon rounded-lg text-xs font-medium transition-colors"
                      >
                        <span>View Order & Tracking</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Delivery Addresses</h2>
                <p className="text-xs text-stone-500">
                  Save your home, studio or gifting addresses for faster checkout.
                </p>
              </div>
              {!showAddAddress && (
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-maroon text-white rounded-xl text-xs font-medium hover:bg-brand-deepMaroon transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Add Address Form Modal / Box */}
            {showAddAddress && (
              <div className="bg-white border border-brand-sand rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-stone-900 border-b pb-2">
                  Add Delivery Address
                </h3>

                {addressError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{addressError}</span>
                  </div>
                )}

                <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.recipientName}
                      onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-brand-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-brand-maroon"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Street Address / House / Flat *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.streetLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, streetLine1: e.target.value })}
                      placeholder="e.g. #42, 5th Cross, Indiranagar"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-brand-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Landmark / Area (Optional)
                    </label>
                    <input
                      type="text"
                      value={newAddress.streetLine2}
                      onChange={(e) => setNewAddress({ ...newAddress, streetLine2: e.target.value })}
                      placeholder="Near Metro Station"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-brand-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Bengaluru"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-brand-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="Karnataka"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-brand-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="560038"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-brand-maroon"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                      className="rounded border-stone-300 text-brand-maroon focus:ring-brand-maroon"
                    />
                    <label htmlFor="isDefault" className="text-xs text-stone-600">
                      Set as default shipping address
                    </label>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addressSubmitting}
                      className="px-5 py-2 bg-brand-maroon text-white rounded-lg text-xs font-medium hover:bg-brand-deepMaroon transition-colors disabled:opacity-50"
                    >
                      {addressSubmitting ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Address Cards List */}
            {addressesLoading ? (
              <div className="bg-white border border-brand-sand rounded-2xl p-8 text-center text-stone-500 text-xs">
                Loading saved addresses...
              </div>
            ) : addresses.length === 0 && !showAddAddress ? (
              <div className="bg-white border border-brand-sand rounded-2xl p-10 text-center space-y-3">
                <TruckIcon className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs text-stone-500">No saved addresses found.</p>
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="px-4 py-2 bg-brand-maroon text-white text-xs rounded-lg hover:bg-brand-deepMaroon"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white border border-brand-sand rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-stone-900">
                          {addr.addressLine1 || addr.streetLine1 || 'Delivery Address'}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-brand-sand/60 text-brand-maroon font-semibold px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {(addr.addressLine2 || addr.streetLine2) && (
                          <span className="block">{addr.addressLine2 || addr.streetLine2}</span>
                        )}
                        {addr.city}, {addr.stateName || addr.state} — {addr.postalCode}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-brand-sand rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl">
            <h2 className="text-base font-semibold text-stone-900 border-b pb-3">
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-stone-400 uppercase tracking-wider block">
                  Account Name
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {user?.name || 'Customer (Name not set)'}
                </span>
              </div>

              <div>
                <span className="text-xs text-stone-400 uppercase tracking-wider block">
                  Email Address
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {user?.email || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-xs text-stone-400 uppercase tracking-wider block">
                  Phone Number
                </span>
                <span className="text-sm font-medium text-stone-800">
                  {user?.phone || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-xs text-stone-400 uppercase tracking-wider block">
                  Account Role
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-cream text-brand-maroon inline-block mt-0.5">
                  {user?.role || 'CUSTOMER'}
                </span>
              </div>

              <div>
                <span className="text-xs text-stone-400 uppercase tracking-wider block">
                  Member Since
                </span>
                <span className="text-sm text-stone-600">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Recently Joined'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
