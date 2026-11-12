import React from 'react';
import Link from 'next/link';
import { CatalogService } from '@/lib/catalog-service';
import {
  PackageIcon,
  LayersIcon,
  TagIcon,
  RefreshCwIcon,
  PlusIcon,
  AlertCircleIcon,
  CheckIcon,
} from '@/components/admin-icons';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [productsResult, categories, collections] = await Promise.all([
    CatalogService.getPublishedProducts({ limit: 50 }),
    CatalogService.getCategories(),
    CatalogService.getPublishedCollections(),
  ]);

  const products = productsResult.items;
  const lowStockItems = products.filter((p) => {
    const totalStock = p.variants?.reduce((sum, v) => sum + (v.availableStock || 0), 0) || 0;
    return totalStock > 0 && totalStock <= 5;
  });

  const outOfStockItems = products.filter((p) => {
    const totalStock = p.variants?.reduce((sum, v) => sum + (v.availableStock || 0), 0) || 0;
    return totalStock === 0;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Studio Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time status of NAVA CREATIONS product catalogue and inventory in Bengaluru.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-maroon text-white rounded text-xs font-semibold hover:bg-brand-deepMaroon transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add New Piece</span>
          </Link>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 bg-white text-stone-800 rounded text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span>Adjust Stock</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Catalogue Pieces</span>
            <PackageIcon className="w-4 h-4 text-brand-maroon" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{products.length}</div>
          <span className="text-[11px] text-stone-400 mt-1 block">Active Published Pieces</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Categories</span>
            <LayersIcon className="w-4 h-4 text-brand-darkGold" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{categories.length}</div>
          <span className="text-[11px] text-stone-400 mt-1 block">Taxonomy Segments</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Merchandising</span>
            <TagIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">{collections.length}</div>
          <span className="text-[11px] text-stone-400 mt-1 block">Curated Edits Published</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Stock Alerts</span>
            <AlertCircleIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {lowStockItems.length + outOfStockItems.length}
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block font-medium">
            {lowStockItems.length} Low &bull; {outOfStockItems.length} Sold Out
          </span>
        </div>
      </div>

      {/* Stock Alerts Notice */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircleIcon className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-semibold text-amber-900">
              Inventory Attention Required
            </h3>
          </div>
          <ul className="divide-y divide-amber-200/60 text-xs text-amber-800">
            {outOfStockItems.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>{p.name}</span>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold text-[10px]">
                  Sold Out
                </span>
              </li>
            ))}
            {lowStockItems.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>{p.name}</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                  Low Stock
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Products Snapshot */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium text-stone-900">
            Published Products Snapshot
          </h2>
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-brand-maroon hover:underline"
          >
            View Full Table &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <th className="p-3">Piece Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">Selling Price</th>
                <th className="p-3">Sizes / Variants</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {products.slice(0, 6).map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-3 font-medium text-stone-900">{p.name}</td>
                  <td className="p-3 font-mono text-stone-500">{p.sku || '—'}</td>
                  <td className="p-3">{p.category?.name || '—'}</td>
                  <td className="p-3 font-semibold text-stone-900">
                    ₹{(p.pricePaise / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    {p.variants?.map((v) => v.size || v.title).join(', ') || 'Standard'}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />
                      <span>{p.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
