import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CatalogService } from '@/lib/catalog-service';
import { ProductCard } from '@/components/product-card';
import { ChevronRightIcon, ArrowRightIcon } from '@/components/icons';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const allCategories = await CatalogService.getAllCategoriesFlat(true);
  const currentCategory = allCategories.find((c) => c.slug === slug)
    || (await CatalogService.getCategories()).find((c) => c.slug === slug);

  if (!currentCategory) {
    notFound();
  }

  const productsResult = await CatalogService.getPublishedProducts({
    categoryId: currentCategory.id,
    limit: 24,
  });

  const products = productsResult.items;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" prefetch={true} className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link href="/shop" prefetch={true} className="hover:text-brand-maroon">
          Categories
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium">{currentCategory.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-brand-cream border border-brand-sand rounded-xl p-8 sm:p-12 text-center max-w-4xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block mb-2">
          Curated Category
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900">
          {currentCategory.name}
        </h1>
        {currentCategory.description && (
          <p className="mt-3 text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            {currentCategory.description}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Link
            href="/shop"
            prefetch={true}
            className="text-xs font-semibold uppercase tracking-wider text-brand-maroon hover:text-brand-deepMaroon flex items-center gap-1"
          >
            <span>Explore All Accessories</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-lg border border-stone-200 p-8">
          <h3 className="font-serif text-lg text-stone-800 mb-2">
            No pieces currently listed in this category
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
            Our artisans are handcrafting new items. Check back shortly or contact our workshop for bespoke orders.
          </p>
          <Link
            href="/shop"
            className="px-6 py-2 bg-brand-maroon text-white text-xs font-medium rounded hover:bg-brand-deepMaroon"
          >
            Explore All Pieces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
