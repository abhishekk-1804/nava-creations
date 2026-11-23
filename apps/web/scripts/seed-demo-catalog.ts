/**
 * NAVA CREATIONS — DEMO CATALOG SEEDER SCRIPT
 * 
 * Seeds the Supabase/PostgreSQL database via Prisma with:
 * 1. Required Categories: "Bridal", "Handmade", "Handmade Bangles", "Bridal Sets", "Return Gifts"
 * 2. Required Collections: "Kundan Artistry", "2026 Bridal Edit", "Bengaluru Bestsellers"
 * 3. Required Demo Products:
 *    - "Ruby Jadau Bridal Chuda"
 *    - "Antique Gold Kundan Bangles"
 *    - "Classic Kemp Set"
 *    - "Regal Meenakari Bridal Kada"
 * 4. Indian Bangle Variants: Sizes (2.2, 2.4, 2.6, 2.8) with exactly 50 units inventory stock each.
 * 
 * Target Environment: Loaded safely from .env.test (Never prints credentials).
 */

import { prisma } from '@nava/db';
import type { PrismaClient } from '@nava/db';

export interface CategorySeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface CollectionSeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'PUBLISHED';
  displayOrder: number;
}

export interface VariantSeed {
  id: string;
  sku: string;
  title: string;
  size: '2.2' | '2.4' | '2.6' | '2.8';
  colour: string;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
}

export interface ProductSeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  pricePaise: number;
  compareAtPricePaise: number;
  categoryId: string;
  isFeatured: boolean;
  images: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
  collections: string[];
  variants: VariantSeed[];
}

export const DEMO_CATEGORIES: CategorySeed[] = [
  {
    id: 'cat-bridal',
    name: 'Bridal',
    slug: 'bridal',
    description: 'Regal bridal chuda, kadas, and complete wedding accessory ensembles handcrafted in Bengaluru.',
    isActive: true,
  },
  {
    id: 'cat-handmade',
    name: 'Handmade',
    slug: 'handmade',
    description: 'Artisanal handcrafted glass, velvet, kemp, and thread bangles made with heritage devotion.',
    isActive: true,
  },
  {
    id: 'cat-bangles',
    name: 'Handmade Bangles',
    slug: 'handmade-bangles',
    description: 'Artisanal handcrafted glass, velvet, and thread bangles made in Bengaluru.',
    isActive: true,
  },
  {
    id: 'cat-bridal-jewellery',
    name: 'Bridal Sets',
    slug: 'bridal-jewellery',
    description: 'Exquisite bridal chuda ensembles and complete wedding sets.',
    isActive: true,
  },
  {
    id: 'cat-gifts',
    name: 'Return Gifts',
    slug: 'return-gifts',
    description: 'Curated gift hampers and boxed bangle sets for weddings and festive ceremonies.',
    isActive: true,
  },
  {
    id: 'cat-hair',
    name: 'Hair Accessories',
    slug: 'hair-accessories',
    description: 'Floral pins, pearl jadas, and statement bridal hair ornaments.',
    isActive: true,
  },
];

export const DEMO_COLLECTIONS: CollectionSeed[] = [
  {
    id: 'col-kundan-artistry',
    name: 'Kundan Artistry',
    slug: 'kundan-artistry',
    description: 'Traditional Jadau and Kundan stonework set in 22K antique gold finish.',
    status: 'PUBLISHED',
    displayOrder: 1,
  },
  {
    id: 'col-bridal-2026',
    name: 'Bridal Edit 2026',
    slug: 'bridal-edit-2026',
    description: 'Curated royal bridal bangles, Kundan kadas, and statement heirloom accessories for the 2026 wedding season.',
    status: 'PUBLISHED',
    displayOrder: 2,
  },
  {
    id: 'col-bestsellers',
    name: 'Bengaluru Bestsellers',
    slug: 'bestsellers',
    description: 'Most loved handmade bangles and Kundan pieces by our Bengaluru clientele.',
    status: 'PUBLISHED',
    displayOrder: 3,
  },
  {
    id: 'col-return-gifts',
    name: 'Festive Return Gifts',
    slug: 'festive-return-gifts',
    description: 'Bulk return gift boxes and favours for weddings, housewarmings, and poojas.',
    status: 'PUBLISHED',
    displayOrder: 4,
  },
];

export const DEMO_PRODUCTS: ProductSeed[] = [
  {
    id: 'demo-prod-ruby-jadau-chuda',
    name: 'Ruby Jadau Bridal Chuda Set',
    slug: 'ruby-jadau-bridal-chuda',
    description: 'Exquisite bridal chuda set handcrafted with rich ruby-red cabochons and precision Jadau Kundan stonework. Complete with ceremonial kadas and matching minakari spacers.',
    sku: 'NAV-DEMO-RBY-001',
    pricePaise: 399900,
    compareAtPricePaise: 499900,
    categoryId: 'cat-bridal',
    isFeatured: true,
    images: [
      { id: 'demo-img-rby-1', url: '/branding/sample-chuda-1.jpg', isPrimary: true, displayOrder: 1 },
      { id: 'demo-img-rby-2', url: '/branding/sample-chuda-2.jpg', isPrimary: false, displayOrder: 2 },
    ],
    collections: ['col-bridal-2026', 'col-kundan-artistry', 'col-bestsellers'],
    variants: [
      { id: 'demo-var-rby-22', sku: 'NAV-DEMO-RBY-22', title: 'Size 2.2 (54.0 mm)', size: '2.2', colour: 'Deep Crimson & Antique Gold', pricePaise: 399900, mrpPaise: 499900, stock: 50 },
      { id: 'demo-var-rby-24', sku: 'NAV-DEMO-RBY-24', title: 'Size 2.4 (57.2 mm)', size: '2.4', colour: 'Deep Crimson & Antique Gold', pricePaise: 399900, mrpPaise: 499900, stock: 50 },
      { id: 'demo-var-rby-26', sku: 'NAV-DEMO-RBY-26', title: 'Size 2.6 (60.3 mm)', size: '2.6', colour: 'Deep Crimson & Antique Gold', pricePaise: 399900, mrpPaise: 499900, stock: 50 },
      { id: 'demo-var-rby-28', sku: 'NAV-DEMO-RBY-28', title: 'Size 2.8 (63.5 mm)', size: '2.8', colour: 'Deep Crimson & Antique Gold', pricePaise: 399900, mrpPaise: 499900, stock: 50 },
    ],
  },
  {
    id: 'demo-prod-antique-gold-kundan',
    name: 'Antique Gold Kundan Bangles',
    slug: 'antique-gold-kundan-bangles',
    description: 'Timeless pair of antique gold-plated bangles embellished with handset uncut Kundan stones and floral filigree openable clasps.',
    sku: 'NAV-DEMO-GLD-002',
    pricePaise: 249900,
    compareAtPricePaise: 329900,
    categoryId: 'cat-handmade',
    isFeatured: true,
    images: [
      { id: 'demo-img-gld-1', url: '/branding/sample-kada-1.jpg', isPrimary: true, displayOrder: 1 },
    ],
    collections: ['col-kundan-artistry', 'col-bestsellers'],
    variants: [
      { id: 'demo-var-gld-22', sku: 'NAV-DEMO-GLD-22', title: 'Size 2.2 (54.0 mm)', size: '2.2', colour: 'Antique Matte Gold', pricePaise: 249900, mrpPaise: 329900, stock: 50 },
      { id: 'demo-var-gld-24', sku: 'NAV-DEMO-GLD-24', title: 'Size 2.4 (57.2 mm)', size: '2.4', colour: 'Antique Matte Gold', pricePaise: 249900, mrpPaise: 329900, stock: 50 },
      { id: 'demo-var-gld-26', sku: 'NAV-DEMO-GLD-26', title: 'Size 2.6 (60.3 mm)', size: '2.6', colour: 'Antique Matte Gold', pricePaise: 249900, mrpPaise: 329900, stock: 50 },
      { id: 'demo-var-gld-28', sku: 'NAV-DEMO-GLD-28', title: 'Size 2.8 (63.5 mm)', size: '2.8', colour: 'Antique Matte Gold', pricePaise: 249900, mrpPaise: 329900, stock: 50 },
    ],
  },
  {
    id: 'demo-prod-classic-kemp-set',
    name: 'Classic Kemp Set',
    slug: 'classic-kemp-set',
    description: 'South Indian temple heritage bangle ensemble studded with deep crimson kemp stones, freshwater pearl drops, and 22K antique matte finish.',
    sku: 'NAV-DEMO-KMP-003',
    pricePaise: 189900,
    compareAtPricePaise: 249900,
    categoryId: 'cat-handmade',
    isFeatured: true,
    images: [
      { id: 'demo-img-kmp-1', url: '/branding/sample-silk-1.jpg', isPrimary: true, displayOrder: 1 },
    ],
    collections: ['col-bridal-2026', 'col-bestsellers'],
    variants: [
      { id: 'demo-var-kmp-22', sku: 'NAV-DEMO-KMP-22', title: 'Size 2.2 (54.0 mm)', size: '2.2', colour: 'Temple Ruby Red & Gold', pricePaise: 189900, mrpPaise: 249900, stock: 50 },
      { id: 'demo-var-kmp-24', sku: 'NAV-DEMO-KMP-24', title: 'Size 2.4 (57.2 mm)', size: '2.4', colour: 'Temple Ruby Red & Gold', pricePaise: 189900, mrpPaise: 249900, stock: 50 },
      { id: 'demo-var-kmp-26', sku: 'NAV-DEMO-KMP-26', title: 'Size 2.6 (60.3 mm)', size: '2.6', colour: 'Temple Ruby Red & Gold', pricePaise: 189900, mrpPaise: 249900, stock: 50 },
      { id: 'demo-var-kmp-28', sku: 'NAV-DEMO-KMP-28', title: 'Size 2.8 (63.5 mm)', size: '2.8', colour: 'Temple Ruby Red & Gold', pricePaise: 189900, mrpPaise: 249900, stock: 50 },
    ],
  },
  {
    id: 'demo-prod-regal-meenakari-kada',
    name: 'Regal Meenakari Bridal Kada',
    slug: 'regal-meenakari-bridal-kada',
    description: 'Statement royal bridal kada featuring intricate peacock meenakari enamelling on the inner band and uncut polki stones on the outer bezel.',
    sku: 'NAV-DEMO-MNK-004',
    pricePaise: 299900,
    compareAtPricePaise: 379900,
    categoryId: 'cat-bridal',
    isFeatured: true,
    images: [
      { id: 'demo-img-mnk-1', url: '/branding/sample-chuda-2.jpg', isPrimary: true, displayOrder: 1 },
    ],
    collections: ['col-bridal-2026', 'col-kundan-artistry'],
    variants: [
      { id: 'demo-var-mnk-22', sku: 'NAV-DEMO-MNK-22', title: 'Size 2.2 (54.0 mm)', size: '2.2', colour: 'Peacock Blue & Gold Enamel', pricePaise: 299900, mrpPaise: 379900, stock: 50 },
      { id: 'demo-var-mnk-24', sku: 'NAV-DEMO-MNK-24', title: 'Size 2.4 (57.2 mm)', size: '2.4', colour: 'Peacock Blue & Gold Enamel', pricePaise: 299900, mrpPaise: 379900, stock: 50 },
      { id: 'demo-var-mnk-26', sku: 'NAV-DEMO-MNK-26', title: 'Size 2.6 (60.3 mm)', size: '2.6', colour: 'Peacock Blue & Gold Enamel', pricePaise: 299900, mrpPaise: 379900, stock: 50 },
      { id: 'demo-var-mnk-28', sku: 'NAV-DEMO-MNK-28', title: 'Size 2.8 (63.5 mm)', size: '2.8', colour: 'Peacock Blue & Gold Enamel', pricePaise: 299900, mrpPaise: 379900, stock: 50 },
    ],
  },
];

export async function runDemoCatalogSeed(prismaClient?: PrismaClient) {
  const db = prismaClient || prisma;

  console.log('=============================================================');
  console.log('NAVA CREATIONS — DEMO CATALOG SEEDER');
  console.log('=============================================================');

  // 1. Seed Categories
  console.log('\n[1/4] Seeding Categories ("Bridal", "Handmade", etc.)...');
  for (const cat of DEMO_CATEGORIES) {
    await db.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, slug: cat.slug, description: cat.description, isActive: cat.isActive },
      create: cat,
    });
  }
  console.log(`[PASS] Seeded ${DEMO_CATEGORIES.length} Categories.`);

  // 2. Seed Collections
  console.log('\n[2/4] Seeding Collections ("Kundan Artistry", "2026 Bridal Edit", etc.)...');
  for (const col of DEMO_COLLECTIONS) {
    await db.collection.upsert({
      where: { id: col.id },
      update: {
        name: col.name,
        slug: col.slug,
        description: col.description,
        status: col.status,
        displayOrder: col.displayOrder,
      },
      create: col,
    });
  }
  console.log(`[PASS] Seeded ${DEMO_COLLECTIONS.length} Collections.`);

  // 3. Seed Products, Images, Variants & Inventory
  console.log('\n[3/4] Seeding Products with Indian Bangle Sizes (2.2, 2.4, 2.6, 2.8) & 50 stock...');
  for (const prod of DEMO_PRODUCTS) {
    await db.product.upsert({
      where: { id: prod.id },
      update: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        sku: prod.sku,
        pricePaise: prod.pricePaise,
        compareAtPricePaise: prod.compareAtPricePaise,
        status: 'PUBLISHED',
        isFeatured: prod.isFeatured,
        isAvailable: true,
        categoryId: prod.categoryId,
      },
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        sku: prod.sku,
        pricePaise: prod.pricePaise,
        compareAtPricePaise: prod.compareAtPricePaise,
        status: 'PUBLISHED',
        isFeatured: prod.isFeatured,
        isAvailable: true,
        categoryId: prod.categoryId,
      },
    });

    // Images
    for (const img of prod.images) {
      await db.productImage.upsert({
        where: { id: img.id },
        update: { url: img.url, isPrimary: img.isPrimary, displayOrder: img.displayOrder },
        create: {
          id: img.id,
          productId: prod.id,
          url: img.url,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder,
        },
      });
    }

    // Collections
    for (const colId of prod.collections) {
      await db.collectionProduct.upsert({
        where: { collectionId_productId: { collectionId: colId, productId: prod.id } },
        update: {},
        create: { collectionId: colId, productId: prod.id },
      });
    }

    // Variants & Inventory Stock (50 each)
    for (const v of prod.variants) {
      await db.productVariant.upsert({
        where: { id: v.id },
        update: {
          sku: v.sku,
          title: v.title,
          size: v.size,
          colour: v.colour,
          pricePaise: v.pricePaise,
          mrpPaise: v.mrpPaise,
          isActive: true,
        },
        create: {
          id: v.id,
          productId: prod.id,
          sku: v.sku,
          title: v.title,
          size: v.size,
          colour: v.colour,
          pricePaise: v.pricePaise,
          mrpPaise: v.mrpPaise,
          isActive: true,
        },
      });

      await db.inventoryItem.upsert({
        where: { variantId: v.id },
        update: { availableQty: v.stock, reservedQty: 0 },
        create: {
          variantId: v.id,
          availableQty: v.stock,
          reservedQty: 0,
          safetyStock: 0,
        },
      });
    }
  }
  console.log(`[PASS] Seeded ${DEMO_PRODUCTS.length} Demo Products with all 4 bangle sizes (2.2, 2.4, 2.6, 2.8) at 50 units stock.`);

  // 4. Ensure existing standard variants also have replenished stock for test reliability
  console.log('\n[4/5] Replenishing stock on standard test variants...');
  const testVariantIds = ['var-1-24', 'var-1-26', 'var-1-28', 'var-2-24', 'var-2-26'];
  for (const vid of testVariantIds) {
    const existing = await db.productVariant.findUnique({ where: { id: vid } });
    if (existing) {
      await db.inventoryItem.upsert({
        where: { variantId: vid },
        update: { availableQty: 50, reservedQty: 0 },
        create: { variantId: vid, availableQty: 50, reservedQty: 0, safetyStock: 0 },
      });
    }
  }

  // 5. Update Studio Settings for UPI Onboarding Approval & COD
  console.log('\n[5/5] Configuring Studio Settings (UPI Approval & COD)...');
  const existingSettings = await db.storeSetting.findUnique({ where: { key: 'studio_settings' } });
  let settingsObj = {};
  if (existingSettings && existingSettings.value) {
    try { settingsObj = JSON.parse(existingSettings.value); } catch {}
  }
  const updatedSettings = {
    ...settingsObj,
    isMerchantConfirmed: true,
    codEnabled: true,
    upiVpa: 'nava.creations@bharatpe',
    merchantName: 'NAVA CREATIONS',
    updatedAt: new Date().toISOString(),
  };
  await db.storeSetting.upsert({
    where: { key: 'studio_settings' },
    update: { value: JSON.stringify(updatedSettings) },
    create: { key: 'studio_settings', value: JSON.stringify(updatedSettings) },
  });
  console.log('[PASS] Studio settings configured with approved Merchant UPI & active COD.');

  console.log('[PASS] Demo catalog successfully populated in database!');
  return { success: true };
}

// Auto-run if executed directly
if (require.main === module) {
  runDemoCatalogSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[FAIL] Seeding failed:', err);
      process.exit(1);
    });
}
