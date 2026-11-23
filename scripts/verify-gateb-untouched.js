const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');

// Connect as nava_migrator to read-only inspect nava_gateb_test
const prismaGateB = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://nava_migrator:8ba4fe80dc179e93d85c445985eb0ec11cd6e967aff9ba74c5255f0b788484f8@127.0.0.1:5432/nava_gateb_test?schema=public'
    }
  }
});

async function main() {
  const migrations = await prismaGateB.$queryRaw`
    SELECT id, migration_name, finished_at 
    FROM _prisma_migrations 
    ORDER BY finished_at DESC;
  `;
  console.log('GATE_B_MIGRATION_COUNT:', migrations.length);
  console.log('GATE_B_LATEST_MIGRATION:', migrations[0]?.migration_name);
  console.log('GATE_B_LATEST_MIGRATION_FINISHED_AT:', migrations[0]?.finished_at);

  const tables = await prismaGateB.$queryRaw`
    SELECT count(*)::int as count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `;
  console.log('GATE_B_TABLE_COUNT:', tables[0]?.count);

  await prismaGateB.$disconnect();
}

main().catch(err => {
  console.error('GATE_B_CHECK_ERROR:', err.message);
  process.exit(1);
});
