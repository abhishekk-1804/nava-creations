/**
 * NAVA CREATIONS â€” GATE B TASK B3 INTEGRATION RUNNER
 * Runs packages/db/tests/integration/postgres-real.integration.ts against nava_gateb_test.
 */

const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

async function main() {
  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Guard: Verified test DB "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  process.env.DATABASE_URL = env.DATABASE_URL;
  process.env.DIRECT_URL = env.DIRECT_URL;

  // Dynamically import the integration suite using Node's ts module loader
  const { runPostgresIntegrationSuite } = await import('../packages/db/tests/integration/postgres-real.integration.ts');
  const summary = await runPostgresIntegrationSuite();

  if (summary.failed > 0) {
    console.error(`\n[FAIL] ${summary.failed} tests failed in postgres-real.integration.ts`);
    process.exit(1);
  } else {
    console.log(`\n[PASS] All ${summary.passed} tests passed cleanly in postgres-real.integration.ts`);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
