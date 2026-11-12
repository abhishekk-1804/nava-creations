import React from 'react';
import Link from 'next/link';
import { CatalogService } from '@/lib/catalog-service';
import { ProductCard } from '@/components/product-card';
import {
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TruckIcon,
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
      {/* Hero Section */}
      <section className="relative bg-brand-cream border-b border-brand-sand overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-sand/60 text-brand-maroon rounded-full text-xs uppercase tracking-widest font-semibold mb-6">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Handcrafted in Bengaluru</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-stone-900 tracking-tight leading-[1.15]">
              Timeless Artistry in Every Bangle.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-stone-600 font-normal leading-relaxed">
              Discover heirloom bridal bangles, regal Kundan stonework, and custom-sized accessories meticulously hand-finished for your most cherished celebrations.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="px-8 py-3.5 bg-brand-maroon text-white rounded text-sm font-medium hover:bg-brand-deepMaroon transition-all shadow-sm hover:shadow flex items-center gap-2 group"
              >
                <span>Explore Accessories</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/collections/bridal-edit-2026"
                className="px-8 py-3.5 bg-white border border-stone-300 text-stone-800 rounded text-sm font-medium hover:border-brand-maroon hover:text-brand-maroon transition-colors"
              >
                Bridal Edit 2026
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Luxury Background Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-sand/40 to-transparent pointer-events-none hidden lg:block" />
      </section>

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
              className="group relative block bg-white p-6 rounded-lg border border-stone-200/80 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all text-center"
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

      {/* Featured Pieces Grid */}
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

      {/* Merchandising Spotlight: Bridal Edit */}
      {bridalCollection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-deepMaroon rounded-2xl overflow-hidden text-white grid grid-cols-1 lg:grid-cols-2 items-center">
            <div className="p-8 sm:p-12 lg:p-16 space-y-6">
              <span className="text-xs uppercase tracking-widest text-brand-lightGold font-semibold">
                Bridal Collection &bull; 2026
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight">
                {bridalCollection.name}
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed max-w-lg">
                {bridalCollection.description} Each piece is custom sized to fit bridal wrists flawlessly, featuring non-tarnish settings and regal heirloom craftsmanship.
              </p>
              <div className="pt-2">
                <Link
                  href={`/collections/${bridalCollection.slug}`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-gold text-stone-900 rounded text-sm font-semibold hover:bg-brand-lightGold transition-colors"
                >
                  <span>Explore Bridal Trousseau</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="h-64 lg:h-full min-h-[320px] bg-stone-800 relative">
              {bridalCollection.coverImageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={bridalCollection.coverImageUrl}
                  alt={bridalCollection.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Craftsmanship & Custom Sizing Banner */}
      <section className="bg-brand-cream py-16 border-y border-brand-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block mb-2">
              Why Choose NAVA
            </span>
            <h2 className="font-serif text-3xl font-medium text-stone-900">
              Devoted to Detail &amp; Custom Fit
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border border-stone-200/80 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-ivory flex items-center justify-center text-brand-maroon mb-4">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 mb-2">
                Custom Bangle Sizing
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Standard bangle sizes (2.2, 2.4, 2.6, 2.8, 2.10) crafted to ensure a comfortable, snug fit for every wrist.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-stone-200/80 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-ivory flex items-center justify-center text-brand-maroon mb-4">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 mb-2">
                Authentic Kundan Work
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Faceted glass stones set in traditional Jadau frames with rich enamel detailing and micron gold plating.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg border border-stone-200/80 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-ivory flex items-center justify-center text-brand-maroon mb-4">
                <TruckIcon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 mb-2">
                Wedding &amp; Return Gifts
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Curated packaging and bulk gift boxes for baby showers, housewarmings, poojas, and sangeet favors.
              </p>
            </div>
          </div>
        </div>
      </section>

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
          <div className="flex items-center justify-center gap-4 pt-4">
            <a
              href={CONFIG.social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>@{CONFIG.social.instagramHandle}</span>
            </a>
            <a
              href={buildWhatsAppLink('Hello NAVA Creations! I would like to enquire about your jewellery collections.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>WhatsApp Studio</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
