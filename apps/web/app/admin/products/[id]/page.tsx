'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SAMPLE_PRODUCTS } from '@/lib/sample-data';
import { AlertCircleIcon, CheckIcon } from '@/components/admin-icons';

export default function AdminEditProductPage() {
  const params = useParams();
  const id = params?.id as string;

  const product = SAMPLE_PRODUCTS.find((p) => p.id === id) || SAMPLE_PRODUCTS[0];

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [priceRupees, setPriceRupees] = useState(
    product ? (product.pricePaise / 100).toString() : '1499'
  );
  const [mrpRupees, setMrpRupees] = useState(
    product?.compareAtPricePaise ? (product.compareAtPricePaise / 100).toString() : '1999'
  );
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(
    product?.status || 'PUBLISHED'
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPriceRupees((product.pricePaise / 100).toString());
      setMrpRupees(
        product.compareAtPricePaise ? (product.compareAtPricePaise / 100).toString() : ''
      );
      setStatus(product.status);
      setIsFeatured(product.isFeatured);
    }
  }, [product]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please provide a valid non-negative selling price');
      setLoading(false);
      return;
    }

    const pricePaise = Math.round(priceNum * 100);
    const mrpPaise =
      mrpRupees && !isNaN(parseFloat(mrpRupees)) ? Math.round(parseFloat(mrpRupees) * 100) : null;

    try {
      const res = await fetch(`/api/admin/catalog/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          pricePaise,
          compareAtPricePaise: mrpPaise,
          status,
          isFeatured,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication expired or unauthorized. Please re-authenticate at /admin/login.');
        }
        if (res.status === 403) {
          throw new Error('Forbidden: Insufficient administrative privileges.');
        }
        if (res.status === 404) {
          throw new Error('Product not found in catalogue.');
        }
        if (res.status === 409) {
          throw new Error(data.error || 'Conflict: Duplicate SKU or slug.');
        }
        if (res.status === 422 || res.status === 400) {
          throw new Error(data.error || 'Validation error: Invalid product pricing or data.');
        }
        if (res.status === 503) {
          throw new Error('Database service is unavailable. Mutation cannot be persisted.');
        }
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin/products';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update piece');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-stone-900">
            Edit Jewellery Piece: {product?.name}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Update pricing, descriptions, publication status, and featured showcase.
          </p>
        </div>
        <Link href="/admin/products" className="text-xs text-stone-500 hover:text-stone-800">
          &larr; Back to Products
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckIcon className="w-4 h-4 flex-shrink-0" />
          <span>Product updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="1"
                required
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Comparison MRP (₹)
              </label>
              <input
                type="number"
                step="1"
                value={mrpRupees}
                onChange={(e) => setMrpRupees(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:border-brand-maroon focus:outline-none"
              >
                <option value="DRAFT">DRAFT (Hidden)</option>
                <option value="PUBLISHED">PUBLISHED (Live on Storefront)</option>
                <option value="ARCHIVED">ARCHIVED (Retired)</option>
              </select>
            </div>

            <div className="flex items-center pt-6 gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-brand-maroon focus:ring-brand-maroon"
              />
              <label htmlFor="isFeatured" className="text-xs text-stone-800 font-medium cursor-pointer">
                Feature on Homepage Showcase
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 border border-stone-300 rounded text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || success}
            className="px-6 py-2.5 bg-brand-maroon text-white rounded text-xs font-semibold hover:bg-brand-deepMaroon transition-all shadow disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Piece Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
