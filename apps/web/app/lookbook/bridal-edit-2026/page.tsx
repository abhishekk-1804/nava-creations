'use client';

import React from 'react';
import Link from 'next/link';
import {
  SparklesIcon,
  WhatsAppIcon,
  ShieldCheckIcon,
  CheckIcon,
} from '@/components/icons';
import { CONFIG, buildWhatsAppLink, buildPhoneCallLink } from '@/lib/config';
import { BANGLE_SIZES } from '@/components/bangle-size-guide-modal';

export default function BridalLookbookPage() {
  const handlePrint = () => {
    window.print();
  };

  const primaryWhatsAppUrl = buildWhatsAppLink(
    'Hello NAVA Creations Bengaluru, I am reviewing the Bridal Edit 2026 Lookbook & Trousseau Guide and would like to schedule a bridal consultation.'
  );

  return (
    <div className="bg-[#FAF6F0] min-h-screen text-stone-900 pb-20 print:bg-white print:p-0 print:pb-0">
      {/* Action Bar (Hidden in Print, Relative on Mobile, Sticky on Desktop) */}
      <div className="relative sm:sticky sm:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-brand-sand py-3 px-4 sm:px-8 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/collections/bridal-edit-2026"
              className="text-xs text-stone-500 hover:text-brand-maroon flex items-center gap-1 font-medium"
            >
              <span>&larr; Back to Bridal Collection</span>
            </Link>
            <span className="text-stone-300">|</span>
            <span className="text-xs font-semibold text-brand-maroon">
              Official 2026 Trousseau Lookbook
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-maroon text-white hover:bg-brand-deepMaroon rounded-lg text-xs font-semibold transition-all shadow-sm"
              title="Print or Save as PDF"
            >
              <span>Print / Save as PDF</span>
            </button>

            <a
              href={primaryWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </div>
      </div>

      {/* Printable Lookbook Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-12 sm:space-y-16 print:max-w-none print:px-0 print:pt-0 print:space-y-8">
        {/* ============================================================== */}
        {/* SECTION 1: COVER & ATELIER STORY                               */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-br from-[#4A1525] via-[#350E1A] to-[#200810] rounded-3xl p-8 sm:p-14 text-white shadow-2xl border-2 border-brand-gold/50 relative overflow-hidden print:rounded-none print:border-none print:shadow-none print:bg-[#4A1525] print:p-8">
          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            {/* Header Crest */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-gold/20 text-brand-lightGold rounded-full text-xs uppercase tracking-[0.25em] font-semibold border border-brand-gold/40">
              <SparklesIcon className="w-4 h-4 text-brand-gold" />
              <span>NAVA CREATIONS &bull; BENGALURU ATELIER</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight">
              Bridal Edit 2026: Heirloom Trousseau Guide
            </h1>

            <p className="font-serif text-lg sm:text-xl text-brand-lightGold italic font-light">
              &ldquo;Custom-Sized Handcrafted Bangles &amp; Regal Kundan Artistry for Indian Weddings&rdquo;
            </p>

            <div className="w-24 h-0.5 bg-brand-gold/60 mx-auto my-4" />

            {/* Atelier Story Paragraph */}
            <div className="text-sm sm:text-base text-stone-200 leading-relaxed space-y-4 text-left sm:text-justify bg-black/20 p-6 rounded-2xl border border-brand-gold/20 backdrop-blur-sm print:bg-transparent print:p-0 print:border-none">
              <p>
                Founded in Bengaluru, Karnataka, <strong>NAVA CREATIONS</strong> crafts bespoke bridal and festive bangles celebrating traditional Indian ceremonial splendor. Each piece is meticulously hand-assembled by master karigars using authentic <strong>Jadau Kundan stonework</strong>, faceted ruby cabochons, and silk-threaded elements.
              </p>
              <p>
                Unlike mass-manufactured jewellery that tarnishes after single celebrations, NAVA heirloom bangles feature <strong>1-micron 22K electro-gold plating</strong> with an anti-oxidant lacquer shield, ensuring your bridal jewellery retains its warm golden luster through decades of family milestones.
              </p>
            </div>

            {/* Atelier Heritage Badges */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-brand-gold/30">
                <span className="block text-[10px] uppercase tracking-wider text-brand-lightGold font-bold">Origin</span>
                <span className="font-serif text-sm font-semibold text-white">Bengaluru Atelier</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-brand-gold/30">
                <span className="block text-[10px] uppercase tracking-wider text-brand-lightGold font-bold">Plating</span>
                <span className="font-serif text-sm font-semibold text-white">1-Micron 22K Gold</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-brand-gold/30">
                <span className="block text-[10px] uppercase tracking-wider text-brand-lightGold font-bold">Fitment</span>
                <span className="font-serif text-sm font-semibold text-white">Sizes 2.2 to 2.10</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-brand-gold/30">
                <span className="block text-[10px] uppercase tracking-wider text-brand-lightGold font-bold">Timelines</span>
                <span className="font-serif text-sm font-semibold text-white">7&ndash;14 Days Handcraft</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: CURATED 2026 BRIDAL EDITS                          */}
        {/* ============================================================== */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-brand-darkGold font-bold">
              The 2026 Trousseau Collection
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
              Three Curated Atelier Pillars
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Designed to accompany the bride through Mehendi, Sangeet, Muhurtham, and Reception rituals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Pillar 1: Bridal Chuda Ensembles */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="aspect-square bg-stone-100 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/branding/sample-chuda-1.jpg"
                  alt="Royal Heritage Bridal Kundan Chuda"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-maroon text-white text-[10px] uppercase font-bold rounded">
                  Bridal Chuda
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Royal Heritage Chuda Set
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    A ceremonial ensemble featuring broad Kundan kadas flanked by ruby spacer bangles. Sized symmetrically for left and right forearms.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-maroon">₹3,499</span>
                  <span className="text-stone-500 text-[11px]">Sizes 2.2 to 2.10</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Temple Kundan Kadas */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="aspect-square bg-stone-100 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/branding/sample-kada-1.jpg"
                  alt="Mayura Openable Temple Kada"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-darkGold text-white text-[10px] uppercase font-bold rounded">
                  Temple Jewellery
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Mayura Openable Temple Kada
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    Intricately carved peacock motifs with green and ruby stone accents. Screw-lock openable mechanism ensuring effortless fitment.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-maroon">₹1,899</span>
                  <span className="text-stone-500 text-[11px]">Free-Size Openable</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Sangeet & Return Gift Hampers */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="aspect-square bg-stone-100 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/branding/sample-gift-1.jpg"
                  alt="Atelier Return Gift Hamper"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-800 text-white text-[10px] uppercase font-bold rounded">
                  Return Gifts
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Festive Trousseau Gift Hamper
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    Custom silk-wrapped bangle favours with brass kumkum boxes and potli bags. Tiered bulk discounts for wedding parties (25+ units).
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-maroon">From ₹299 / set</span>
                  <span className="text-stone-500 text-[11px]">Bulk Customised</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: BANGLE WRIST-SIZING GUIDE (2.2 to 2.10)             */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-8 sm:p-10 border border-brand-sand shadow-sm space-y-6">
          <div className="border-b border-brand-sand pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase tracking-widest text-brand-darkGold font-bold block mb-1">
                Precision Fit Protocol
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Official Bangle Wrist-Sizing Guide (2.2 &ndash; 2.10)
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-cream text-brand-maroon rounded-full text-xs font-semibold border border-brand-gold/40 self-start sm:self-auto">
              <ShieldCheckIcon className="w-4 h-4 text-brand-gold" />
              <span>Standard Indian Sizing Scale</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Unlike western bracelets with clasps, Indian bangles slide directly over the hand. Measuring the inside diameter of a well-fitting bangle or your hand knuckle circumference ensures a perfect fit.
          </p>

          {/* Sizing Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#4A1525] text-white uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Indian Size</th>
                  <th className="py-3 px-4 font-semibold">Inner Diameter (Inches)</th>
                  <th className="py-3 px-4 font-semibold">Inner Diameter (mm)</th>
                  <th className="py-3 px-4 font-semibold">Inner Circumference</th>
                  <th className="py-3 px-4 font-semibold">Target Wrist Fitment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {BANGLE_SIZES.map((b) => (
                  <tr key={b.size} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="py-3 px-4 font-serif text-base font-bold text-brand-maroon">{b.size}</td>
                    <td className="py-3 px-4 text-stone-700 font-medium">{b.diameterInches}</td>
                    <td className="py-3 px-4 text-stone-900 font-bold">{b.diameterMm} mm</td>
                    <td className="py-3 px-4 text-stone-700">{b.circumferenceMm} mm ({(b.circumferenceMm/10).toFixed(1)} cm)</td>
                    <td className="py-3 px-4 text-stone-600 text-[11px]">{b.fitTag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Measuring Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-brand-cream/50 p-4 rounded-xl border border-brand-sand">
              <h4 className="font-serif text-sm font-bold text-brand-maroon mb-1">
                Method A: Measuring an Existing Bangle
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Take a circular bangle that fits you comfortably. Measure the straight-line inside diameter in millimetres using a ruler. Match against the <strong>Inner Diameter (mm)</strong> column above.
              </p>
            </div>

            <div className="bg-brand-cream/50 p-4 rounded-xl border border-brand-sand">
              <h4 className="font-serif text-sm font-bold text-brand-maroon mb-1">
                Method B: Measuring Knuckle Circumference
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Bring your thumb and pinky finger together. Wrap a strip of paper or string around the widest part of your knuckles. Mark and measure on a ruler, then match to <strong>Inner Circumference</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: BRIDAL TROUSSEAU & BULK BOOKING DESK               */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-br from-[#2D0A16] to-[#1C050E] rounded-3xl p-8 sm:p-12 text-white border-2 border-brand-gold/50 shadow-xl space-y-6">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase tracking-widest text-brand-lightGold font-bold">
              Direct Workshop Reservation
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight text-white">
              Bridal Trousseau &amp; Bulk Return Gift Booking Desk
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Every bride&apos;s wrists and wedding ensemble color palette are unique. Connect directly with our Bengaluru studio artisans for custom colour matching, wrist sizing verification, and scheduled delivery dates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {/* Primary WhatsApp Line */}
            <div className="bg-white/10 rounded-2xl p-5 border border-brand-gold/30 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-brand-lightGold font-bold block">
                Primary WhatsApp Concierge
              </span>
              <div className="font-serif text-xl font-bold text-white">
                {CONFIG.whatsapp.displayNumber}
              </div>
              <p className="text-xs text-stone-300">
                Direct artisan inquiries, custom size confirmations, and order tracking.
              </p>
              <a
                href={primaryWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-gold hover:text-white font-semibold pt-1 underline"
              >
                <span>Message on WhatsApp &rarr;</span>
              </a>
            </div>

            {/* Studio / Bridal Consultation Line */}
            <div className="bg-white/10 rounded-2xl p-5 border border-brand-gold/30 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-brand-lightGold font-bold block">
                Studio Consultation Desk
              </span>
              <div className="font-serif text-xl font-bold text-white">
                {CONFIG.studioDesk.displayNumber}
              </div>
              <p className="text-xs text-stone-300">
                Bridal appointments, bulk gift orders, and atelier consultations.
              </p>
              <a
                href={buildPhoneCallLink()}
                className="inline-flex items-center gap-1.5 text-xs text-brand-gold hover:text-white font-semibold pt-1 underline"
              >
                <span>Call Studio Line &rarr;</span>
              </a>
            </div>

            {/* Instagram Atelier */}
            <div className="bg-white/10 rounded-2xl p-5 border border-brand-gold/30 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-brand-lightGold font-bold block">
                Instagram Workshop
              </span>
              <div className="font-serif text-xl font-bold text-white">
                @{CONFIG.social.instagramHandle}
              </div>
              <p className="text-xs text-stone-300">
                Real bride client photos, behind-the-scenes crafting, and new festive drops.
              </p>
              <a
                href={CONFIG.social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-gold hover:text-white font-semibold pt-1 underline"
              >
                <span>Follow on Instagram &rarr;</span>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-gold/30 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-brand-gold" />
              <span>Custom bridal handcrafting timeline: 7&ndash;14 business days</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-brand-gold" />
              <span>Complimentary insured shipping across India</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-brand-gold" />
              <span>Sovereign India-first payments: Zero-MDR BharatPe UPI &amp; COD</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
