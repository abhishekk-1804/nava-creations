'use client';

import React, { useState, useEffect } from 'react';
import { TagIcon, PlusIcon, AlertCircleIcon } from '@/components/admin-icons';
import { CheckIcon } from '@/components/icons';
import { CouponDto, PromotionType } from '@nava/domain';

export default function AdminPromotionsPage() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Coupon Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<PromotionType>('PERCENTAGE');
  const [newValue, setNewValue] = useState('');
  const [newMinOrder, setNewMinOrder] = useState('2000');
  const [newMaxDiscount, setNewMaxDiscount] = useState('500');
  const [newUsageLimit, setNewUsageLimit] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (_e) {
      setErrorMessage('Failed to load promotions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleCoupon = async (code: string, currentStatus: boolean) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/promotions/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Coupon ${code} is now ${!currentStatus ? 'Active' : 'Disabled'}.`);
        fetchCoupons();
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to update coupon status');
      }
    } catch (_e) {
      setErrorMessage('Network error updating coupon status.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const valNum = parseFloat(newValue);
    if (isNaN(valNum) || valNum <= 0) {
      setErrorMessage('Please enter a valid positive discount value.');
      return;
    }

    const minOrderPaise = Math.round((parseFloat(newMinOrder) || 0) * 100);
    const maxDiscountPaise = newMaxDiscount ? Math.round(parseFloat(newMaxDiscount) * 100) : null;
    const value = newType === 'PERCENTAGE' ? valNum : Math.round(valNum * 100);

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          description: newDesc.trim(),
          type: newType,
          value,
          minOrderPaise,
          maxDiscountPaise,
          usageLimit: newUsageLimit ? parseInt(newUsageLimit, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create coupon');
      }

      setActionMessage(`Promotional coupon '${data.coupon.code}' created successfully!`);
      setIsCreating(false);
      setNewCode('');
      setNewDesc('');
      setNewValue('');
      fetchCoupons();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Promotions &amp; Coupons
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage bridal edit discounts, festive campaigns, and client loyalty redemption codes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-maroon text-white rounded text-xs font-semibold hover:bg-brand-deepMaroon transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Promo Code</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-brand-maroon" />
            <h2 className="font-serif text-sm font-semibold text-stone-900">
              Active &amp; Scheduled Offers ({coupons.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <th className="p-3.5">Coupon Code</th>
                <th className="p-3.5">Type &amp; Discount</th>
                <th className="p-3.5">Min Order Value</th>
                <th className="p-3.5">Max Discount Cap</th>
                <th className="p-3.5">Usage / Limit</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    Loading promotional campaigns...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No active promotional campaigns configured.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-stone-900 text-sm tracking-wider block">
                        {c.code}
                      </span>
                      <span className="text-[10px] text-stone-400 block line-clamp-1">
                        {c.description || 'No description'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {c.type === 'PERCENTAGE' ? (
                        <span className="font-semibold text-brand-maroon bg-brand-cream/60 px-2 py-0.5 rounded">
                          {c.value}% Off
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          ₹{(c.value / 100).toLocaleString('en-IN')} Flat Off
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-medium text-stone-800">
                      ₹{(c.minOrderPaise / 100).toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 text-stone-600">
                      {c.maxDiscountPaise
                        ? `₹${(c.maxDiscountPaise / 100).toLocaleString('en-IN')}`
                        : 'No cap'}
                    </td>

                    <td className="p-3.5 font-mono text-stone-600">
                      {c.usageCount} / {c.usageLimit || '∞'}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c.code, c.isActive)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                          c.isActive
                            ? 'text-stone-600 hover:text-red-700 hover:bg-stone-100'
                            : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                        }`}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-medium text-stone-900">
                Create New Promotional Coupon
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Coupon Code (e.g. FESTIVE20)
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="w-full px-3 py-2 border border-stone-300 rounded font-mono uppercase focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. 20% festive bridal edit discount"
                  className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Discount Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PromotionType)}
                    className="w-full px-3 py-2 border border-stone-300 rounded bg-white focus:ring-1 focus:ring-brand-maroon"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT_AMOUNT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {newType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Rupees (₹)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={newType === 'PERCENTAGE' ? '15' : '250'}
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(e.target.value)}
                    placeholder="2000"
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Max Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={newMaxDiscount}
                    onChange={(e) => setNewMaxDiscount(e.target.value)}
                    placeholder="500"
                    disabled={newType === 'FLAT_AMOUNT'}
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Limit (Orders)
                  </label>
                  <input
                    type="number"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-brand-maroon"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand-maroon text-white rounded font-semibold hover:bg-brand-deepMaroon transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating...' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
