const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const { loadEnvTest } = require('./test-db-guard');

async function main() {
  const env = loadEnvTest();
  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  try {
    const o = await prisma.order.findUnique({ where: { orderNumber: 'NAV-2026-8821' } });
    console.log('Order NAV-2026-8821 in DB:', o ? { status: o.status, total: o.totalPaise } : 'NOT FOUND');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
