import React from 'react';
import Link from 'next/link';
import { CatalogService } from '@/lib/catalog-service';
import { ProductCard } from '@/components/product-card';
import { HeroShowcase } from '@/components/hero-showcase';
import { BridalEditBanner } from '@/components/bridal-edit-banner';
import { CraftsmanshipSection } from '@/components/craftsmanship-section';
import {
  ArrowRightIcon,
  SparklesIcon,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/icons';
import { CONFIG, buildWhatsAppLink } from '@/lib/config';

export default async function HomePage() {
  const [featuredResult, categories, collections] = await Promise.all([
    CatalogService.getPublishedProducts({ isFeatured: true, limit: 4 }),
    CatalogService.getCategories(),
    CatalogService.getPublishedCollections(),
  ]);

  const featuredProducts = featuredResult.items;
  const bridalCollection = collections.length > 0 ? collections[0] : null;

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Elevated Editorial Hero with Arched Luxury Showcase Card */}
      <HeroShowcase />

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block mb-1">
              Curated Categories
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold uppercase tracking-wider text-brand-maroon hover:text-brand-deepMaroon flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative block bg-white p-6 rounded-xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-cream flex items-center justify-center text-brand-maroon mb-4 group-hover:scale-110 transition-transform">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-base font-medium text-stone-900 group-hover:text-brand-maroon transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                {cat.description || 'Explore collection'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Pieces Grid with Micro-Interactions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block mb-1">
              Bengaluru Studio Favourites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
              Featured Pieces
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold uppercase tracking-wider text-brand-maroon hover:text-brand-deepMaroon flex items-center gap-1 group"
          >
            <span>Browse All ({featuredProducts.length}+)</span>
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Merchandising Spotlight: Bridal Edit 2026 Split Banner */}
      <BridalEditBanner
        collectionSlug={bridalCollection?.slug || 'bridal-edit-2026'}
        collectionName={bridalCollection?.name || 'Bridal Edit 2026'}
      />

      {/* Craftsmanship & Custom Sizing Section (Interactive) */}
      <CraftsmanshipSection />

      {/* Social / Workshop Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold">
            Bengaluru Workshop &bull; Connect With Us
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            Follow Our Creative Journey
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            See behind-the-scenes bangle crafting, client wedding photos, and new limited festival releases.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4 flex-wrap">
            <a
              href={CONFIG.social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors shadow-sm"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>@{CONFIG.social.instagramHandle}</span>
            </a>
            <a
              href={buildWhatsAppLink('Hello NAVA Creations! I would like to enquire about your jewellery collections.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>WhatsApp Studio ({CONFIG.whatsapp.displayNumber})</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

