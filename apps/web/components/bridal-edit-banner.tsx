'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon, CheckIcon } from './icons';

interface BridalEditBannerProps {
  collectionSlug?: string;
  collectionName?: string;
}

export function BridalEditBanner({
  collectionSlug = 'bridal-edit-2026',
  collectionName = 'Bridal Edit 2026',
}: BridalEditBannerProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-[#4A1525] via-[#380E1C] to-[#250812] rounded-3xl overflow-hidden text-white grid grid-cols-1 lg:grid-cols-12 shadow-2xl border-2 border-brand-gold/40">
        {/* Left Column (7 cols): Editorial Presentation & CTAs */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/20 text-brand-lightGold rounded-full text-xs uppercase tracking-widest font-semibold border border-brand-gold/40">
              <SparklesIcon className="w-3.5 h-3.5 text-brand-gold" />
              <span>BRIDAL TROUSSEAU &bull; 2026</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-white tracking-tight">
              {collectionName}: Heirloom Elegance for the Modern Bride
            </h2>

            <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
              Every bridal ensemble is bespoke handcrafted in our Bengaluru atelier to your exact wrist measurement. Finished with 1-micron 22K gold plating and set with luminous Jadau Kundan stones designed to remain pristine for generations.
            </p>

            {/* Key Collection Pillars */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 border border-brand-gold/30 rounded-xl p-3 backdrop-blur-sm">
                <span className="text-[10px] uppercase tracking-wider text-brand-lightGold font-bold block">
                  Pillar I
                </span>
                <span className="font-serif text-sm font-semibold text-white block mt-0.5">
                  Bridal Chuda Sets
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  Crimson &amp; gold stacked kadas
                </span>
              </div>

              <div className="bg-white/5 border border-brand-gold/30 rounded-xl p-3 backdrop-blur-sm">
                <span className="text-[10px] uppercase tracking-wider text-brand-lightGold font-bold block">
                  Pillar II
                </span>
                <span className="font-serif text-sm font-semibold text-white block mt-0.5">
                  Temple Kundan Kadas
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  Ruby &amp; emerald Jadau motifs
                </span>
              </div>

              <div className="bg-white/5 border border-brand-gold/30 rounded-xl p-3 backdrop-blur-sm">
                <span className="text-[10px] uppercase tracking-wider text-brand-lightGold font-bold block">
                  Pillar III
                </span>
                <span className="font-serif text-sm font-semibold text-white block mt-0.5">
                  Sangeet Favours
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  Silk gift boxes &amp; bulk favours
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs: Explore + Download Lookbook */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              href={`/collections/${collectionSlug}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-gold text-stone-900 rounded-xl text-sm font-bold hover:bg-brand-lightGold transition-all shadow-md group"
            >
              <span>Explore Bridal Trousseau</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/lookbook/bridal-edit-2026"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold border border-brand-gold/50 transition-all backdrop-blur-sm"
            >
              <SparklesIcon className="w-4 h-4 text-brand-gold" />
              <span>Download 2026 Lookbook (PDF)</span>
            </Link>
          </div>
        </div>

        {/* Right Column (5 cols): Rich Trousseau Visual Showcase */}
        <div className="lg:col-span-5 relative min-h-[360px] lg:min-h-[480px] p-6 lg:p-8 flex items-center justify-center bg-[#250812] border-t lg:border-t-0 lg:border-l border-brand-gold/30 overflow-hidden">
          {/* Subtle ornate radial halo */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gold/15 via-[#350E1A]/40 to-[#1F060F] pointer-events-none" />

          {/* Layered Showcase Cards */}
          <div className="relative z-10 w-full max-w-sm space-y-4">
            {/* Primary Showcase Tile */}
            <div className="bg-[#1C060E] rounded-2xl p-4 border border-brand-gold/40 shadow-2xl relative overflow-hidden group">
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-stone-900 flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/branding/sample-chuda-1.jpg"
                  alt="Royal Heritage Bridal Kundan Chuda"
                  className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-serif font-bold text-white block">
                    Royal Heritage Kundan Chuda
                  </span>
                  <span className="text-[11px] text-brand-lightGold">
                    Custom Sized 2.2 to 2.10
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-brand-gold/20 text-brand-gold text-[10px] font-bold uppercase rounded border border-brand-gold/30">
                  Bengaluru Heirloom
                </span>
              </div>
            </div>

            {/* Bottom Atelier Guarantee Pill */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-brand-gold/30 flex items-center justify-between text-xs text-stone-200">
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-brand-gold shrink-0" />
                <span>100% Insured Delivery Across India</span>
              </div>
              <span className="text-[10px] text-brand-lightGold font-semibold uppercase tracking-wider">
                7&ndash;14 Days
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
