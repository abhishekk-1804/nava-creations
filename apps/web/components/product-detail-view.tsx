'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProductDto } from '@nava/domain';
import { useCart } from '@/lib/cart-context';
import { BangleSizeGuide } from './bangle-size-guide';
import {
  ShoppingBagIcon,
  WhatsAppIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  ShieldCheckIcon,
  TruckIcon,
  RefreshCwIcon,
} from './icons';
import { buildWhatsAppLink } from '@/lib/config';

interface ProductDetailViewProps {
  product: ProductDto & { isDevelopmentPlaceholder?: boolean };
  relatedProducts: ProductDto[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const { addItem, formatPrice } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = product.images && product.images.length > 0 ? product.images : [];
  const activeImage = images[activeImageIndex] || null;

  const variants = product.variants && product.variants.length > 0 ? product.variants : [];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || 'standard'
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const currentPricePaise = selectedVariant?.pricePaise || product.pricePaise;
  const currentMrpPaise = selectedVariant?.mrpPaise || product.compareAtPricePaise;
  const availableStock = selectedVariant?.availableStock ?? (product.isAvailable ? 10 : 0);
  const isOutOfStock = availableStock <= 0;

  const discountPercent =
    currentMrpPaise && currentMrpPaise > currentPricePaise
      ? Math.round(((currentMrpPaise - currentPricePaise) / currentMrpPaise) * 100)
      : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || 'standard',
      name: product.name,
      size: selectedVariant?.size || null,
      sku: selectedVariant?.sku || product.sku || product.id,
      pricePaise: currentPricePaise,
      compareAtPricePaise: currentMrpPaise,
      imageUrl: activeImage?.url || null,
      quantity,
      maxStock: availableStock,
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const generateWhatsAppInquiry = () => {
    const sizeStr = selectedVariant?.size ? ` (Size: ${selectedVariant.size})` : '';
    return `Hello NAVA Creations! I am interested in ordering: "${product.name}"${sizeStr} priced at ${formatPrice(currentPricePaise)}. Could you please confirm dispatch timeline? URL: ${typeof window !== 'undefined' ? window.location.href : ''}`;
  };

  return (
    <div className="space-y-16">
      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery Column */}
        <div className="space-y-4">
          {/* Main Preview Container */}
          <div className="relative aspect-square rounded-xl bg-brand-cream/50 border border-stone-200/80 overflow-hidden shadow-sm">
            {activeImage?.url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activeImage.url}
                alt={activeImage.altText || product.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                <ShoppingBagIcon className="w-16 h-16 mb-2" />
                <span className="text-sm text-stone-400">Photo Coming Soon</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.isFeatured && (
                <span className="px-2.5 py-1 text-xs uppercase tracking-wider font-semibold bg-brand-maroon text-white rounded">
                  Featured Piece
                </span>
              )}
              {discountPercent > 0 && (
                <span className="px-2.5 py-1 text-xs uppercase tracking-wider font-semibold bg-amber-700 text-white rounded">
                  {discountPercent}% Off MRP
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-brand-maroon shadow-sm'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <div>
              {product.category?.name && (
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold hover:underline block mb-2"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-serif text-2xl sm:text-4xl font-normal text-stone-900 tracking-tight leading-tight">
                {product.name}
              </h1>
              {selectedVariant?.sku && (
                <span className="text-[11px] text-stone-400 font-mono block mt-1">
                  SKU: {selectedVariant.sku}
                </span>
              )}
            </div>

            {/* Price Block */}
            <div className="p-4 bg-brand-cream/60 rounded-lg border border-brand-sand flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-semibold text-stone-900">
                    {formatPrice(currentPricePaise)}
                  </span>
                  {currentMrpPaise && currentMrpPaise > currentPricePaise && (
                    <span className="text-sm text-stone-400 line-through">
                      MRP {formatPrice(currentMrpPaise)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-stone-500 block mt-1">
                  Inclusive of all taxes &bull; Standard shipping calculated at checkout
                </span>
              </div>

              {discountPercent > 0 && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Bangle Size / Variant Selector */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                    Select Bangle Size:
                  </span>
                  <BangleSizeGuide />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const vStock = v.availableStock ?? 5;
                    const vOutOfStock = vStock <= 0;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        disabled={vOutOfStock}
                        className={`p-3 text-left rounded-lg border transition-all ${
                          isSelected
                            ? 'border-brand-maroon bg-brand-cream shadow-sm ring-1 ring-brand-maroon'
                            : vOutOfStock
                            ? 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                            : 'border-stone-200 hover:border-stone-400 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-stone-900">
                            {v.size ? `Size ${v.size}` : v.title}
                          </span>
                          {isSelected && <CheckIcon className="w-4 h-4 text-brand-maroon" />}
                        </div>
                        <span className="text-[10px] text-stone-500 block mt-0.5">
                          {vOutOfStock ? 'Sold Out' : `${vStock} in stock`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                  Quantity:
                </span>
                <span
                  className={`text-xs font-medium ${
                    isOutOfStock
                      ? 'text-red-700'
                      : availableStock <= 3
                      ? 'text-amber-800'
                      : 'text-emerald-700'
                  }`}
                >
                  {isOutOfStock
                    ? 'Sold Out'
                    : availableStock <= 3
                    ? `Only ${availableStock} left in stock!`
                    : `In Stock (${availableStock} units ready)`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-stone-300 rounded bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2.5 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-semibold text-stone-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    disabled={quantity >= availableStock || isOutOfStock}
                    className="p-2.5 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtotal preview */}
                <span className="text-xs text-stone-500">
                  Total: {formatPrice(currentPricePaise * quantity)}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-brand-maroon text-white rounded-lg text-sm font-semibold hover:bg-brand-deepMaroon transition-all shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                <span>{isOutOfStock ? 'Currently Sold Out' : 'Add to Bag'}</span>
              </button>

              {addedNotice && (
                <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-center text-xs font-medium animate-fadeIn">
                  Piece added to your shopping bag!
                </div>
              )}

              <a
                href={buildWhatsAppLink(generateWhatsAppInquiry())}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Enquire Directly on WhatsApp</span>
              </a>
            </div>

            {/* Description & Craftsmanship Details */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-2">
                  Artisanal Description
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {product.description ||
                    'Handcrafted with devotion in our Bengaluru atelier. Every bangle and kada is carefully assembled with hand-selected Kundan stones and micron gold polish.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100 text-stone-700">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldCheckIcon className="w-4 h-4 text-brand-darkGold" />
                  <span>100% Handcrafted</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <TruckIcon className="w-4 h-4 text-brand-darkGold" />
                  <span>Pan-India Courier</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <RefreshCwIcon className="w-4 h-4 text-brand-darkGold" />
                  <span>Custom Sizing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Pieces Grid */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-brand-sand space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-medium text-stone-900">
              You May Also Adore
            </h3>
            <Link
              href="/shop"
              className="text-xs font-semibold uppercase tracking-wider text-brand-maroon hover:underline"
            >
              Explore All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((rel) => (
              <article
                key={rel.id}
                className="group relative flex flex-col bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <Link
                  href={`/products/${rel.slug}`}
                  className="aspect-square bg-brand-cream/50 overflow-hidden block"
                >
                  {rel.images?.[0]?.url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={rel.images[0].url}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </Link>
                <div className="p-3">
                  <h4 className="font-serif text-sm font-medium text-stone-900 truncate">
                    <Link href={`/products/${rel.slug}`}>{rel.name}</Link>
                  </h4>
                  <span className="text-xs font-semibold text-stone-800 block mt-1">
                    {formatPrice(rel.pricePaise)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
