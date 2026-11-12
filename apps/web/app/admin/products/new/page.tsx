'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, TrashIcon, AlertCircleIcon, CheckIcon } from '@/components/admin-icons';

export default function AdminNewProductPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('cat-bangles');
  const [priceRupees, setPriceRupees] = useState('');
  const [mrpRupees, setMrpRupees] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const [variants, setVariants] = useState([
    { title: 'Size 2.4', size: '2.4', sku: 'NAV-BGL-001-24', initialStock: 5 },
    { title: 'Size 2.6', size: '2.6', sku: 'NAV-BGL-001-26', initialStock: 8 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addVariantRow = () => {
    setVariants([
      ...variants,
      { title: 'Size 2.8', size: '2.8', sku: `${sku || 'NAV-BGL'}-${Date.now().toString().slice(-4)}`, initialStock: 5 },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    const mrpPaise = mrpRupees && !isNaN(parseFloat(mrpRupees)) ? Math.round(parseFloat(mrpRupees) * 100) : null;

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      sku: sku.trim() || undefined,
      categoryId,
      pricePaise,
      compareAtPricePaise: mrpPaise,
      status,
      isFeatured,
      variants: variants.map((v) => ({
        title: v.title,
        size: v.size,
        sku: v.sku,
        pricePaise,
        mrpPaise: mrpPaise || pricePaise,
        initialStock: v.initialStock,
      })),
      imageUrl: imageUrl.trim() || undefined,
    };

    try {
      const res = await fetch('/api/admin/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication expired or unauthorized. Please re-authenticate at /admin/login.');
        }
        if (res.status === 409) {
          throw new Error(data.error || 'Conflict: Product with this slug or SKU already exists.');
        }
        if (res.status === 422 || res.status === 400) {
          throw new Error(data.error || 'Validation error: Invalid product pricing or fields.');
        }
        if (res.status === 503) {
          throw new Error('Database service is unavailable: Product cannot be persisted.');
        }
        throw new Error(data.error || `Failed to create product (${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin/products';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-stone-900">Add New Jewellery Piece</h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure catalog details, pricing in paise, bangle size variants, and initial workshop stock.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-xs text-stone-500 hover:text-stone-800"
        >
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
          <span>Piece created successfully! Redirecting to products list...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Kundan Bridal Kada Set"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                URL Slug (Optional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. royal-kundan-bridal-kada-set"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:border-brand-maroon focus:outline-none"
              >
                <option value="cat-bangles">Handmade Bangles</option>
                <option value="cat-bridal">Bridal Jewellery &amp; Sets</option>
                <option value="cat-kundan">Kundan Artistry</option>
                <option value="cat-hair">Hair Accessories &amp; Matha Patti</option>
                <option value="cat-gifts">Return Gifts &amp; Favours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Base Master SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. NAV-BDL-001"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Artisanal Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe craftsmanship, stone setting, plating, and styling notes..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
            />
          </div>
        </div>

        {/* Pricing & Publication */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            2. Server-Authoritative Pricing (INR)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="1"
                required
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                placeholder="e.g. 1499"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Stored internally as integer paise (e.g. 149900).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Comparison MRP (₹) (Optional)
              </label>
              <input
                type="number"
                step="1"
                value={mrpRupees}
                onChange={(e) => setMrpRupees(e.target.value)}
                placeholder="e.g. 1999"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Must be &ge; selling price pursuant to Indian Legal Metrology Rules.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:border-brand-maroon focus:outline-none"
              >
                <option value="DRAFT">DRAFT (Unpublished / Internal)</option>
                <option value="PUBLISHED">PUBLISHED (Live on Storefront)</option>
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
        </div>

        {/* Bangle Sizing Variants & Stock */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
              3. Bangle Sizes &amp; Workshop Stock
            </h2>
            <button
              type="button"
              onClick={addVariantRow}
              className="text-xs text-brand-maroon font-semibold hover:underline flex items-center gap-1"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Size</span>
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="w-28 flex-shrink-0">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 block">Title</label>
                  <input
                    type="text"
                    value={v.title}
                    onChange={(e) => {
                      const updated = [...variants];
                      const item = updated[idx];
                      if (item) item.title = e.target.value;
                      setVariants(updated);
                    }}
                    className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                  />
                </div>

                <div className="w-20 flex-shrink-0">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 block">Size</label>
                  <input
                    type="text"
                    value={v.size}
                    onChange={(e) => {
                      const updated = [...variants];
                      const item = updated[idx];
                      if (item) item.size = e.target.value;
                      setVariants(updated);
                    }}
                    className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 block">Variant SKU</label>
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => {
                      const updated = [...variants];
                      const item = updated[idx];
                      if (item) item.sku = e.target.value;
                      setVariants(updated);
                    }}
                    className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="w-24 flex-shrink-0">
                  <label className="text-[10px] uppercase font-semibold text-stone-500 block">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={v.initialStock}
                    onChange={(e) => {
                      const updated = [...variants];
                      const item = updated[idx];
                      if (item) item.initialStock = parseInt(e.target.value, 10) || 0;
                      setVariants(updated);
                    }}
                    className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                  />
                </div>

                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariantRow(idx)}
                    className="p-1 text-stone-400 hover:text-red-700 mt-4"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Media / Cloudinary Abstraction */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            4. Image Storage Reference
          </h2>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Primary Image CDN / Object Storage URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:border-brand-maroon focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Integrates with ImageStorageService abstraction. Raw image binaries are not stored in PostgreSQL.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
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
            {loading ? 'Saving...' : 'Save & Publish Piece'}
          </button>
        </div>
      </form>
    </div>
  );
}
