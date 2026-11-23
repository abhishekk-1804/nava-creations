const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

async function testPrisma() {
  console.log('--- Verifying Prisma Connectivity ---');
  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Target DB: ${guard.database} on ${guard.host}`);

  const env = loadEnvTest();

  console.log('Connecting via DIRECT_URL (nava_migrator)...');
  const migratorPrisma = new PrismaClient({ datasources: { db: { url: env.DIRECT_URL } } });
  try {
    const resM = await migratorPrisma.$queryRawUnsafe('SELECT current_user, current_database(), version();');
    console.log('[PASS] DIRECT_URL (nava_migrator) Connected Successfully:');
    console.log('       User:', resM[0].current_user);
    console.log('       Database:', resM[0].current_database);
    console.log('       Version:', resM[0].version.split(',')[0]);
  } finally {
    await migratorPrisma.$disconnect();
  }

  console.log('\nConnecting via DATABASE_URL (nava_app)...');
  const appPrisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  try {
    const resA = await appPrisma.$queryRawUnsafe('SELECT current_user, current_database();');
    console.log('[PASS] DATABASE_URL (nava_app) Connected Successfully:');
    console.log('       User:', resA[0].current_user);
    console.log('       Database:', resA[0].current_database);
  } finally {
    await appPrisma.$disconnect();
  }

  console.log('\n[PASS] All Prisma connectivity checks succeeded under isolated test roles.');
}

testPrisma().catch((err) => {
  console.error('[FAIL] Prisma connectivity error:', err.message);
  process.exit(1);
});
