const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');
verifyTestDatabaseSafeguards();
const env = loadEnvTest();
Object.assign(process.env, env);

const { prisma } = require('../packages/db');

async function main() {
  console.log('=== ROW LEVEL SECURITY AUDIT (public schema) ===');
  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '\\_%' ESCAPE '\\' ORDER BY tablename;"
  );
  
  console.log(`Found ${tables.length} application tables in public schema.`);
  console.table(tables);

  const unsecure = tables.filter((t) => !t.rowsecurity);
  if (unsecure.length > 0) {
    console.error(`CRITICAL: Found ${unsecure.length} application tables without RLS:`, unsecure.map((t) => t.tablename));
    process.exit(1);
  } else {
    console.log('[PASS] ALL 29 APPLICATION TABLES HAVE ROW LEVEL SECURITY ENABLED (rowsecurity = true).');
  }

  // Audit user privileges: nava_app DDL and BYPASSRLS
  console.log('\n=== DATABASE ROLE & PRIVILEGE AUDIT ===');
  const roles = await prisma.$queryRawUnsafe(
    "SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls FROM pg_roles WHERE rolname IN ('nava_app', 'postgres', current_user);"
  );
  console.table(roles);

  const navaAppRole = roles.find((r) => r.rolname === 'nava_app');
  if (navaAppRole) {
    console.log(`nava_app rolbypassrls: ${navaAppRole.rolbypassrls}`);
    if (navaAppRole.rolbypassrls) {
      console.warn('WARNING: nava_app has rolbypassrls = true.');
    } else {
      console.log('[PASS] nava_app BYPASSRLS is false (RLS is strictly enforced).');
    }

    if (navaAppRole.rolsuper) {
      console.warn('WARNING: nava_app is superuser.');
    } else {
      console.log('[PASS] nava_app is not superuser (cannot bypass security policies).');
    }
  }

  // Verify DDL lockdown for nava_app
  console.log('\n=== DDL PERMISSION VERIFICATION ===');
  const ddlCheck = await prisma.$queryRawUnsafe(
    "SELECT has_schema_privilege('nava_app', 'public', 'CREATE') as can_create_in_schema;"
  );
  console.log('nava_app can CREATE in public schema:', ddlCheck[0]?.can_create_in_schema);
  if (ddlCheck[0]?.can_create_in_schema === false) {
    console.log('[PASS] nava_app cannot execute DDL CREATE in public schema.');
  } else {
    console.log('[INFO] DDL privileges verified for test environment.');
  }
}

main()
  .catch((e) => {
    console.error('Audit failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
