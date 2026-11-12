'use client';

import React, { useState } from 'react';
import { CloseIcon } from './icons';

export function BangleSizeGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-brand-darkGold hover:text-brand-maroon underline font-medium"
      >
        Size Chart &amp; Fit Guide
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <h3 className="font-serif text-lg font-medium text-stone-900">
                  Indian Bangle Size Chart
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                  aria-label="Close size guide"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs text-stone-600">
                <p>
                  Bangle sizing in India corresponds to the inner diameter in inches and sixteenths of an inch.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead>
                      <tr className="bg-brand-cream text-stone-800 font-semibold">
                        <th className="p-2 border border-stone-200">Size Code</th>
                        <th className="p-2 border border-stone-200">Inner Diameter (mm)</th>
                        <th className="p-2 border border-stone-200">Diameter (Inches)</th>
                        <th className="p-2 border border-stone-200">Wrist Fit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-stone-200 font-medium">2.2</td>
                        <td className="p-2 border border-stone-200">54.0 mm</td>
                        <td className="p-2 border border-stone-200">2 &frac18; in</td>
                        <td className="p-2 border border-stone-200">Extra Small</td>
                      </tr>
                      <tr className="bg-stone-50">
                        <td className="p-2 border border-stone-200 font-medium">2.4</td>
                        <td className="p-2 border border-stone-200">57.2 mm</td>
                        <td className="p-2 border border-stone-200">2 &frac14; in</td>
                        <td className="p-2 border border-stone-200">Small / Medium</td>
                      </tr>
                      <tr className="bg-brand-cream/40 font-semibold">
                        <td className="p-2 border border-stone-200 text-brand-maroon">2.6 (Most Common)</td>
                        <td className="p-2 border border-stone-200">60.3 mm</td>
                        <td className="p-2 border border-stone-200">2 &frac38; in</td>
                        <td className="p-2 border border-stone-200">Standard Medium</td>
                      </tr>
                      <tr className="bg-stone-50">
                        <td className="p-2 border border-stone-200 font-medium">2.8</td>
                        <td className="p-2 border border-stone-200">63.5 mm</td>
                        <td className="p-2 border border-stone-200">2 &frac12; in</td>
                        <td className="p-2 border border-stone-200">Medium / Large</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-stone-200 font-medium">2.10</td>
                        <td className="p-2 border border-stone-200">66.7 mm</td>
                        <td className="p-2 border border-stone-200">2 &frac58; in</td>
                        <td className="p-2 border border-stone-200">Broad / Openable</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-stone-50 rounded border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1">
                    How to measure your bangle size:
                  </span>
                  <ol className="list-decimal pl-4 space-y-1 text-stone-600">
                    <li>Take an existing bangle that fits comfortably.</li>
                    <li>Measure the inside diameter across the widest central point using a ruler.</li>
                    <li>Compare millimeters against the table above.</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
