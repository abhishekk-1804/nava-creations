import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import { StorefrontShell } from '@/components/storefront-shell';

export const metadata: Metadata = {
  title: 'NAVA CREATIONS — Handcrafted Bangles & Bridal Accessories | Bengaluru',
  description:
    'Sovereign Indian accessories, handcrafted bangles, regal Kundan work, bridal jewellery, and return gifts based in Bengaluru, Karnataka.',
  keywords: [
    'Handmade Bangles Bengaluru',
    'Bridal Bangles',
    'Kundan Jewellery',
    'Return Gifts Bangalore',
    'Silk Thread Bangles',
    'Indian Wedding Accessories',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: 'NAVA CREATIONS',
    description:
      'Bespoke handcrafted bangles, bridal jewellery, and Indian festive accessories atelier in Bengaluru.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://navacreations.com',
    telephone: '+91-98860-00000',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bengaluru',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    priceRange: '₹₹',
    openingHours: 'Mo-Sa 10:00-19:00',
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-brand-ivory text-brand-charcoal antialiased selection:bg-brand-gold/30">
        <CartProvider>
          <StorefrontShell>{children}</StorefrontShell>
        </CartProvider>
      </body>
    </html>
  );
}
