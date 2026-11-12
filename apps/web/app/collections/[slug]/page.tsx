import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CatalogService } from '@/lib/catalog-service';
import { ProductCard } from '@/components/product-card';
import { ChevronRightIcon, ArrowRightIcon, WhatsAppIcon } from '@/components/icons';
import { buildWhatsAppLink } from '@/lib/config';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const result = await CatalogService.getCollectionProducts(slug, { limit: 24 });

  if (!result) {
    notFound();
  }

  const { collection, products } = result;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-brand-maroon">
          Collections
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium">{collection.name}</span>
      </nav>

      {/* Collection Hero Banner */}
      <div className="bg-brand-deepMaroon rounded-2xl overflow-hidden text-white grid grid-cols-1 lg:grid-cols-2 items-center">
        <div className="p-8 sm:p-12 lg:p-16 space-y-6">
          <span className="text-xs uppercase tracking-widest text-brand-lightGold font-semibold">
            Curated Merchandising Edit
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-tight">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-sm text-stone-300 leading-relaxed max-w-lg">
              {collection.description}
            </p>
          )}
          <div className="pt-2 flex flex-wrap gap-4">
            <a
              href={buildWhatsAppLink(`Hello NAVA Creations, I would like to enquire about pieces from the ${collection.name} collection.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Enquire for Bulk / Bridal</span>
            </a>
          </div>
        </div>

        <div className="h-64 lg:h-full min-h-[320px] bg-stone-800 relative">
          {collection.coverImageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={collection.coverImageUrl}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Collection Products */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-brand-sand pb-4">
          <h2 className="font-serif text-2xl font-medium text-stone-900">
            Pieces in this Collection ({products.items.length})
          </h2>
          <Link
            href="/shop"
            className="text-xs font-semibold uppercase tracking-wider text-brand-maroon hover:text-brand-deepMaroon flex items-center gap-1"
          >
            <span>All Collections</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {products.items.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-lg border border-stone-200 p-8">
            <p className="text-xs text-stone-500">
              No products are currently published in this collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
