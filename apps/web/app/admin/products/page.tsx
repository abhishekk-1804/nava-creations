import React from 'react';
import Link from 'next/link';
import { CatalogService } from '@/lib/catalog-service';
import { PlusIcon } from '@/components/admin-icons';
import { SafeImage } from '@/components/safe-image';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const result = await CatalogService.getPublishedProducts({ limit: 100 });
  const products = result.items;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Products Catalogue
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage jewellery pieces, bangle sizes, MRP pricing, and publication status.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-maroon text-white rounded text-xs font-semibold hover:bg-brand-deepMaroon transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add New Piece</span>
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <th className="p-3.5">Piece</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Selling Price</th>
                <th className="p-3.5">MRP</th>
                <th className="p-3.5">Available Stock</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    No products found in catalogue.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const totalStock =
                    p.variants?.reduce((sum, v) => sum + (v.availableStock || 0), 0) ?? 0;
                  const thumb = p.images?.[0]?.url;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={thumb}
                              alt={p.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-stone-900 block leading-tight">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {p.variants?.length || 1} size variant(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-stone-500">{p.sku || '—'}</td>
                      <td className="p-3.5">{p.category?.name || '—'}</td>

                      <td className="p-3.5 font-semibold text-stone-900">
                        ₹{(p.pricePaise / 100).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-stone-500">
                        {p.compareAtPricePaise
                          ? `₹${(p.compareAtPricePaise / 100).toLocaleString('en-IN')}`
                          : '—'}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-semibold ${
                            totalStock === 0
                              ? 'text-red-700'
                              : totalStock <= 5
                              ? 'text-amber-700'
                              : 'text-stone-800'
                          }`}
                        >
                          {totalStock} units
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'DRAFT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="text-brand-maroon hover:underline font-semibold"
                        >
                          Edit
                        </Link>
                        <span className="text-stone-300">&bull;</span>
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="text-stone-500 hover:text-stone-800"
                        >
                          Preview
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
