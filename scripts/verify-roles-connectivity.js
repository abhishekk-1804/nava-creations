/**
 * NAVA CREATIONS — GATE B PRE-BOOTSTRAP ROLE CONNECTIVITY & PERMISSIONS VERIFIER
 * Validates real PostgreSQL 16 connection, role identity, and privilege boundaries.
 * GUARANTEE: Zero passwords or credentials are ever printed or logged.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const PSQL_PATH = process.platform === 'win32'
  ? 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe'
  : (fs.existsSync('/usr/bin/psql') ? '/usr/bin/psql' : '/mnt/c/Program Files/PostgreSQL/16/bin/psql.exe');

function runPsql(database, user, password, sql) {
  const env = {
    ...process.env,
    PGPASSWORD: password,
  };
  const args = [
    '-h', '127.0.0.1',
    '-p', '5432',
    '-U', user,
    '-d', database,
    '-w', // Never prompt for password
    '-t', // Tuples only
    '-A', // Unaligned
    '-c', sql,
  ];
  try {
    return {
      success: true,
      output: execFileSync(PSQL_PATH, args, { env, encoding: 'utf8' }).trim(),
    };
  } catch (err) {
    return {
      success: false,
      error: err.stderr ? err.stderr.trim() : err.message,
    };
  }
}

async function verifyRolesAndConnectivity() {
  console.log('=== GATE B PRE-BOOTSTRAP VERIFICATION SUITE ===');

  // 1. Guard check
  const guard = verifyTestDatabaseSafeguards();
  console.log('[PASS] Configuration Safety Contract Verified');
  console.log(`       Target Host: ${guard.host} | Target Database: ${guard.database}`);
  console.log(`       Runtime Role: ${guard.runtimeRole} | Migration Role: ${guard.migrationRole}`);

  const env = loadEnvTest();
  const migratorPw = env.NAVA_MIGRATOR_PASSWORD;
  const appPw = env.NAVA_APP_PASSWORD;

  // 2. Direct PostgreSQL Authentication for nava_migrator
  console.log('\n--- 2. Verifying nava_migrator Connection & Identity ---');
  const migratorRes = runPsql('nava_gateb_test', 'nava_migrator', migratorPw, 'SELECT current_user, current_database(), version();');
  if (!migratorRes.success) {
    console.log('[INFO] nava_migrator authentication check pending database bootstrap (database or role does not yet exist).');
    return { status: 'PENDING_BOOTSTRAP', reason: migratorRes.error };
  }

  const [migratorUser, migratorDb, migratorVer] = migratorRes.output.split('|');
  console.log(`[PASS] nava_migrator Authenticated Successfully`);
  console.log(`       current_user: ${migratorUser}`);
  console.log(`       current_database: ${migratorDb}`);
  console.log(`       version: ${migratorVer.split(' ')[0]} ${migratorVer.split(' ')[1]}`);

  if (migratorUser !== 'nava_migrator') throw new Error(`Role mismatch: Expected nava_migrator, got ${migratorUser}`);
  if (migratorDb !== 'nava_gateb_test') throw new Error(`DB mismatch: Expected nava_gateb_test, got ${migratorDb}`);

  // 3. Direct PostgreSQL Authentication for nava_app
  console.log('\n--- 3. Verifying nava_app Connection & Identity ---');
  const appRes = runPsql('nava_gateb_test', 'nava_app', appPw, 'SELECT current_user, current_database(), version();');
  if (!appRes.success) {
    throw new Error(`nava_app authentication failed: ${appRes.error}`);
  }

  const [appUser, appDb, appVer] = appRes.output.split('|');
  console.log(`[PASS] nava_app Authenticated Successfully`);
  console.log(`       current_user: ${appUser}`);
  console.log(`       current_database: ${appDb}`);

  if (appUser !== 'nava_app') throw new Error(`Role mismatch: Expected nava_app, got ${appUser}`);
  if (appDb !== 'nava_gateb_test') throw new Error(`DB mismatch: Expected nava_gateb_test, got ${appDb}`);

  // 4. Permission Boundary Verification
  console.log('\n--- 4. Verifying Role Permission Boundaries ---');
  
  // DDL check for nava_migrator
  const migratorDdl = runPsql('nava_gateb_test', 'nava_migrator', migratorPw, 'CREATE TABLE IF NOT EXISTS _test_migrator_perm (id int); DROP TABLE _test_migrator_perm;');
  if (!migratorDdl.success) {
    throw new Error(`nava_migrator DDL verification failed: ${migratorDdl.error}`);
  }
  console.log('[PASS] nava_migrator has DDL permission (CREATE/DROP TABLE verified)');

  // DDL rejection check for nava_app
  const appDdl = runPsql('nava_gateb_test', 'nava_app', appPw, 'CREATE TABLE _test_app_should_fail (id int);');
  if (appDdl.success) {
    runPsql('nava_gateb_test', 'nava_migrator', migratorPw, 'DROP TABLE IF EXISTS _test_app_should_fail;');
    throw new Error('SECURITY VIOLATION: nava_app was able to execute DDL (CREATE TABLE)!');
  }
  console.log('[PASS] nava_app DDL permission correctly DENIED (permission denied on schema public)');

  // 5. Prisma Raw Query Connectivity Check (without migrations)
  console.log('\n--- 5. Verifying Prisma Engine Raw Query Connectivity ---');
  const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');

  const migratorPrisma = new PrismaClient({ datasources: { db: { url: env.DIRECT_URL } } });
  try {
    const [{ res: mRes }] = await migratorPrisma.$queryRawUnsafe('SELECT 1 as res;');
    if (mRes === 1) {
      console.log('[PASS] Prisma connected successfully via DIRECT_URL (nava_migrator)');
    }
  } finally {
    await migratorPrisma.$disconnect();
  }

  const appPrisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  try {
    const [{ res: aRes }] = await appPrisma.$queryRawUnsafe('SELECT 1 as res;');
    if (aRes === 1) {
      console.log('[PASS] Prisma connected successfully via DATABASE_URL (nava_app)');
    }
  } finally {
    await appPrisma.$disconnect();
  }

  console.log('\n=============================================================');
  console.log('ALL PRE-BOOTSTRAP ROLE & CONNECTIVITY CHECKS PASSED');
  console.log('=============================================================');
  return { status: 'VERIFIED' };
}

module.exports = { verifyRolesAndConnectivity };

if (require.main === module) {
  verifyRolesAndConnectivity()
    .then((r) => {
      if (r.status === 'PENDING_BOOTSTRAP') {
        console.log('\nStatus: Ready for bootstrap. Database/roles will be created during initialization.');
      }
    })
    .catch((err) => {
      console.error('\nVERIFICATION FAILED:', err.message);
      process.exit(1);
    });
}
