const { execFileSync } = require('child_process');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const PSQL_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

function applyUtrPartialIndex() {
  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Environment Guard: Verified target DB "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  const sql = `
    CREATE UNIQUE INDEX IF NOT EXISTS "payments_claimed_utr_verified_unique" 
    ON "payments" ("claimed_utr") 
    WHERE "status" = 'VERIFIED'::"PaymentStatus" AND "claimed_utr" IS NOT NULL;
  `;

  execFileSync(PSQL_PATH, ['-h', '127.0.0.1', '-U', 'nava_migrator', '-d', 'nava_gateb_test', '-w', '-c', sql], {
    env: { ...process.env, PGPASSWORD: env.NAVA_MIGRATOR_PASSWORD },
    encoding: 'utf8',
  });
  console.log('[PASS] Partial unique index "payments_claimed_utr_verified_unique" active.');
}

if (require.main === module) {
  applyUtrPartialIndex();
}
