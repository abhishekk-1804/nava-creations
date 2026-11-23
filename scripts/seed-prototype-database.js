/**
 * NAVA CREATIONS — PROTOTYPE DATABASE SEEDER
 * Populates nava_prototype_dev with:
 * 1. Default Categories and Collections
 * 2. Products, Variants, InventoryItems, and ProductImages
 * 3. Store Settings
 * 4. Active Coupons
 * 5. Initial Seed Customer (customer@nava-creations.in / Customer@1234)
 * 6. Initial Seed Administrator (admin@nava-creations.internal / Admin@Nava2026!)
 */

const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const crypto = require('node:crypto');

const dbUrl = process.env.DATABASE_URL || 'postgresql://nava_app:3b2133a8b9865153e6060e2506b751c5b681821a801acc69e0924c419343b2ba@127.0.0.1:5432/nava_prototype_dev?schema=public';

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`);
    });
  });
}

const CATEGORIES = [
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
    description: 'Curated gift hampers and boxed bangle sets for weddings and celebrations.',
    isActive: true,
  },
];

const COLLECTIONS = [
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
    description: 'Most loved handmade bangles and Kundan pieces by our Bengaluru studio shoppers.',
    status: 'PUBLISHED',
    displayOrder: 2,
  },
  {
    id: 'col-return-gifts',
    name: 'Festive Return Gifts',
    slug: 'festive-return-gifts',
    description: 'Bulk return gift boxes and favours for weddings, housewarmings, and festive occasions.',
    status: 'PUBLISHED',
    displayOrder: 3,
  },
];

const PRODUCTS = [
  {
    id: 'prod-bridal-chuda',
    name: 'Royal Heritage Bridal Kundan Chuda Set',
    slug: 'royal-heritage-bridal-kundan-chuda-set',
    description: 'Exquisite multi-piece bridal chuda handcrafted with premium Kundan stones, ruby-red cabochons, and gold-finish brass kadas. Designed for wedding ceremonies.',
    sku: 'NAV-CHUD-001',
    pricePaise: 349900,
    compareAtPricePaise: 499900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-bridal',
    collectionId: 'col-bridal-2026',
    images: [
      { url: '/branding/sample-chuda-1.jpg', isPrimary: true, altText: 'Royal Heritage Bridal Kundan Chuda Set - Front Angle' },
      { url: '/branding/sample-chuda-2.jpg', isPrimary: false, altText: 'Kundan Stonework Macro Detail' },
    ],
    variants: [
      { id: 'var-chuda-24', sku: 'NAV-CHUD-001-24', title: 'Size 2.4 (Small)', size: '2.4', colour: 'Maroon & Gold', pricePaise: 349900, mrpPaise: 499900, weightGrams: 350, stock: 15 },
      { id: 'var-chuda-26', sku: 'NAV-CHUD-001-26', title: 'Size 2.6 (Medium)', size: '2.6', colour: 'Maroon & Gold', pricePaise: 349900, mrpPaise: 499900, weightGrams: 350, stock: 25 },
      { id: 'var-chuda-28', sku: 'NAV-CHUD-001-28', title: 'Size 2.8 (Large)', size: '2.8', colour: 'Maroon & Gold', pricePaise: 349900, mrpPaise: 499900, weightGrams: 350, stock: 10 },
    ],
  },
  {
    id: 'prod-temple-kada',
    name: 'Temple Goddess Antique Gold Matte Kadas (Pair)',
    slug: 'temple-goddess-antique-gold-matte-kadas',
    description: 'Traditional South Indian temple jewellery kadas featuring Lakshmi motif embossing in micro-gold matte plating. Opens with a screw clasp.',
    sku: 'NAV-KADA-002',
    pricePaise: 189900,
    compareAtPricePaise: 249900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-kundan',
    collectionId: 'col-bestsellers',
    images: [
      { url: '/branding/sample-kada-1.jpg', isPrimary: true, altText: 'Temple Goddess Antique Gold Kadas Pair' },
    ],
    variants: [
      { id: 'var-kada-24', sku: 'NAV-KADA-002-24', title: 'Size 2.4', size: '2.4', colour: 'Antique Matte Gold', pricePaise: 189900, mrpPaise: 249900, weightGrams: 180, stock: 20 },
      { id: 'var-kada-26', sku: 'NAV-KADA-002-26', title: 'Size 2.6', size: '2.6', colour: 'Antique Matte Gold', pricePaise: 189900, mrpPaise: 249900, weightGrams: 180, stock: 30 },
    ],
  },
  {
    id: 'prod-silk-bangle-box',
    name: 'Shimmer Silk Thread Bangle Set - 24 Piece Box',
    slug: 'shimmer-silk-thread-bangle-set-24-piece-box',
    description: 'Vibrant silk thread wrapped bangles accented with zardosi and beadwork. Perfect for festival occasions, haldi, and sangeet.',
    sku: 'NAV-SILK-003',
    pricePaise: 129900,
    compareAtPricePaise: 180000,
    status: 'PUBLISHED',
    isFeatured: false,
    isAvailable: true,
    categoryId: 'cat-bangles',
    collectionId: 'col-bestsellers',
    images: [
      { url: '/branding/sample-silk-1.jpg', isPrimary: true, altText: 'Shimmer Silk Thread 24 Piece Box Set' },
    ],
    variants: [
      { id: 'var-silk-24', sku: 'NAV-SILK-003-24', title: 'Size 2.4', size: '2.4', colour: 'Peacock Blue & Gold', pricePaise: 129900, mrpPaise: 180000, weightGrams: 200, stock: 40 },
      { id: 'var-silk-26', sku: 'NAV-SILK-003-26', title: 'Size 2.6', size: '2.6', colour: 'Peacock Blue & Gold', pricePaise: 129900, mrpPaise: 180000, weightGrams: 200, stock: 40 },
    ],
  },
  {
    id: 'prod-floral-hair-pin',
    name: 'Handcrafted Floral Pearl Hair Jada Pin Set (Set of 6)',
    slug: 'handcrafted-floral-pearl-hair-jada-pin-set',
    description: 'Traditional South Indian hair accessory pins crafted with freshwater faux pearls, kemp stones, and gold-polished wire.',
    sku: 'NAV-HAIR-004',
    pricePaise: 89900,
    compareAtPricePaise: 129900,
    status: 'PUBLISHED',
    isFeatured: true,
    isAvailable: true,
    categoryId: 'cat-hair',
    collectionId: 'col-bridal-2026',
    images: [
      { url: '/branding/sample-hair-1.jpg', isPrimary: true, altText: 'Floral Pearl Jada Pin Set of 6' },
    ],
    variants: [
      { id: 'var-hair-std', sku: 'NAV-HAIR-004-STD', title: 'Standard Set of 6', size: 'Free Size', colour: 'Gold & Ivory Pearl', pricePaise: 89900, mrpPaise: 129900, weightGrams: 90, stock: 50 },
    ],
  },
  {
    id: 'prod-meenakari-gift-box',
    name: 'Traditional Meenakari Bangle Return Gift Box (Set of 5 Boxes)',
    slug: 'traditional-meenakari-bangle-return-gift-box',
    description: 'Bulk celebration return gift set. 5 individual velvet-lined gift boxes each holding a pair of colourful Meenakari bangles.',
    sku: 'NAV-GIFT-005',
    pricePaise: 69900,
    compareAtPricePaise: 99900,
    status: 'PUBLISHED',
    isFeatured: false,
    isAvailable: true,
    categoryId: 'cat-gifts',
    collectionId: 'col-return-gifts',
    images: [
      { url: '/branding/sample-gift-1.jpg', isPrimary: true, altText: 'Meenakari Return Gift Boxes Set of 5' },
    ],
    variants: [
      { id: 'var-gift-std', sku: 'NAV-GIFT-005-STD', title: 'Set of 5 Gift Boxes', size: 'Size 2.6 Standard', colour: 'Assorted Festival Colours', pricePaise: 69900, mrpPaise: 99900, weightGrams: 500, stock: 35 },
    ],
  },
];

const COUPONS = [
  {
    code: 'WELCOME10',
    description: '10% Welcome discount on your first order',
    type: 'PERCENTAGE',
    value: 10,
    minOrderPaise: 99900,
    maxDiscountPaise: 50000,
    usageLimit: 500,
    isActive: true,
  },
  {
    code: 'BRIDAL2026',
    description: 'Flat ₹500 discount on bridal collection orders above ₹2,999',
    type: 'FLAT_AMOUNT',
    value: 50000,
    minOrderPaise: 299900,
    maxDiscountPaise: 50000,
    usageLimit: 200,
    isActive: true,
  },
];

const SETTINGS = [
  { key: 'STORE_NAME', value: 'NAVA CREATIONS' },
  { key: 'ORIGIN_STATE_CODE', value: '29' }, // Karnataka
  { key: 'DEFAULT_STORE_TAX_MODE', value: 'UNREGISTERED' },
  { key: 'SHIPPING_STANDARD_PAISE', value: '9900' }, // ₹99
  { key: 'FREE_SHIPPING_THRESHOLD_PAISE', value: '199900' }, // Free over ₹1,999
  { key: 'MERCHANT_UPI_VPA', value: 'navacreations@okaxis' },
  { key: 'MERCHANT_DISPLAY_NAME', value: 'NAVA CREATIONS' },
];

async function seed() {
  console.log('=== SEEDING PROTOTYPE DATABASE (nava_prototype_dev) ===');

  // 1. Categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }
  console.log(`[PASS] Upserted ${CATEGORIES.length} Categories`);

  // 2. Collections
  for (const col of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { id: col.id },
      update: col,
      create: col,
    });
  }
  console.log(`[PASS] Upserted ${COLLECTIONS.length} Collections`);

  // 3. Products, Variants, Inventory, Images
  for (const p of PRODUCTS) {
    const { images, variants, collectionId, ...prodData } = p;

    await prisma.product.upsert({
      where: { id: prodData.id },
      update: prodData,
      create: prodData,
    });

    // Link to collection
    if (collectionId) {
      await prisma.collectionProduct.upsert({
        where: {
          collectionId_productId: {
            collectionId,
            productId: prodData.id,
          },
        },
        update: {},
        create: {
          collectionId,
          productId: prodData.id,
          displayOrder: 1,
        },
      });
    }

    // Images
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imgId = `${prodData.id}-img-${i + 1}`;
      await prisma.productImage.upsert({
        where: { id: imgId },
        update: {
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          displayOrder: i + 1,
        },
        create: {
          id: imgId,
          productId: prodData.id,
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          displayOrder: i + 1,
        },
      });
    }

    // Variants and Inventory
    for (const v of variants) {
      const { stock, ...varData } = v;
      await prisma.productVariant.upsert({
        where: { id: varData.id },
        update: { ...varData, productId: prodData.id },
        create: { ...varData, productId: prodData.id },
      });

      await prisma.inventoryItem.upsert({
        where: { variantId: varData.id },
        update: { availableQty: stock, reservedQty: 0, safetyStock: 2 },
        create: { variantId: varData.id, availableQty: stock, reservedQty: 0, safetyStock: 2 },
      });
    }
  }
  console.log(`[PASS] Upserted ${PRODUCTS.length} Products with Variants and Inventory`);

  // 4. Coupons
  for (const c of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log(`[PASS] Upserted ${COUPONS.length} Coupons`);

  // 5. Store Settings
  for (const s of SETTINGS) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`[PASS] Upserted ${SETTINGS.length} Store Settings`);

  // 6. Initial Seed Customer Account
  const customerPasswordHash = await hashPassword('Customer@1234');
  const seedCustomer = await prisma.user.upsert({
    where: { email: 'customer@nava-creations.in' },
    update: {
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
      name: 'Priya Sharma',
      phone: '+919876543210',
    },
    create: {
      email: 'customer@nava-creations.in',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
      name: 'Priya Sharma',
      phone: '+919876543210',
    },
  });

  // Seed Customer Address
  await prisma.customerAddress.upsert({
    where: { id: 'addr-seed-customer-01' },
    update: {
      userId: seedCustomer.id,
      addressLine1: '#42, 4th Cross, Indiranagar',
      landmark: 'Near 100ft Road',
      city: 'Bengaluru',
      stateName: 'Karnataka',
      stateCode: '29',
      postalCode: '560038',
      isDefault: true,
    },
    create: {
      id: 'addr-seed-customer-01',
      userId: seedCustomer.id,
      addressLine1: '#42, 4th Cross, Indiranagar',
      landmark: 'Near 100ft Road',
      city: 'Bengaluru',
      stateName: 'Karnataka',
      stateCode: '29',
      postalCode: '560038',
      isDefault: true,
    },
  });
  console.log('[PASS] Seed Customer Account created: customer@nava-creations.in (Password: Customer@1234)');

  // 7. Initial Seed Administrator Account
  const adminPasswordHash = await hashPassword('Admin@Nava2026!');
  await prisma.user.upsert({
    where: { email: 'admin@nava-creations.internal' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'STORE_MANAGER',
      isActive: true,
      name: 'Studio Owner & Manager',
      phone: '+919886000000',
    },
    create: {
      email: 'admin@nava-creations.internal',
      passwordHash: adminPasswordHash,
      role: 'STORE_MANAGER',
      isActive: true,
      name: 'Studio Owner & Manager',
      phone: '+919886000000',
    },
  });
  console.log('[PASS] Seed Administrator Account created: admin@nava-creations.internal (Password: Admin@Nava2026!)');

  console.log('\n=============================================================');
  console.log('PROTOTYPE DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('Database: nava_prototype_dev on PostgreSQL 16 (127.0.0.1:5432)');
  console.log('=============================================================');
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
