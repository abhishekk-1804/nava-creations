/**
 * NAVA CREATIONS — TEST DATABASE SEEDER
 * Seeds the isolated PostgreSQL 16 test database (nava_gateb_test) with:
 * 1. Default Categories and Collections
 * 2. Sample Products, Product Images, Variants, and Inventory Items
 * 3. Default Store Manager User
 * 4. Sample Order (NAV-2026-8821) and Enquiry (ENQ-2026-1001) for E2E testing
 * 
 * NEVER prints credentials or passwords.
 */

const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

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
      { id: 'var-1-24', sku: 'NAV-BDL-KDN-001-24', title: 'Size 2.4 (57.2 mm)', size: '2.4', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 50 },
      { id: 'var-1-26', sku: 'NAV-BDL-KDN-001-26', title: 'Size 2.6 (60.3 mm)', size: '2.6', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 8 },
      { id: 'var-1-28', sku: 'NAV-BDL-KDN-001-28', title: 'Size 2.8 (63.5 mm)', size: '2.8', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 50 },
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
    sku: 'NAV-HAR-MP-004',
    pricePaise: 219900,
    compareAtPricePaise: 279900,
    status: 'PUBLISHED',
    isFeatured: false,
    isAvailable: true,
    categoryId: 'cat-hair',
    images: [
      { id: 'img-5', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
    ],
    variants: [
      { id: 'var-4-std', sku: 'NAV-HAR-MP-004-STD', title: 'Standard Adjustable Fit', size: 'Free Size', colour: 'Ivory Pearl & Kundan Gold', pricePaise: 219900, mrpPaise: 279900, stock: 15 },
    ],
    collections: ['col-bridal-2026'],
  },
  {
    id: 'prod-return-gift-box-05',
    name: 'Festive Velvet Return Gift Bangle Box (Set of 6 Pairs)',
    slug: 'festive-velvet-return-gift-bangle-box',
    description: 'Elegant hand-bound velvet presentation boxes each containing assorted coordinated bangle pairs.',
    sku: 'NAV-GFT-BOX-005',
    pricePaise: 129900,
    compareAtPricePaise: 169900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-gifts',
    images: [
      { id: 'img-6', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
    ],
    variants: [
      { id: 'var-5-std', sku: 'NAV-GFT-BOX-005-STD', title: 'Assorted Size Pack (2.4 & 2.6)', size: 'Mixed Sizes', colour: 'Assorted Festive Colours', pricePaise: 129900, mrpPaise: 169900, stock: 35 },
    ],
    collections: ['col-return-gifts'],
  },
  {
    id: 'prod-journey-kundan-06',
    name: 'Bespoke Kundan Heirloom Bridal Chuda Set',
    slug: 'bespoke-kundan-heirloom-bridal-chuda-set',
    description: 'Artisanal heirloom Kundan bridal chuda ensemble handcrafted for customer journey verification.',
    sku: 'NAV-BDL-JRN-006',
    pricePaise: 349900,
    compareAtPricePaise: 449900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-bridal',
    images: [
      { id: 'img-jrn-1', url: 'https://images.unsplash.com/photo-1611591475850-53818e69234b?auto=format&fit=crop&w=1000&q=80', isPrimary: true, displayOrder: 1 },
    ],
    variants: [
      { id: 'var-jrn-24', sku: 'NAV-BDL-JRN-006-24', title: 'Size 2.4 (57.2 mm)', size: '2.4', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 25 },
      { id: 'var-jrn-26', sku: 'NAV-BDL-JRN-006-26', title: 'Size 2.6 (60.3 mm)', size: '2.6', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 25 },
      { id: 'var-jrn-28', sku: 'NAV-BDL-JRN-006-28', title: 'Size 2.8 (63.5 mm)', size: '2.8', colour: 'Deep Maroon & Gold', pricePaise: 349900, mrpPaise: 449900, stock: 25 },
    ],
    collections: ['col-bridal-2026', 'col-bestsellers'],
  },
];

async function seedDatabase() {
  console.log('=============================================================');
  console.log('NAVA CREATIONS — SEEDING TEST DATABASE');
  console.log('=============================================================');

  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Guard verified: Target DB "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

  try {
    // 1. Seed Categories
    console.log('\n[1/6] Seeding Categories...');
    for (const cat of SAMPLE_CATEGORIES) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, slug: cat.slug, description: cat.description, isActive: cat.isActive },
        create: cat,
      });
    }
    console.log(`[PASS] Seeded ${SAMPLE_CATEGORIES.length} categories.`);

    // 2. Seed Collections
    console.log('\n[2/6] Seeding Collections...');
    for (const col of SAMPLE_COLLECTIONS) {
      await prisma.collection.upsert({
        where: { id: col.id },
        update: { name: col.name, slug: col.slug, description: col.description, status: col.status, displayOrder: col.displayOrder },
        create: col,
      });
    }
    console.log(`[PASS] Seeded ${SAMPLE_COLLECTIONS.length} collections.`);

    // 3. Seed Products, Images, Variants & Inventory
    console.log('\n[3/6] Seeding Products, Variants & Inventory...');
    // Clear any leftover pending reservations from previous test runs to ensure clean stock balance
    await prisma.inventoryReservationItem.deleteMany({
      where: { reservation: { status: 'PENDING' } },
    });
    await prisma.inventoryReservation.deleteMany({
      where: { status: 'PENDING' },
    });

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

      // Images
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

      // Collection links
      for (const colId of prod.collections) {
        await prisma.collectionProduct.upsert({
          where: { collectionId_productId: { collectionId: colId, productId: prod.id } },
          update: {},
          create: { collectionId: colId, productId: prod.id },
        });
      }

      // Variants & Inventory
      for (const v of prod.variants) {
        await prisma.productVariant.upsert({
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

        // Inventory item with positive stock
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
    }
    console.log(`[PASS] Seeded ${SAMPLE_PRODUCTS.length} products with variants and inventory items.`);

    // 4. Seed Default Admin User
    console.log('\n[4/6] Seeding Admin User...');
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
    console.log(`[PASS] Admin user verified (ID: ${adminUser.id}).`);

    // 5. Seed Sample Order (NAV-2026-8821)
    console.log('\n[5/6] Seeding Sample Order NAV-2026-8821 for fulfillment testing...');
    // Clean up transient test orders from prior test runs (preserving canonical NAV-2026-8821)
    await prisma.refund.deleteMany({
      where: { order: { orderNumber: { not: 'NAV-2026-8821' } } },
    });
    await prisma.paymentAttempt.deleteMany({
      where: { payment: { order: { orderNumber: { not: 'NAV-2026-8821' } } } },
    });
    await prisma.payment.deleteMany({
      where: { order: { orderNumber: { not: 'NAV-2026-8821' } } },
    });
    await prisma.orderItem.deleteMany({
      where: { order: { orderNumber: { not: 'NAV-2026-8821' } } },
    });
    await prisma.inventoryReservationItem.deleteMany({
      where: { reservation: { order: { orderNumber: { not: 'NAV-2026-8821' } } } },
    });
    await prisma.inventoryReservation.deleteMany({
      where: { order: { orderNumber: { not: 'NAV-2026-8821' } } },
    });
    await prisma.order.deleteMany({
      where: { orderNumber: { not: 'NAV-2026-8821' } },
    });
    const sampleOrder = await prisma.order.upsert({
      where: { orderNumber: 'NAV-2026-8821' },
      update: {
        status: 'PROCESSING',
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

    // 6. Seed Sample Enquiry (ENQ-2026-1001)
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

    console.log('=============================================================');
    console.log('TEST DATABASE SEEDING COMPLETED SUCCESSFULLY (100%)');
    console.log('=============================================================');
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
