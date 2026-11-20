import React from 'react';
import Link from 'next/link';
import { InstagramIcon, WhatsAppIcon, ShieldCheckIcon, TruckIcon, RefreshCwIcon } from './icons';
import { CONFIG, buildWhatsAppLink, buildPhoneCallLink } from '@/lib/config';

export function Footer() {
  return (
    <footer className="bg-brand-burgundy text-stone-300 pt-16 pb-8 border-t border-brand-maroon/30 print:hidden">
      {/* Trust & Craftsmanship Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-lightGold flex-shrink-0">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">Artisanal Craftsmanship</h4>
              <p className="text-xs text-stone-400 mt-1">
                Hand-finished in our Bengaluru workshop with traditional Kundan settings and 1-micron 22K gold plating.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-lightGold flex-shrink-0">
              <TruckIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">Pan-India Insured Dispatch</h4>
              <p className="text-xs text-stone-400 mt-1">
                Carefully packaged in protective keepsake trousseau boxes and dispatched via domestic couriers nationwide.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-lightGold flex-shrink-0">
              <RefreshCwIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">Bespoke Bridal Sizing</h4>
              <p className="text-xs text-stone-400 mt-1">
                Standard bangle sizes (2.2, 2.4, 2.6, 2.8, 2.10) and custom bridal sets crafted to your exact wrist fitment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              prefetch={true}
              className="inline-block group cursor-pointer"
            >
              <span className="font-serif text-2xl tracking-[0.18em] font-medium text-white block group-hover:text-brand-lightGold transition-colors">
                NAVA CREATIONS
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-brand-lightGold block -mt-1 font-medium">
                Bengaluru &bull; Atelier
              </span>
            </Link>
            <p className="text-xs text-stone-400 mt-4 max-w-sm leading-relaxed">
              Curated handmade bangles, royal Kundan jewellery, and bespoke wedding accessories crafted with devotion in Bengaluru, Karnataka.
            </p>

            {/* Direct Studio Contact Lines */}
            <div className="mt-4 space-y-1.5 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <span className="text-brand-gold font-semibold">WhatsApp Concierge:</span>
                <a
                  href={buildWhatsAppLink('Hello NAVA Creations Bengaluru, I would like to inquire about bespoke bridal bangles.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline"
                >
                  {CONFIG.whatsapp.displayNumber}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-gold font-semibold">Studio Consultation:</span>
                <a href={buildPhoneCallLink()} className="hover:text-white underline">
                  {CONFIG.studioDesk.displayNumber}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-5">
              <a
                href={CONFIG.social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-brand-lightGold hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
                title={`Follow @${CONFIG.social.instagramHandle} on Instagram`}
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={buildWhatsAppLink('Hello NAVA Creations! I would like to enquire about your jewellery collections.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-emerald-400 hover:text-white transition-colors"
                aria-label="Chat on WhatsApp"
                title={`Chat with Atelier on WhatsApp (${CONFIG.whatsapp.displayNumber})`}
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Categories
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/categories/handmade-bangles" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Handmade Bangles
                </Link>
              </li>
              <li>
                <Link href="/categories/bridal-jewellery" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Bridal Sets &amp; Chuda
                </Link>
              </li>
              <li>
                <Link href="/categories/kundan-artistry" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Kundan Artistry
                </Link>
              </li>
              <li>
                <Link href="/categories/hair-accessories" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Hair Accessories
                </Link>
              </li>
              <li>
                <Link href="/categories/return-gifts" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Return Gifts &amp; Favours
                </Link>
              </li>
            </ul>
          </div>

          {/* Merchandising Collections */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Collections
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/collections/bridal-edit-2026" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Bridal Edit 2026
                </Link>
              </li>
              <li>
                <Link href="/lookbook/bridal-edit-2026" prefetch={true} className="text-brand-gold hover:text-white font-semibold transition-colors">
                  ✦ 2026 Bridal Lookbook
                </Link>
              </li>
              <li>
                <Link href="/collections/bestsellers" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Bengaluru Bestsellers
                </Link>
              </li>
              <li>
                <Link href="/collections/festive-return-gifts" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Festive Return Gifts
                </Link>
              </li>
              <li>
                <Link href="/shop" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  View All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio & Customer Care */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Customer Care
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  About NAVA Workshop
                </Link>
              </li>
              <li>
                <Link href="/contact" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Returns &amp; Replacements
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" prefetch={true} className="hover:text-brand-lightGold transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright & Governance Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/5 text-[11px] text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} NAVA CREATIONS. Artisanal jewellery workshop in Bengaluru, Karnataka, India.
        </div>
        <div className="flex flex-wrap gap-4 text-stone-400">
          <Link href="/policies/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/policies/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/policies/shipping" className="hover:text-white transition-colors">Shipping</Link>
          <Link href="/policies/returns" className="hover:text-white transition-colors">Returns</Link>
        </div>
      </div>
    </footer>
  );
}
