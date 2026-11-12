import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogService } from '@/lib/catalog-service';
import { ProductDetailView } from '@/components/product-detail-view';
import { ChevronRightIcon } from '@/components/icons';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await CatalogService.getProductBySlug(slug);

  if (!product) {
    return { title: 'Piece Not Found | NAVA CREATIONS' };
  }

  return {
    title: `${product.name} | NAVA CREATIONS — Bengaluru`,
    description:
      product.description ||
      `Discover handcrafted ${product.name} with bespoke sizing and authentic artisan finishes from NAVA CREATIONS Bengaluru.`,
    openGraph: {
      title: `${product.name} | NAVA CREATIONS`,
      description:
        product.description ||
        `Handcrafted ${product.name} from NAVA CREATIONS Bengaluru atelier.`,
      images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await CatalogService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related items from the same category
  const relatedResult = await CatalogService.getPublishedProducts({
    categoryId: product.categoryId,
    limit: 5,
  });

  const relatedProducts = relatedResult.items.filter((p) => p.id !== product.id);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map((img) => img.url) || [],
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'NAVA CREATIONS',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: (product.pricePaise / 100).toFixed(2),
      availability: product.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Schema.org Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 gap-1.5">
        <Link href="/" className="hover:text-brand-maroon">
          Home
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-brand-maroon">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRightIcon className="w-3.5 h-3.5" />
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-brand-maroon"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-stone-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Interactive Product Detail View */}
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
