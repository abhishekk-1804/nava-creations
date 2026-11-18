'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon, ShieldCheckIcon } from './icons';
import { BangleSizeGuideModal } from './bangle-size-guide-modal';

export function HeroShowcase() {
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [initialSize, setInitialSize] = useState('2.6');

  const openSizingGuide = (size = '2.6') => {
    setInitialSize(size);
    setSizeModalOpen(true);
  };

  return (
    <>
      <section className="relative bg-brand-cream border-b border-brand-sand overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left 7 Columns: Editorial Storytelling */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-sand/70 text-brand-maroon rounded-full text-xs uppercase tracking-widest font-semibold border border-brand-gold/30">
                <SparklesIcon className="w-3.5 h-3.5 text-brand-gold" />
                <span>✦ BENGALURU ATELIER &bull; BESPOKE BRIDAL &amp; FESTIVE</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-stone-900 tracking-tight leading-[1.12]">
                Heirloom Bangles, Crafted for Your Sacred Moments.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 font-normal leading-relaxed max-w-xl">
                Discover bespoke bridal chuda ensembles, regal Jadau Kundan kadas, and hand-finished festive sets tailored to your exact wrist size in our Bengaluru studio.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop"
                  className="px-8 py-3.5 bg-brand-maroon text-white rounded-lg text-sm font-semibold hover:bg-brand-deepMaroon transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                >
                  <span>Explore Atelier Pieces</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/collections/bridal-edit-2026"
                  className="px-7 py-3.5 bg-white border border-brand-gold/60 text-stone-800 rounded-lg text-sm font-semibold hover:border-brand-maroon hover:text-brand-maroon transition-all shadow-xs"
                >
                  Bridal Edit 2026
                </Link>
              </div>

              {/* Quick Trust Strip */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-stone-500 border-t border-brand-sand/80">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-brand-gold" />
                  <span>Custom Sized (2.2 &ndash; 2.10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  <span>Micron Gold Plated &bull; Non-Tarnish</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  <span>7&ndash;14 Days Handcrafted</span>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Arched Luxury Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-gradient-to-b from-[#4A1525] via-[#380E1C] to-[#250812] rounded-t-[140px] rounded-b-2xl p-5 sm:p-6 text-white shadow-2xl border-2 border-brand-gold/50 relative overflow-hidden group">
                {/* Background filigree glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold/20 via-transparent to-transparent pointer-events-none" />

                {/* Inner Arch Filigree Frame */}
                <div className="border border-brand-gold/40 rounded-t-[125px] rounded-b-xl p-5 sm:p-6 flex flex-col items-center text-center relative z-10 backdrop-blur-[2px]">
                  {/* Parijata Flower Crest */}
                  <div className="w-12 h-12 rounded-full bg-brand-gold/20 border border-brand-gold/50 flex items-center justify-center text-brand-lightGold mb-3">
                    <SparklesIcon className="w-6 h-6 text-brand-gold" />
                  </div>

                  <span className="text-[10px] uppercase tracking-[0.25em] text-brand-lightGold font-semibold">
                    Atelier Showcase &bull; Bengaluru
                  </span>

                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1 mb-4 tracking-wide">
                    The 2026 Bridal Chuda
                  </h2>

                  {/* Arched Illustration Frame */}
                  <div className="w-full aspect-square rounded-2xl bg-[#1C060E] border border-brand-gold/30 p-2 mb-5 overflow-hidden flex items-center justify-center relative shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/branding/sample-chuda-1.jpg"
                      alt="Royal Heritage Bridal Kundan Chuda Set"
                      className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-stone-900/90 backdrop-blur-sm py-1.5 px-3 rounded-lg text-[10px] text-brand-lightGold text-center border border-brand-gold/30 font-medium">
                      Jadau Kundan &bull; Ruby Cabochons &bull; 1-Micron 22K Gold
                    </div>
                  </div>

                  {/* Interactive Wrist Sizing Pill */}
                  <div className="w-full bg-[#2A0B16] rounded-xl p-3 border border-brand-gold/40 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-brand-lightGold font-semibold">
                        Wrist Sizing Guide
                      </span>
                      <button
                        type="button"
                        onClick={() => openSizingGuide('2.6')}
                        className="text-[11px] text-white underline hover:text-brand-lightGold font-medium transition-colors"
                      >
                        Measure Guide &rarr;
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1.5">
                      {['2.2', '2.4', '2.6', '2.8', '2.10'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => openSizingGuide(sz)}
                          className="flex-1 min-h-[44px] py-2.5 px-1 bg-white/10 hover:bg-brand-gold hover:text-stone-900 rounded-lg text-center transition-all border border-brand-gold/30 text-xs font-serif font-bold text-stone-100 flex items-center justify-center"
                          title={`View details for size ${sz}`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Bridal Orders Trust Badge */}
                  <div className="w-full text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs text-brand-lightGold font-semibold">
                      <SparklesIcon className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Custom Bridal Orders: 7&ndash;14 Days Handcrafted</span>
                    </div>
                    <p className="text-[10px] text-stone-300">
                      Bengaluru atelier handcraft &bull; Free domestic insured delivery
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sizing Modal */}
      <BangleSizeGuideModal
        isOpen={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        initialSize={initialSize}
      />
    </>
  );
}
