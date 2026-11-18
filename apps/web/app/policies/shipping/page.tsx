import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | NAVA CREATIONS',
  description: 'Shipping process, packaging, and dispatch information for NAVA CREATIONS Bengaluru.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-stone-200">
        <div className="border-b border-stone-200 pb-6 mb-8">
          <Link href="/" className="text-xs uppercase tracking-widest text-[#722F37] hover:text-[#996515] font-medium transition-colors">
            &larr; Return to Storefront
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#722F37] mt-3 font-semibold">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-stone-500 mt-2">
            Dispatched from our Workshop in Bengaluru, Karnataka &bull; Domestic Courier Handover
          </p>
        </div>

        {/* Operational Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 text-xs text-amber-900 rounded-r space-y-1">
          <p className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">
            Operational Notice &bull; Delivery Timelines Confirmed Prior to Dispatch
          </p>
          <p>
            Because piece handcrafting, assembly, and courier availability vary by location, we do not advertise automated or fixed-day delivery guarantees. Estimated dispatch and delivery timelines are confirmed directly with each customer before or upon order confirmation.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">1. Dispatch Location &amp; Handcrafting Process</h2>
            <p>
              All orders are packed and dispatched from our workshop in <strong>Bengaluru, Karnataka</strong>.
            </p>
            <p className="mt-2">
              Our inventory consists of both ready-to-pack catalog bangles and made-to-order bridal sets. Ready pieces are packaged following payment confirmation, while custom or multi-size sets require assembly and quality checks.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">2. Delivery Estimates &amp; Event Deadlines</h2>
            <p>
              To ensure customer expectations are met accurately, we communicate expected timelines individually:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Event &amp; Wedding Deadlines:</strong> If you require bangles or bridal sets by a specific wedding, engagement, or festive date, please message our team on WhatsApp <strong>prior to placing your order</strong> so we can verify workshop scheduling.
              </li>
              <li>
                <strong>Confirmation of Estimates:</strong> Following order placement, our team confirms the estimated dispatch window with you directly.
              </li>
              <li>
                <strong>Transit Duration:</strong> Courier transit times depend on the destination location and domestic courier partner network performance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">3. Protective Packaging Standard</h2>
            <p>
              Delicate glass bangles and Kundan stone ornaments require careful physical protection during transit. Every shipment is prepared with:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Inner protective foam or fabric lining to prevent surface abrasion.</li>
              <li>Sturdy rigid keepsake gift boxes designed to absorb handling pressure.</li>
              <li>Outer shock-absorbing bubble wrap cushioning.</li>
              <li>Waterproof courier flyer sealed with tamper-evident security tape.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">4. Domestic Shipping Charges</h2>
            <p>
              Shipping fees are calculated transparently during checkout:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Standard domestic courier delivery is charged at a flat rate of <strong>₹150</strong> (or as calculated at checkout based on current courier rates).</li>
              <li>Orders with an item subtotal of <strong>₹1,999 or more</strong> qualify for <strong>Complimentary Standard Delivery</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-stone-900 font-semibold mb-2">5. Courier Consignment Reference &amp; Tracking</h2>
            <p>
              When your parcel is handed over to a courier partner, our store administrator enters the courier name and Air Waybill (AWB) or consignment reference into your order record.
            </p>
            <p className="mt-2 text-xs text-stone-600">
              You can check your consignment reference on your order page at <span className="font-mono text-stone-800">/orders/[orderNumber]</span>. Live transit milestones can be verified directly on the assigned courier&apos;s tracking portal using that reference.
            </p>
          </section>
        </div>

        <div className="border-t border-stone-200 pt-6 mt-10 flex flex-wrap justify-between items-center gap-4 text-xs text-stone-500">
          <Link href="/policies/terms" className="hover:text-[#722F37] transition-colors">&larr; Terms &amp; Conditions</Link>
          <Link href="/policies/returns" className="hover:text-[#722F37] transition-colors">Returns &amp; Refunds &rarr;</Link>
        </div>
      </div>
    </div>
  );
}