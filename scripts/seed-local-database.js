/**
 * NAVA CREATIONS — LOCAL DEVELOPMENT DATABASE SEEDER
 * Populates the local development database (nava_local on port 5433)
 * with catalog categories, collections, products, variants, inventory, and sample records.
 *
 * SAFETY GUARD:
 * strictly refuses to run unless the target database is 'nava_local' on port 5433.
 * NEVER prints credentials or passwords.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');

const envDevPath = path.resolve(__dirname, '../apps/web/.env.development.local');
if (!fs.existsSync(envDevPath)) {
  console.error('[GUARD FAIL] .env.development.local not found at:', envDevPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envDevPath, 'utf8');
const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
if (!match) {
  console.error('[GUARD FAIL] DATABASE_URL not found in .env.development.local');
  process.exit(1);
}

const dbUrl = match[1];
const parsed = new URL(dbUrl);

// Strict safety assertion
if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
  console.error('[GUARD FAIL] Host must be local (127.0.0.1 or localhost), got:', parsed.hostname);
  process.exit(1);
}
if (parsed.port !== '5433') {
  console.error('[GUARD FAIL] Port must be 5433 for nava_local, got:', parsed.port);
  process.exit(1);
}
if (parsed.pathname !== '/nava_local') {
  console.error('[GUARD FAIL] Target database must be /nava_local, got:', parsed.pathname);
  process.exit(1);
}

console.log('=============================================================');
console.log('NAVA CREATIONS — LOCAL DEVELOPMENT DATABASE SEEDER');
console.log('Target: Local PostgreSQL (nava_local on port 5433)');
console.log('=============================================================');

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
});

const SAMPLE_CATEGORIES = [
  {
    id: 'cat-bangles',
    name: 'Handmade Bangles',
    slug: 'handmade-bangles',
    description: 'Artisanal handcrafted glass, velvet, and thread bangles made in Bengaluru.',
    isActive: true,
  },
  {
    id: 'cat-bridal',
    name: 'Bridal Jewellery & Sets',
    slug: 'bridal-jewellery',
    description: 'Regal bridal chuda, kadas, and complete wedding accessory ensembles.',
    isActive: true,
  },
  {
    id: 'cat-kundan',
    name: 'Kundan Artistry',
    slug: 'kundan-artistry',
    description: 'Traditional Jadau and Kundan stonework set in antique gold finish.',
    isActive: true,
  },
  {
    id: 'cat-hair',
    name: 'Hair Accessories & Matha Patti',
    slug: 'hair-accessories',
    description: 'Floral pins, pearl jadas, and statement bridal hair ornaments.',
    isActive: true,
  },
  {
    id: 'cat-gifts',
    name: 'Return Gifts & Favours',
    slug: 'return-gifts',
    description: 'Curated gift hampers and boxed bangle sets for weddings and baby showers.',
    isActive: true,
  },
];

const SAMPLE_COLLECTIONS = [
  {
    id: 'col-bridal-2026',
    name: 'Bridal Edit 2026',
    slug: 'bridal-edit-2026',
    description: 'Curated royal bridal bangles, Kundan kadas, and statement heirloom accessories.',
    status: 'PUBLISHED',
    displayOrder: 1,
  },
  {
    id: 'col-bestsellers',
    name: 'Bengaluru Bestsellers',
    slug: 'bestsellers',
    description: 'Most loved handmade bangles and Kundan pieces by our Bengaluru customers.',
    status: 'PUBLISHED',
    displayOrder: 2,
  },
  {
    id: 'col-return-gifts',
    name: 'Festive Return Gifts',
    slug: 'festive-return-gifts',
    description: 'Bulk return gift boxes and favors for weddings, housewarmings, and poojas.',
    status: 'PUBLISHED',
    displayOrder: 3,
  },
];

const SAMPLE_PRODUCTS = [
  {
    id: 'prod-kundan-chuda-01',
    name: 'Regal Kundan Bridal Chuda & Kada Set',
    slug: 'regal-kundan-bridal-chuda-kada-set',
    description: 'Exquisite bridal chuda ensemble handcrafted with precision Kundan stone settings.',
    sku: 'NAV-BDL-KDN-001',
    pricePaise: 349900,
    compareAtPricePaise: 449900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-bridal',
    images: [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1611591475850-53818e69234b?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
      { id: 'img-2', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80', isPrimary: false, displayOrder: 2 },
    ],
    variants: [
      { id: 'var-1-24', sku: 'NAV-BDL-KDN-001-24', title: 'Size 2.4 (57.2 mm)', size: '2.4', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 5 },
      { id: 'var-1-26', sku: 'NAV-BDL-KDN-001-26', title: 'Size 2.6 (60.3 mm)', size: '2.6', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 8 },
      { id: 'var-1-28', sku: 'NAV-BDL-KDN-001-28', title: 'Size 2.8 (63.5 mm)', size: '2.8', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 3 },
    ],
    collections: ['col-bridal-2026', 'col-bestsellers'],
  },
  {
    id: 'prod-temple-nakshi-02',
    name: 'Temple Nakshi Antique Gold Kada Pair',
    slug: 'temple-nakshi-antique-gold-kada-pair',
    description: 'Intricate temple-carved openable kadas depicting classical Indian heritage motifs.',
    sku: 'NAV-BGL-TMP-002',
    pricePaise: 189900,
    compareAtPricePaise: 249900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-bangles',
    images: [
      { id: 'img-3', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
    ],
    variants: [
      { id: 'var-2-24', sku: 'NAV-BGL-TMP-002-24', title: 'Size 2.4 (Openable)', size: '2.4', colour: 'Antique Matte Gold', pricePaise: 189900, mrpPaise: 249900, stock: 25 },
      { id: 'var-2-26', sku: 'NAV-BGL-TMP-002-26', title: 'Size 2.6 (Openable)', size: '2.6', colour: 'Antique Matte Gold', pricePaise: 189900, mrpPaise: 249900, stock: 25 },
    ],
    collections: ['col-bestsellers'],
  },
  {
    id: 'prod-meenakari-floral-03',
    name: 'Handcrafted Meenakari Floral Bangle Set',
    slug: 'handcrafted-meenakari-floral-bangle-set',
    description: 'Delicate hand-painted enamel Meenakari bangles adorned with semi-precious pearls and zircons.',
    sku: 'NAV-KDN-MNK-003',
    pricePaise: 149900,
    compareAtPricePaise: 199900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-kundan',
    images: [
      { id: 'img-4', url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
    ],
    variants: [
      { id: 'var-3-24', sku: 'NAV-KDN-MNK-003-24', title: 'Size 2.4', size: '2.4', colour: 'Ruby Pink & Mint Enamel', pricePaise: 149900, mrpPaise: 199900, stock: 20 },
      { id: 'var-3-26', sku: 'NAV-KDN-MNK-003-26', title: 'Size 2.6', size: '2.6', colour: 'Ruby Pink & Mint Enamel', pricePaise: 149900, mrpPaise: 199900, stock: 20 },
    ],
    collections: ['col-bestsellers'],
  },
  {
    id: 'prod-pearl-mathapatti-04',
    name: 'Heirloom Pearl & Kundan Bridal Matha Patti',
    slug: 'heirloom-pearl-kundan-bridal-matha-patti',
    description: 'Statement multi-strand pearl and Kundan sheeshpatti designed to frame the bridal hairline.',
    sku: 'NAV-HAR-MTP-004',
    pricePaise: 279900,
    compareAtPricePaise: 349900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-hair',
    images: [
      { id: 'img-5', url: 'https://images.unsplash.com/photo-1611591475850-53818e69234b?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
    ],
    variants: [
      { id: 'var-4-free', sku: 'NAV-HAR-MTP-004-OS', title: 'One Size / Free Size', size: 'Free Size', colour: 'Ivory Pearl & Champagne Gold', pricePaise: 279900, mrpPaise: 349900, stock: 15 },
    ],
    collections: ['col-bridal-2026'],
  },
  {
    id: 'prod-return-gift-bangle-box-05',
    name: 'Handcrafted Brocade Return Gift Bangle Box',
    slug: 'handcrafted-brocade-return-gift-bangle-box',
    description: 'Luxurious zari brocade bangle organizer box ideal for wedding and baby shower favors.',
    sku: 'NAV-GFT-BOX-005',
    pricePaise: 39900,
    compareAtPricePaise: 59900,
    status: 'PUBLISHED',
    isFeatured: false,
    isAvailable: true,
    categoryId: 'cat-gifts',
    images: [
      { id: 'img-6', url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
    ],
    variants: [
      { id: 'var-5-free', sku: 'NAV-GFT-BOX-005-OS', title: 'Single Roll (Standard)', size: 'Standard', colour: 'Assorted Festive Colours', pricePaise: 39900, mrpPaise: 59900, stock: 100 },
    ],
    collections: ['col-return-gifts'],
  },
];

async function seedLocalDatabase() {
  try {
    // 1. Seed Categories
    console.log('[1/6] Seeding Categories...');
    for (const cat of SAMPLE_CATEGORIES) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, slug: cat.slug, description: cat.description, isActive: cat.isActive },
        create: cat,
      });
    }
    console.log(`[PASS] ${SAMPLE_CATEGORIES.length} categories seeded.`);

    // 2. Seed Collections
    console.log('\n[2/6] Seeding Collections...');
    for (const col of SAMPLE_COLLECTIONS) {
      await prisma.collection.upsert({
        where: { id: col.id },
        update: { name: col.name, slug: col.slug, description: col.description, status: col.status, displayOrder: col.displayOrder },
        create: col,
      });
    }
    console.log(`[PASS] ${SAMPLE_COLLECTIONS.length} collections seeded.`);

    // 3. Seed Products, Variants, Images & Inventory
    console.log('\n[3/6] Seeding Products, Variants & Inventory...');
    for (const prod of SAMPLE_PRODUCTS) {
      await prisma.product.upsert({
        where: { id: prod.id },
        update: {
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          sku: prod.sku,
          pricePaise: prod.pricePaise,
          compareAtPricePaise: prod.compareAtPricePaise,
          status: prod.status,
          isFeatured: prod.isFeatured,
          isAvailable: prod.isAvailable,
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
          status: prod.status,
          isFeatured: prod.isFeatured,
          isAvailable: prod.isAvailable,
          categoryId: prod.categoryId,
        },
      });

      for (const img of prod.images) {
        await prisma.productImage.upsert({
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

      for (const v of prod.variants) {
        await prisma.productVariant.upsert({
          where: { id: v.id },
          update: { title: v.title, sku: v.sku, size: v.size, colour: v.colour, pricePaise: v.pricePaise, mrpPaise: v.mrpPaise, isActive: true },
          create: {
            id: v.id,
            productId: prod.id,
            title: v.title,
            sku: v.sku,
            size: v.size,
            colour: v.colour,
            pricePaise: v.pricePaise,
            mrpPaise: v.mrpPaise,
            isActive: true,
          },
        });

        await prisma.inventoryItem.upsert({
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

      for (const colId of prod.collections) {
        await prisma.collectionProduct.upsert({
          where: {
            collectionId_productId: {
              collectionId: colId,
              productId: prod.id,
            },
          },
          update: {},
          create: {
            collectionId: colId,
            productId: prod.id,
            displayOrder: 1,
          },
        });
      }
    }
    console.log(`[PASS] ${SAMPLE_PRODUCTS.length} products seeded with variants and inventory.`);

    // 4. Seed Default Admin User
    console.log('\n[4/6] Seeding Default Admin User...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'owner@nava-creations.internal' },
      update: { role: 'STORE_MANAGER', isActive: true },
      create: {
        email: 'owner@nava-creations.internal',
        phone: '+919886000000',
        name: 'Studio Owner & Manager',
        role: 'STORE_MANAGER',
        isActive: true,
      },
    });
    console.log(`[PASS] Admin user seeded (ID: ${adminUser.id}).`);

    // 5. Seed Sample Order
    console.log('\n[5/6] Seeding Sample Order NAV-2026-8821...');
    const sampleOrder = await prisma.order.upsert({
      where: { orderNumber: 'NAV-2026-8821' },
      update: {
        status: 'PROCESSING',
      },
      create: {
        orderNumber: 'NAV-2026-8821',
        status: 'PROCESSING',
        paymentMethod: 'UPI_MERCHANT_QR',
        subtotalPaise: 349900,
        totalPaise: 349900,
        shippingAddress: {
          name: 'Ananya Rao',
          phone: '+919886011223',
          addressLine1: '42, 4th Cross, Indiranagar',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560038',
        },
        billingAddress: {
          name: 'Ananya Rao',
          phone: '+919886011223',
          addressLine1: '42, 4th Cross, Indiranagar',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560038',
        },
        items: {
          create: [
            {
              variantId: 'var-1-26',
              title: 'Regal Kundan Bridal Chuda & Kada Set (Size 2.6)',
              sku: 'NAV-BDL-KDN-001-26',
              quantity: 1,
              unitPricePaise: 349900,
              totalPaise: 349900,
            },
          ],
        },
        payments: {
          create: [
            {
              paymentReference: 'PAY-NAV-2026-8821-INIT',
              method: 'UPI_MERCHANT_QR',
              provider: 'BHARATPE_QR',
              amountPaise: 349900,
              status: 'VERIFIED',
              claimedUtr: '431289004512',
              verifiedTransactionId: 'BANK-CR-8821-INIT',
            },
          ],
        },
      },
    });
    console.log(`[PASS] Sample order seeded (orderNumber: ${sampleOrder.orderNumber}).`);

    // 6. Seed Sample Enquiry
    console.log('\n[6/6] Seeding Sample Enquiry ENQ-2026-1001...');
    const sampleEnq = await prisma.enquiry.upsert({
      where: { enquiryNumber: 'ENQ-2026-1001' },
      update: {},
      create: {
        enquiryNumber: 'ENQ-2026-1001',
        name: 'Ananya Deshmukh',
        phone: '+919876543210',
        email: 'ananya@example.in',
        eventType: 'BRIDAL',
        eventDate: '2026-12-15',
        bangleSize: '2.6',
        notes: 'Looking for matching Kundan kada set for wedding reception lehenga.',
        status: 'NEW',
      },
    });
    console.log(`[PASS] Sample enquiry seeded (enquiryNumber: ${sampleEnq.enquiryNumber}).`);

    console.log('\n=============================================================');
    console.log('LOCAL DATABASE SEEDING COMPLETED SUCCESSFULLY (100%)');
    console.log('=============================================================');
  } finally {
    await prisma.$disconnect();
  }
}

seedLocalDatabase().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
