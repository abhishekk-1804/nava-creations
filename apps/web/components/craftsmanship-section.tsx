'use client';

import React, { useState } from 'react';
import { ShieldCheckIcon, SparklesIcon, TruckIcon } from './icons';
import { BangleSizeGuideModal } from './bangle-size-guide-modal';

export function CraftsmanshipSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="bg-brand-cream py-16 sm:py-20 border-y border-brand-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-brand-darkGold font-semibold block mb-2">
              Why Choose NAVA
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-stone-900">
              Devoted to Detail &amp; Custom Fit
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Custom Sizing Card (Interactive Trigger) */}
            <div
              onClick={() => setModalOpen(true)}
              className="group bg-white p-8 rounded-2xl border border-stone-200/90 hover:border-brand-gold/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer relative"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-ivory flex items-center justify-center text-brand-maroon mb-4 border border-brand-gold/30 group-hover:bg-brand-gold group-hover:text-stone-900 transition-colors">
                <ShieldCheckIcon className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-900 mb-2 group-hover:text-brand-maroon transition-colors">
                Custom Bangle Sizing
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Standard bangle sizes (2.2, 2.4, 2.6, 2.8, 2.10) crafted to ensure a comfortable, snug fit for every wrist.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-maroon group-hover:text-brand-gold transition-colors">
                <span>Find Your Bangle Size (2.2&ndash;2.10)</span>
                <span>&rarr;</span>
              </span>
            </div>

            {/* Authentic Kundan Work */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200/90 shadow-sm text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-ivory flex items-center justify-center text-brand-maroon mb-4 border border-brand-gold/30">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-900 mb-2">
                Authentic Kundan Work
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Faceted glass stones set in traditional Jadau frames with rich enamel detailing and 1-micron 22K gold plating.
              </p>
            </div>

            {/* Wedding & Return Gifts */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200/90 shadow-sm text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-ivory flex items-center justify-center text-brand-maroon mb-4 border border-brand-gold/30">
                <TruckIcon className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-900 mb-2">
                Wedding &amp; Return Gifts
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Curated packaging and bulk gift boxes for baby showers, housewarmings, poojas, and sangeet favors.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BangleSizeGuideModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSize="2.6"
      />
    </>
  );
}
