'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProductDto } from '@nava/domain';
import { WhatsAppIcon } from './icons';
import { buildWhatsAppLink } from '@/lib/config';

interface ProductCardProps {
  product: ProductDto & { isDevelopmentPlaceholder?: boolean };
}

const DEFAULT_PLACEHOLDER = '/branding/nava-product-placeholder.jpg';

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isPrimary) || product.images[0]
      : null;

  const [imgSrc, setImgSrc] = useState<string>(primaryImage?.url || DEFAULT_PLACEHOLDER);

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

  const savingsPaise =
    product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise
      ? product.compareAtPricePaise - product.pricePaise
      : 0;

  // Extract unique sizes from variants if available
  const availableSizes: string[] = product.variants
    ? Array.from(
        new Set(
          product.variants
            .map((v) => {
              if (v.size && v.size.trim()) return v.size.trim();
              if (v.title && v.title.startsWith('Size ')) return v.title.replace('Size ', '').trim();
              return null;
            })
            .filter((s): s is string => Boolean(s))
        )
      )
    : [];

  const whatsappInquiryUrl = buildWhatsAppLink(
    `Hello NAVA Creations Bengaluru, I am inquiring about "${product.name}" (${formatPrice(product.pricePaise)}). Could you assist with size availability and bridal delivery timelines?`
  );

  return (
    <article className="group relative flex flex-col bg-white rounded-xl border border-stone-200/90 hover:border-brand-gold/60 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        prefetch={true}
        className="relative block aspect-square overflow-hidden bg-brand-cream/50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={primaryImage?.altText || product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={() => {
            if (imgSrc !== DEFAULT_PLACEHOLDER) {
              setImgSrc(DEFAULT_PLACEHOLDER);
            }
          }}
        />

        {/* Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isFeatured && (
            <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-brand-maroon text-white rounded shadow-sm">
              Featured
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-amber-700 text-white rounded shadow-sm">
              {discountPercent}% Off &bull; Save {formatPrice(savingsPaise)}
            </span>
          )}
        </div>

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="px-3.5 py-1.5 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold rounded shadow-md">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {product.category?.name && (
            <span className="text-[11px] uppercase tracking-wider text-brand-darkGold font-semibold block mb-1">
              {product.category.name}
            </span>
          )}

          <h3 className="font-serif text-base font-medium text-stone-900 line-clamp-2 group-hover:text-brand-maroon transition-colors leading-snug">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Size Pills Row */}
          {availableSizes.length > 0 ? (
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Sizes:</span>
              {availableSizes.slice(0, 4).map((size) => (
                <span
                  key={size}
                  className="px-1.5 py-0.5 text-[10px] font-medium bg-brand-cream text-brand-maroon rounded border border-brand-sand/60"
                >
                  {size}
                </span>
              ))}
              {availableSizes.length > 4 && (
                <span className="text-[10px] text-stone-500 font-medium">
                  +{availableSizes.length - 4} more
                </span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-stone-500 mt-2">
              Bespoke wrist sizing available
            </div>
          )}
        </div>

        {/* Pricing & Actions Block */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-stone-900">
              {formatPrice(product.pricePaise)}
            </div>
            {product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise && (
              <div className="text-[11px] text-stone-400 line-through">
                {formatPrice(product.compareAtPricePaise)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-600 transition-colors flex items-center justify-center shrink-0"
              aria-label={`Ask about ${product.name} on WhatsApp`}
              title="Ask on WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>

            <Link
              href={`/products/${product.slug}`}
              prefetch={true}
              className="min-h-[44px] px-4 py-2.5 bg-brand-maroon hover:bg-brand-deepMaroon text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center"
            >
              View Piece
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

