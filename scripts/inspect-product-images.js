const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://nava_app:3b2133a8b9865153e6060e2506b751c5b681821a801acc69e0924c419343b2ba@127.0.0.1:5432/nava_prototype_dev?schema=public'
    }
  }
});

async function main() {
  const images = await prisma.productImage.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    },
    orderBy: { displayOrder: 'asc' }
  });

  console.log(`TOTAL_PRODUCT_IMAGES: ${images.length}`);
  for (const img of images) {
    console.log(JSON.stringify({
      id: img.id,
      productId: img.productId,
      productName: img.product?.name,
      productSlug: img.product?.slug,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder
    }, null, 2));
  }

  const collections = await prisma.collection.findMany({
    select: { id: true, name: true, slug: true, coverImageUrl: true }
  });
  console.log('\nCOLLECTIONS:');
  for (const c of collections) {
    console.log(JSON.stringify(c, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
