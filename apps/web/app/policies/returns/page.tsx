import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Refunds Policy | NAVA CREATIONS',
  description: 'Returns, replacements, cancellations, and refund policy for NAVA CREATIONS artisanal jewellery.',
};

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-stone-200">
        <div className="border-b border-stone-200 pb-6 mb-8">
          <Link href="/" className="text-xs uppercase tracking-widest text-[#722F37] hover:text-[#996515] font-medium transition-colors">
            &larr; Return to Storefront
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#722F37] mt-3 font-semibold">
            Returns, Replacements &amp; Refunds
          </h1>
          <p className="text-xs text-stone-500 mt-2">
            Clear &amp; Fair Policies for Artisanal Bangles &amp; Bridal Jewellery &bull; Bengaluru
          </p>
        </div>

        {/* Review Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 text-xs text-amber-900 rounded-r space-y-1">
          <p className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">
            Policy Notice &bull; Owner Review Draft
          </p>
          <p>
            This document outlines the proposed customer return, cancellation, and refund procedures for <strong>NAVA CREATIONS</strong>. Certain operational thresholds and return logistics are subject to final owner confirmation prior to commercial launch.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">1. Damaged, Defective or Transit-Broken Items</h2>
            <p>
              We take full responsibility for ensuring that your order reaches you intact. If any bangles or jewellery arrive damaged, broken, or with manufacturing defects:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Remedies:</strong> Customers are entitled to a priority replacement at no extra charge, or a full refund of the purchase amount.
              </li>
              <li>
                <strong>Reporting &amp; Visual Evidence:</strong> Please contact our team within 48 hours of delivery. While an unboxing video or photographs of the packaging and damaged items are strongly encouraged to help us expedite claims with courier partners, providing an unboxing video is <strong>not</strong> an absolute condition for a valid remedy where defect or damage can be verified through reasonable inspection.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">2. Incorrect, Incomplete, or Materially Different Orders</h2>
            <p>
              If the items delivered to you do not match the confirmed order specifications (such as incorrect size, wrong color, missing pieces, or products materially different from the product description):
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>NAVA CREATIONS will dispatch the correct replacement item at zero additional cost or issue a complete refund upon return of the incorrect piece.</li>
              <li>We will arrange reverse pickup or reimburse reasonable domestic courier return shipping costs.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">3. Lost Shipments &amp; Delivery Failures</h2>
            <p>
              If a courier confirms that a shipment has been lost in transit, or if a package remains undelivered due to courier service failure, the customer is entitled to choose between:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>A free priority replacement dispatch, or</li>
              <li>A complete financial refund of all amounts paid (including shipping charges).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">4. Order Cancellation Policy</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">A. Pre-Dispatch Cancellation</h3>
                <p className="text-xs text-stone-600 mt-1">
                  You may cancel your order at any time before it enters <code>SHIPPED</code> status by notifying us via WhatsApp or email. Upon pre-dispatch cancellation, your full prepaid amount is queued for refund, and reserved inventory is immediately returned to workshop stock.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">B. Post-Dispatch Cancellation</h3>
                <p className="text-xs text-stone-600 mt-1">
                  Once an order has been handed to the courier partner, the shipment cannot be intercepted or cancelled in transit. Customers may request an eligible return following delivery.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">5. Change-of-Mind Requests &amp; Bespoke Pieces</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">Standard Catalog Bangles</h3>
                <p className="text-xs text-stone-600 mt-1">
                  Unworn, standard catalog bangles in original packaging with intact security seals may be requested for exchange or return within <strong>48 hours</strong> of receipt. The customer is responsible for return courier shipping.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">Custom &amp; Made-to-Order Pieces</h3>
                <p className="text-xs text-stone-600 mt-1">
                  Bespoke bridal sets assembled to custom measurements or personalized color combinations are non-returnable for change of mind. However, this exception does <strong>not</strong> limit your statutory rights if the custom item is delivered damaged, defective, or materially different from the agreed order specifications.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">6. Refund Lifecycle &amp; Status Definitions</h2>
            <p>
              We maintain transparent, auditable tracking of refund requests. Our system distinguishes the following explicit stages:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
              <div className="border border-stone-200 p-3 rounded-lg bg-stone-50">
                <span className="font-semibold text-stone-900 block">1. Refund Requested</span>
                <span className="text-stone-600">Customer has submitted a cancellation or return refund inquiry.</span>
              </div>
              <div className="border border-stone-200 p-3 rounded-lg bg-stone-50">
                <span className="font-semibold text-stone-900 block">2. Refund Under Review</span>
                <span className="text-stone-600">Our studio team is inspecting returned goods or verifying courier reports.</span>
              </div>
              <div className="border border-stone-200 p-3 rounded-lg bg-stone-50">
                <span className="font-semibold text-stone-900 block">3. Refund Approved</span>
                <span className="text-stone-600">Eligibility confirmed by the store manager; queued for financial transfer.</span>
              </div>
              <div className="border border-stone-200 p-3 rounded-lg bg-stone-50">
                <span className="font-semibold text-stone-900 block">4. Refund Initiated</span>
                <span className="text-stone-600">Bank remittance (IMPS/UPI) has been executed by administrator and logged in the audit ledger.</span>
              </div>
              <div className="border border-stone-200 p-3 rounded-lg bg-stone-50 sm:col-span-2">
                <span className="font-semibold text-stone-900 block">5. Refund Completed</span>
                <span className="text-stone-600">Funds have cleared through interbank networks and settled into the customer&apos;s account.</span>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-stone-600">
              <p>
                <strong>System Integrity Disclosure:</strong> Automated payment gateway refunds are currently not active. All refunds for prepaid orders are recorded manually and transferred via direct bank IMPS/NEFT or merchant UPI. Recording a transaction reference in our administrative system signifies that the transfer has been initiated, not that interbank settlement has concluded.
              </p>
              <p>
                <strong>Cash on Delivery (COD) Refunds:</strong> If a delivered COD order is approved for return following workshop inspection, the refund is paid via direct bank transfer or UPI to customer-provided account details.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">7. Return Instructions &amp; Support Contact</h2>
            <p>
              To initiate a return, replacement, or cancellation inquiry, contact our customer support team:
            </p>
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-lg mt-2 text-xs space-y-1">
              <p><strong>Email:</strong> support@navacreations.com</p>
              <p><strong>WhatsApp Support:</strong> Available via our storefront concierge button</p>
              <p><strong>Return Dispatch Instructions:</strong> Specific postal dispatch guidance and verified return destination details will be provided directly by our support team upon return authorization.</p>
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