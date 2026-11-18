import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | NAVA CREATIONS',
  description: 'Privacy statement and data handling disclosures for NAVA CREATIONS Bengaluru.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-stone-200">
        <div className="border-b border-stone-200 pb-6 mb-8">
          <Link href="/" className="text-xs uppercase tracking-widest text-[#722F37] hover:text-[#996515] font-medium transition-colors">
            &larr; Return to Storefront
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#722F37] mt-3 font-semibold">
            Privacy Policy
          </h1>
          <p className="text-xs text-stone-500 mt-2">
            Last Reviewed: November 2026 &bull; Data Handling Statement for NAVA CREATIONS Bengaluru
          </p>
        </div>

        {/* Status Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 text-xs text-amber-900 rounded-r space-y-1">
          <p className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">
            Privacy Notice &bull; Review Draft
          </p>
          <p>
            This statement describes the actual data collection and handling practices of <strong>NAVA CREATIONS</strong> based on our current technical architecture. Formal governance designations under emerging data protection frameworks are subject to final owner approval and legal review.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">1. Data Minimization &amp; Information We Collect</h2>
            <p>
              At <strong>NAVA CREATIONS</strong>, we collect only the personal information strictly necessary to process, assemble, and deliver your orders or assist with bridal enquiries:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Customer Contact Identifiers:</strong> Name, 10-digit mobile phone number (used for delivery coordination and order updates), and optional email address.
              </li>
              <li>
                <strong>Delivery Destination:</strong> Street address, apartment/suite number, landmark, city, state, and 6-digit postal PIN code.
              </li>
              <li>
                <strong>Payment Identifiers:</strong> For UPI payments, the 12-digit UPI Transaction ID / UTR reference submitted by the customer, and the matching bank credit reference. We do <em>not</em> collect, store, or process debit/credit card numbers, CVVs, net banking passwords, or UPI PINs.
              </li>
              <li>
                <strong>Guest Checkout:</strong> Orders may be placed as a guest without creating an account or permanent password.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">2. Purpose of Data Processing</h2>
            <p>
              Your personal information is used solely for legitimate business operations:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Processing, handcrafting, and packaging your bangle and accessory orders.</li>
              <li>Printing courier delivery address labels for physical package dispatch.</li>
              <li>Providing order status, payment verification, and dispatch updates via WhatsApp or email.</li>
              <li>Responding to bespoke sizing and bridal styling queries initiated by you.</li>
            </ul>
            <p className="mt-2 text-xs text-stone-600">
              We never sell, rent, monetize, or trade your personal information with third-party advertisers, brokers, or data analytics firms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">3. Cookies &amp; Browser Session Security</h2>
            <p>
              We deploy only strictly necessary, order-scoped session cookies:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <code>nava_order_[orderNumber]</code>: A secure, HttpOnly, SameSite=Lax cookie scoped strictly to your order path. This allows you to check order progress and submit your UPI reference without exposing sensitive tokens in the browser URL.
              </li>
              <li>
                <code>nava_admin_session</code>: An encrypted, HttpOnly session cookie restricted to authenticated workshop administrators.
              </li>
            </ul>
            <p className="mt-2 text-xs text-stone-600">
              We do not deploy third-party advertising cookies, cross-site trackers, or behavioral profiling scripts.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">4. Third-Party Sharing</h2>
            <p>
              Customer data is shared strictly on a need-to-know operational basis:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Domestic Couriers:</strong> Delivery destination details (name, address, phone number) are provided on the physical parcel label and manifest to the courier service assigned for package delivery.
              </li>
              <li>
                <strong>Direct Communications:</strong> Customer service conversations are conducted directly through standard WhatsApp or email channels.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">5. Data Retention &amp; Inquiries</h2>
            <p>
              Order records, customer shipping details, and transaction references are retained in our database for order fulfillment, customer service history, and basic internal accounting.
            </p>
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-lg mt-3 text-xs space-y-1">
              <p><strong>Customer Privacy Inquiries &amp; Address Updates:</strong></p>
              <p>Email: <span className="font-mono text-stone-900">support@navacreations.com</span></p>
              <p className="text-stone-500 pt-1">
                Formal statutory Data Protection Officer (DPO) designations will be published following corporate entity structuring and legal review.
              </p>
            </div>
          </section>
        </div>

        <div className="border-t border-stone-200 pt-6 mt-10 flex flex-wrap justify-between items-center gap-4 text-xs text-stone-500">
          <Link href="/policies/terms" className="hover:text-[#722F37] transition-colors">&larr; Terms &amp; Conditions</Link>
          <Link href="/policies/shipping" className="hover:text-[#722F37] transition-colors">Shipping Policy &rarr;</Link>
        </div>
      </div>
    </div>
  );
}