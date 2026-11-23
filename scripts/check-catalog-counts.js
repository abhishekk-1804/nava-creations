const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const { loadEnvTest } = require('./test-db-guard');

async function main() {
  const env = loadEnvTest();
  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  try {
    const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log('Available models on Prisma:', keys.join(', '));
    for (const model of ['user', 'product', 'productVariant', 'inventoryItem', 'order', 'coupon', 'enquiry']) {
      if (prisma[model]) {
        const count = await prisma[model].count();
        console.log(`- ${model.padEnd(20)}: ${count}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
