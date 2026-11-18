'use client';

import React, { useState, useEffect } from 'react';
import { CloseIcon, SparklesIcon, WhatsAppIcon, CheckIcon } from './icons';
import { buildWhatsAppLink } from '@/lib/config';

export interface BangleSizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSize?: string;
}

export interface BangleSizeDetails {
  size: string;
  diameterMm: number;
  diameterInches: string;
  circumferenceMm: number;
  fitTag: string;
  notes: string;
}

export const BANGLE_SIZES: BangleSizeDetails[] = [
  {
    size: '2.2',
    diameterMm: 54.0,
    diameterInches: '2 2/16" (2.125 in)',
    circumferenceMm: 169.6,
    fitTag: 'Extra Small / Petite Wrist',
    notes: 'Ideal for very slender wrists and young adults. Snug, elegant fit without excessive slippage.',
  },
  {
    size: '2.4',
    diameterMm: 57.2,
    diameterInches: '2 4/16" (2.25 in)',
    circumferenceMm: 179.6,
    fitTag: 'Small Wrist',
    notes: 'Common slender fit. Slides smoothly over hands measuring up to 18 cm around knuckles.',
  },
  {
    size: '2.6',
    diameterMm: 60.3,
    diameterInches: '2 6/16" (2.375 in)',
    circumferenceMm: 189.5,
    fitTag: 'Medium / Most Common Bridal Fit',
    notes: 'The gold standard in South Indian & North Indian bridal chudas. Fits ~70% of brides comfortably.',
  },
  {
    size: '2.8',
    diameterMm: 63.5,
    diameterInches: '2 8/16" (2.50 in)',
    circumferenceMm: 199.5,
    fitTag: 'Large Wrist',
    notes: 'Comfortable relaxed fit for fuller wrists or when layering over embroidered silk sleeves.',
  },
  {
    size: '2.10',
    diameterMm: 66.7,
    diameterInches: '2 10/16" (2.625 in)',
    circumferenceMm: 209.5,
    fitTag: 'Extra Large / Broad Wrist',
    notes: 'Provides ample clearance over wider knuckles with zero pinching or strain on stone settings.',
  },
];

export function BangleSizeGuideModal({
  isOpen,
  onClose,
  initialSize = '2.6',
}: BangleSizeGuideModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);
  const [activeTab, setActiveTab] = useState<'chart' | 'howTo'>('chart');

  // Handle Escape key listener and body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultSizeDetails: BangleSizeDetails = BANGLE_SIZES[2] || {
    size: '2.6',
    diameterMm: 60.3,
    diameterInches: '2 6/16" (2.375 in)',
    circumferenceMm: 189.5,
    fitTag: 'Medium / Most Common Bridal Fit',
    notes: 'The gold standard in South Indian & North Indian bridal chudas. Fits ~70% of brides comfortably.',
  };

  const currentDetails: BangleSizeDetails =
    BANGLE_SIZES.find((s) => s.size === selectedSize) || defaultSizeDetails;

  const whatsappInquiryUrl = buildWhatsAppLink(
    `Hello NAVA Creations Bengaluru, I am reviewing the Bangle Size Guide. My estimated size is ${currentDetails.size} (${currentDetails.diameterMm} mm / ${currentDetails.diameterInches}). Could you assist me with confirming my bridal fit?`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Bottom Drawer Container */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6 text-center">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-t-3xl sm:rounded-2xl bg-brand-ivory text-left shadow-2xl transition-all border border-brand-sand max-h-[90vh] flex flex-col">
          {/* Mobile Handle Indicator */}
          <div className="pt-2 pb-1 sm:hidden flex justify-center bg-brand-cream/80">
            <div className="w-12 h-1 bg-stone-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-sand px-6 py-4 bg-brand-cream/80">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-brand-gold" />
              <div>
                <h3 id="size-guide-title" className="font-serif text-lg sm:text-xl font-semibold text-brand-maroon">
                  Find Your Bangle Size (2.2 &ndash; 2.10)
                </h3>
                <p className="text-xs text-stone-500">
                  NAVA Bengaluru Atelier &bull; Precision Wrist Sizing Guide
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-white transition-colors"
              aria-label="Close modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-brand-sand bg-white text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'chart'
                  ? 'border-brand-maroon text-brand-maroon font-semibold bg-brand-cream/30'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Interactive Sizing Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('howTo')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'howTo'
                  ? 'border-brand-maroon text-brand-maroon font-semibold bg-brand-cream/30'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              How to Measure at Home
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {activeTab === 'chart' ? (
              <>
                {/* Size Selector Pills */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                    Select Your Bangle Size:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {BANGLE_SIZES.map((item) => {
                      const isSelected = item.size === selectedSize;
                      return (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => setSelectedSize(item.size)}
                          className={`py-3 px-2 rounded-xl text-center transition-all border ${
                            isSelected
                              ? 'bg-brand-maroon text-white border-brand-maroon shadow-md scale-[1.02]'
                              : 'bg-white text-stone-800 border-stone-200 hover:border-brand-gold/60 hover:bg-brand-cream/40'
                          }`}
                        >
                          <span className="block font-serif text-lg font-bold">{item.size}</span>
                          <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-brand-lightGold' : 'text-stone-500'}`}>
                            {item.diameterMm} mm
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Size Highlight Card */}
                <div className="bg-white rounded-xl p-5 border border-brand-sand shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-brand-darkGold font-bold">
                        Selected Fitment
                      </span>
                      <h4 className="font-serif text-2xl font-bold text-brand-maroon">
                        Size {currentDetails.size} &bull; {currentDetails.fitTag}
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-cream text-brand-maroon border border-brand-gold/40">
                      <CheckIcon className="w-3.5 h-3.5 text-brand-gold" />
                      <span>Standard Indian Size</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-brand-cream/50 p-3 rounded-lg border border-brand-sand/50">
                      <span className="block text-[10px] uppercase text-stone-500 font-semibold">Inner Diameter</span>
                      <span className="block text-base font-bold text-stone-900 mt-0.5">
                        {currentDetails.diameterMm} mm
                      </span>
                      <span className="block text-[11px] text-stone-500">
                        {currentDetails.diameterInches}
                      </span>
                    </div>

                    <div className="bg-brand-cream/50 p-3 rounded-lg border border-brand-sand/50">
                      <span className="block text-[10px] uppercase text-stone-500 font-semibold">Inner Circumference</span>
                      <span className="block text-base font-bold text-stone-900 mt-0.5">
                        {currentDetails.circumferenceMm} mm
                      </span>
                      <span className="block text-[11px] text-stone-500">
                        {(currentDetails.circumferenceMm / 10).toFixed(1)} cm
                      </span>
                    </div>

                    <div className="bg-brand-cream/50 p-3 rounded-lg border border-brand-sand/50">
                      <span className="block text-[10px] uppercase text-stone-500 font-semibold">Atelier Handcraft</span>
                      <span className="block text-base font-bold text-stone-900 mt-0.5">
                        7&ndash;14 Days
                      </span>
                      <span className="block text-[11px] text-stone-500">
                        Custom Bridal Sizing
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <strong className="text-stone-800">Fit Note:</strong> {currentDetails.notes}
                  </p>
                </div>

                {/* Sizing Reference Table */}
                <div className="overflow-x-auto rounded-lg border border-stone-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Bangle Size</th>
                        <th className="py-2.5 px-3">Diameter (Inches)</th>
                        <th className="py-2.5 px-3">Diameter (mm)</th>
                        <th className="py-2.5 px-3">Circumference (mm)</th>
                        <th className="py-2.5 px-3">Fit Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {BANGLE_SIZES.map((b) => (
                        <tr
                          key={b.size}
                          onClick={() => setSelectedSize(b.size)}
                          className={`cursor-pointer transition-colors ${
                            b.size === selectedSize
                              ? 'bg-brand-cream/60 font-semibold text-brand-maroon'
                              : 'hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-serif font-bold">{b.size}</td>
                          <td className="py-2.5 px-3">{b.diameterInches}</td>
                          <td className="py-2.5 px-3">{b.diameterMm} mm</td>
                          <td className="py-2.5 px-3">{b.circumferenceMm} mm</td>
                          <td className="py-2.5 px-3 text-[11px]">{b.fitTag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              /* How to Measure Tab */
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center gap-2 text-brand-maroon">
                    <span className="w-6 h-6 rounded-full bg-brand-cream flex items-center justify-center font-bold text-xs border border-brand-gold/60">
                      1
                    </span>
                    <h4 className="font-serif text-base font-bold">Method A: Measure an Existing Bangle (Easiest)</h4>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-stone-600 space-y-2 leading-relaxed pl-2">
                    <li>Select a rigid bangle that currently fits your wrist comfortably.</li>
                    <li>Place the bangle flat on a ruler or measuring tape.</li>
                    <li>Measure the <strong>exact inside diameter</strong> in millimetres (from inner edge to inner edge, ignoring bangle thickness).</li>
                    <li>Compare your millimetre measurement against our chart above (e.g., 60.3 mm = Size 2.6).</li>
                  </ol>
                </div>

                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center gap-2 text-brand-maroon">
                    <span className="w-6 h-6 rounded-full bg-brand-cream flex items-center justify-center font-bold text-xs border border-brand-gold/60">
                      2
                    </span>
                    <h4 className="font-serif text-base font-bold">Method B: Measure Hand Knuckle Circumference</h4>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-stone-600 space-y-2 leading-relaxed pl-2">
                    <li>Bring your thumb and pinky finger together towards the center of your palm, simulating the hand shape when slipping on a bangle.</li>
                    <li>Wrap a flexible string or thin measuring tape tightly around the <strong>widest part of your hand knuckles</strong>.</li>
                    <li>Mark where the string overlaps and measure the flat length on a ruler in millimetres.</li>
                    <li>Match your knuckle circumference to the inner circumference column in our chart.</li>
                  </ol>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <strong>Bridal Chuda Tip:</strong> Traditional chuda sets feature multiple stacked kadas. If your wrist falls between two sizes (e.g., between 2.4 and 2.6), we recommend selecting the slightly larger size (2.6) for effortless ceremonial wear throughout wedding rituals.
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-brand-sand px-6 py-4 bg-brand-cream/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-stone-500 text-center sm:text-left">
              Unsure? Our Bengaluru bridal concierge verifies sizes via photo or video consultation.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Verify on WhatsApp (+91 72046 28513)</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-stone-300 text-stone-700 hover:bg-white rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
