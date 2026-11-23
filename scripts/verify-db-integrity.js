const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://nava_app:3b2133a8b9865153e6060e2506b751c5b681821a801acc69e0924c419343b2ba@127.0.0.1:5432/nava_prototype_dev?schema=public'
    }
  }
});

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC;
  `;
  console.log(`TOTAL_TABLES_COUNT: ${tables.length}`);
  console.log('TABLES:', tables.map(t => t.table_name).join(', '));

  const [users, products, orders, payments, addresses] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.customerAddress.count()
  ]);

  console.log(`RECORD_COUNTS: Users=${users}, Products=${products}, Orders=${orders}, Payments=${payments}, Addresses=${addresses}`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
