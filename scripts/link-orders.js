const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://nava_app:3b2133a8b9865153e6060e2506b751c5b681821a801acc69e0924c419343b2ba@127.0.0.1:5432/nava_prototype_dev?schema=public'
    }
  }
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'customer@nava-creations.in' },
  });
  if (user) {
    const updated = await prisma.order.updateMany({
      data: { userId: user.id },
    });
    console.log('LINKED_ORDERS_COUNT:', updated.count);
  } else {
    console.log('Customer not found');
  }
  await prisma.$disconnect();
}
main();
