import React from 'react';
import Link from 'next/link';
import { CatalogService } from '@/lib/catalog-service';
import { ProductCard } from '@/components/product-card';
import { SearchIcon, ChevronRightIcon, ArrowRightIcon } from '@/components/icons';

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    collection?: string;
    search?: string;
    featured?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const search = params.search || undefined;
  const categoryId = params.category || undefined;
  const collectionId = params.collection || undefined;
  const isFeatured = params.featured === 'true' ? true : undefined;

  const [productsResult, categories, collections] = await Promise.all([
    CatalogService.getPublishedProducts({
      page,
      limit: 12,
      categoryId,
      collectionId,
      search,
      isFeatured,
    }),
    CatalogService.getCategories(),
    CatalogService.getPublishedCollections(),
  ]);

  const { items: products, total, totalPages, hasNextPage, hasPrevPage } = productsResult;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium">Shop All</span>
      </nav>

      {/* Page Header */}
      <div className="border-b border-brand-sand pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block mb-1">
            Catalogue
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900">
            Handcrafted Accessories
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Showing {products.length} of {total} pieces handcrafted in Bengaluru.
          </p>
        </div>

        {/* Search & Filter Form */}
        <form method="GET" action="/shop" className="flex flex-wrap items-center gap-2" role="search">
          <div className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search accessories..."
              aria-label="Search accessories by name or keyword"
              className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon w-48 sm:w-60"
            />
            <SearchIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <select
            name="category"
            defaultValue={categoryId || ''}
            aria-label="Filter by product category"
            className="text-xs border border-stone-300 rounded px-2.5 py-1.5 bg-white text-stone-800 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="collection"
            defaultValue={collectionId || ''}
            aria-label="Filter by curated collection"
            className="text-xs border border-stone-300 rounded px-2.5 py-1.5 bg-white text-stone-800 focus:outline-none focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon"
          >
            <option value="">All Collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-1.5 bg-brand-maroon text-white text-xs font-medium rounded hover:bg-brand-deepMaroon transition-colors focus:outline-none focus:ring-2 focus:ring-brand-maroon focus:ring-offset-1"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/shop"
          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
            !categoryId
              ? 'bg-brand-maroon text-white font-medium'
              : 'bg-white border border-stone-200 text-stone-700 hover:border-brand-maroon'
          }`}
        >
          All Items
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              categoryId === c.id
                ? 'bg-brand-maroon text-white font-medium'
                : 'bg-white border border-stone-200 text-stone-700 hover:border-brand-maroon'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Product Grid or Empty State */}
      {products.length === 0 ? (
        <div className="py-16 sm:py-20 text-center bg-brand-cream/40 rounded-2xl border border-brand-sand p-8 sm:p-12 max-w-2xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-darkGold mx-auto">
            <SearchIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest text-brand-darkGold font-semibold block mb-1">
              Atelier Catalogue Update
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
              No pieces found
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find any pieces matching your current filter. Our Bengaluru artisans craft bespoke bridal chuda, kadas, and custom sizes (2.2 &ndash; 2.10) to order.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-6 py-3 bg-brand-maroon hover:bg-brand-deepMaroon text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>Request Bespoke Order</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-brand-cream border border-brand-sand text-stone-800 text-xs font-medium uppercase tracking-wider rounded-xl transition-colors"
            >
              Clear All Filters
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-8 border-t border-brand-sand flex items-center justify-between text-xs">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {hasPrevPage && (
              <Link
                href={`/shop?page=${page - 1}${categoryId ? `&category=${categoryId}` : ''}${collectionId ? `&collection=${collectionId}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${isFeatured ? '&featured=true' : ''}`}
                className="px-4 py-2 border border-stone-300 rounded text-stone-800 hover:bg-stone-50"
              >
                Previous
              </Link>
            )}
            {hasNextPage && (
              <Link
                href={`/shop?page=${page + 1}${categoryId ? `&category=${categoryId}` : ''}${collectionId ? `&collection=${collectionId}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}${isFeatured ? '&featured=true' : ''}`}
                className="px-4 py-2 bg-brand-maroon text-white rounded font-medium hover:bg-brand-deepMaroon"
              >
                Next Page
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
