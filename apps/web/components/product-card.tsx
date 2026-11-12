import React from 'react';
import Link from 'next/link';
import { ProductDto } from '@nava/domain';
import { ShoppingBagIcon } from './icons';

interface ProductCardProps {
  product: ProductDto & { isDevelopmentPlaceholder?: boolean };
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isPrimary) || product.images[0]
      : null;

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const discountPercent =
    product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise
      ? Math.round(
          ((product.compareAtPricePaise - product.pricePaise) / product.compareAtPricePaise) * 100
        )
      : 0;

  return (
    <article className="group relative flex flex-col bg-white rounded-lg border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-brand-cream/50"
      >
        {primaryImage?.url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
            <ShoppingBagIcon className="w-10 h-10 mb-2" />
            <span className="text-xs text-stone-400">Photo Coming Soon</span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-brand-maroon text-white rounded">
              Featured
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-amber-700 text-white rounded">
              {discountPercent}% Off
            </span>
          )}
        </div>

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold rounded">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.category?.name && (
            <span className="text-[11px] uppercase tracking-wider text-brand-darkGold font-medium block mb-1">
              {product.category.name}
            </span>
          )}

          <h3 className="font-serif text-base font-medium text-stone-900 line-clamp-2 group-hover:text-brand-maroon transition-colors leading-snug">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {product.variants && product.variants.length > 1 && (
            <span className="inline-block text-[11px] text-stone-500 mt-1">
              {product.variants.length} Sizes Available
            </span>
          )}
        </div>

        {/* Pricing Block */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-stone-900">
              {formatPrice(product.pricePaise)}
            </span>
            {product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(product.compareAtPricePaise)}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="text-xs font-medium text-brand-maroon hover:text-brand-deepMaroon underline"
          >
            View Piece
          </Link>
        </div>
      </div>
    </article>
  );
}
