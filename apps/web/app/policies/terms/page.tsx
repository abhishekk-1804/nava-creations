import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | NAVA CREATIONS',
  description: 'Terms and conditions governing purchases and custom enquiries with NAVA CREATIONS Bengaluru.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-stone-200">
        <div className="border-b border-stone-200 pb-6 mb-8">
          <Link href="/" className="text-xs uppercase tracking-widest text-[#722F37] hover:text-[#996515] font-medium transition-colors">
            &larr; Return to Storefront
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#722F37] mt-3 font-semibold">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-stone-500 mt-2">
            Last Reviewed: November 2026 &bull; Operations: Bengaluru, Karnataka, India
          </p>
        </div>

        {/* Status Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 text-xs text-amber-900 rounded-r space-y-1">
          <p className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">
            Policy Notice &bull; Review Draft
          </p>
          <p>
            These terms describe the operational and ordering conditions of <strong>NAVA CREATIONS</strong>. Formal corporate registrations and statutory designations are currently undergoing owner confirmation. Please review these terms prior to placing an order.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">1. Seller Identity &amp; Operating Status</h2>
            <p>
              Welcome to <strong>NAVA CREATIONS</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). NAVA CREATIONS is an independent artisanal jewellery enterprise operating out of Bengaluru, Karnataka, India.
            </p>
            <p className="mt-2 text-xs text-stone-600">
              <strong>Registration Disclosure:</strong> NAVA CREATIONS operates as an independent small artisanal business. Formal commercial registration (such as proprietorship or MSME enterprise) is under owner processing. We make no claim to corporate incorporation, joint-venture, or limited-liability company forms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">2. Artisanal Handcrafted Products</h2>
            <p>
              Our collections—including bangles, bridal jewellery sets, and traditional accessories—are assembled, finished, and curated by hand in our Bengaluru workshop.
            </p>
            <p className="mt-2">
              Because of the handcrafted nature of glass, velvet threadwork, and Kundan-style stone setting, minor variations in finish, tone, or bead placement are natural hallmarks of artisanal handcraft and do not represent manufacturing flaws.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">3. Sizing Guidance &amp; Customer Responsibility</h2>
            <p>
              Bangles are offered in standard Indian metric sizes: <strong>2.4</strong> (57.2 mm inside diameter), <strong>2.6</strong> (60.3 mm inside diameter), and <strong>2.8</strong> (63.5 mm inside diameter).
            </p>
            <p className="mt-2">
              We strongly advise customers to measure an existing well-fitting bangle before confirming an order. If you need assistance verifying measurements, our team is available via WhatsApp consultation. For customized sizes made to specific measurements, pieces are crafted to the agreed dimensions; customer remedies for damaged, defective, or incorrectly supplied items remain fully protected as set forth in our Returns Policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">4. Pricing, Taxes &amp; Payments</h2>
            <p>
              All prices shown on the storefront are denominated in Indian Rupees (INR).
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Tax Disclosure:</strong> As an unregistered small artisanal business operating within turnover exemption thresholds, NAVA CREATIONS does not charge or collect Goods and Services Tax (GST). Listed prices represent the total product price payable.
              </li>
              <li>
                <strong>Merchant UPI Payments:</strong> Customers scan our merchant UPI QR code and submit the 12-digit Bank Transaction ID / UTR reference. Orders are confirmed upon manual ledger reconciliation.
              </li>
              <li>
                <strong>Cash on Delivery (COD):</strong> Where enabled for eligible PIN codes, payment is collected in cash at the time of doorstep handover.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">5. Inventory Reservations &amp; Cancellation</h2>
            <p>
              When an order is created, items are reserved for 15 minutes to allow UPI payment transfer. Submitting a claimed UTR reference moves the order into an active verification review window.
            </p>
            <p className="mt-2">
              If matching payment cannot be confirmed within the review window, the reservation is released and the order is cancelled so inventory can return to available workshop stock. Customers may request order cancellation at any time before dispatch.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">6. Customer Inquiries &amp; Dispute Resolution</h2>
            <p>
              Customer queries, bridal styling questions, and order assistance are handled directly by our team via WhatsApp and email at <span className="font-mono text-stone-900">support@navacreations.com</span>.
            </p>
            <p className="mt-2 text-xs text-stone-600">
              Formal statutory designations under consumer protection frameworks (including a designated Grievance Officer and physical service address) are subject to owner appointment upon formal entity registration. These terms are governed by the laws of India, with proceedings subject to the courts of Bengaluru, Karnataka.
            </p>
          </section>
        </div>

        <div className="border-t border-stone-200 pt-6 mt-10 flex flex-wrap justify-between items-center gap-4 text-xs text-stone-500">
          <Link href="/policies/privacy" className="hover:text-[#722F37] transition-colors">Privacy Policy &rarr;</Link>
          <Link href="/policies/shipping" className="hover:text-[#722F37] transition-colors">Shipping Policy &rarr;</Link>
          <Link href="/policies/returns" className="hover:text-[#722F37] transition-colors">Returns &amp; Refunds &rarr;</Link>
        </div>
      </div>
    </div>
  );
}