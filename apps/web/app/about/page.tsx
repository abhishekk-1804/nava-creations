import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheckIcon, TruckIcon, RefreshCwIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'About the Workshop | NAVA CREATIONS Bengaluru',
  description: 'About NAVA CREATIONS — artisanal handmade bangles and bridal jewellery assembled in Bengaluru, Karnataka.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-stone-200">
        <div className="border-b border-stone-200 pb-6 mb-8 text-center">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#996515] font-semibold block mb-1">
            Artisanal Workshop &bull; Bengaluru
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#722F37] font-semibold">
            About NAVA CREATIONS
          </h1>
          <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">
            Handcrafted bangles, traditional Kundan sets, and bridal jewellery assembled and packaged in Bengaluru, Karnataka.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="font-serif text-xl text-stone-900 font-semibold mb-3">Our Workshop</h2>
            <p>
              <strong>NAVA CREATIONS</strong> is an independent artisanal jewellery enterprise based in <strong>Bengaluru, Karnataka</strong>.
            </p>
            <p className="mt-3">
              We specialize in curating, assembling, and hand-finishing traditional Indian bangles and bridal accessories. Our collections bring together glass artistry, velvet threadwork, and Kundan-style stone embellishments, designed for weddings, family ceremonies, and festive occasions.
            </p>
          </section>

          <section className="bg-stone-50 p-6 rounded-lg border border-stone-200">
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-4 text-center">Our Craft &amp; Sizing Focus</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center text-[#996515] shadow-xs mb-2">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-stone-900">Hand-Assembled</h3>
                <p className="text-xs text-stone-600 mt-1">Each bangle set is curated, assembled, and inspected individually in Bengaluru.</p>
              </div>
              <div>
                <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center text-[#996515] shadow-xs mb-2">
                  <RefreshCwIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-stone-900">Standard Sizes</h3>
                <p className="text-xs text-stone-600 mt-1">Focused on standard Indian wrist sizes (2.4, 2.6, 2.8) with sizing advice available.</p>
              </div>
              <div>
                <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center text-[#996515] shadow-xs mb-2">
                  <TruckIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-stone-900">Protective Packaging</h3>
                <p className="text-xs text-stone-600 mt-1">Sturdy keepsake gift boxes with protective cushioning for domestic delivery.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-stone-900 font-semibold mb-3">Customer Consultations &amp; Workspace Operations</h2>
            <p>
              Our Bengaluru location operates strictly as a production, assembly, and fulfillment workshop. <strong>We do not operate a walk-in retail store, and the workshop is not open for public or unscheduled visits.</strong>
            </p>
            <p className="mt-2">
              All customer consultations, bridal styling questions, and order inquiries are conducted remotely via WhatsApp.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/contact"
                className="inline-block bg-[#722F37] hover:bg-[#59232a] text-white px-6 py-2.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-colors"
              >
                Contact &amp; Enquiry Form
              </Link>
              <Link
                href="/shop"
                className="inline-block border border-stone-300 hover:border-[#722F37] text-stone-800 hover:text-[#722F37] px-6 py-2.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-colors"
              >
                Browse Our Catalog
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}