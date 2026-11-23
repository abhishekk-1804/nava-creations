/**
 * NAVA CREATIONS — GATE B MIGRATION DEPLOYER
 * Executes Prisma migrations strictly against isolated test database nava_gateb_test.
 * Uses DIRECT_URL (nava_migrator) for DDL table creation and migration recording.
 * 
 * NEVER prints credentials or connection strings.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

function deployMigrations() {
  console.log('=== GATE B PRISMA MIGRATION DEPLOYMENT ===');
  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Safety Guard Confirmed: Target DB "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  const repoRoot = path.resolve(__dirname, '..');
  const schemaPath = path.resolve(repoRoot, 'packages', 'db', 'prisma', 'schema.prisma');

  // Verify schema exists
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at: ${schemaPath}`);
  }

  // Configure environment strictly for migration execution under nava_migrator
  const execEnv = {
    ...process.env,
    NODE_ENV: 'test',
    SKIP_ENV_VALIDATION: 'true',
    DATABASE_URL: env.DIRECT_URL,
    DIRECT_URL: env.DIRECT_URL,
    PRISMA_TELEMETRY_INFORMATION_ENABLED: '0',
    CHECKPOINT_DISABLE: '1',
  };

  const prismaBin = process.platform === 'win32'
    ? (fs.existsSync(path.resolve(repoRoot, 'packages', 'db', 'node_modules', '.bin', 'prisma.cmd'))
        ? path.resolve(repoRoot, 'packages', 'db', 'node_modules', '.bin', 'prisma.cmd')
        : path.resolve(repoRoot, 'node_modules', '.bin', 'prisma.cmd'))
    : path.resolve(repoRoot, 'packages', 'db', 'node_modules', '.bin', 'prisma');

  console.log('Deploying migrations using nava_migrator via DIRECT_URL...');
  const args = ['migrate', 'deploy', '--schema', schemaPath];

  try {
    const output = execFileSync(prismaBin, args, {
      env: execEnv,
      cwd: repoRoot,
      encoding: 'utf8',
      shell: true,
    });
    console.log('[OUTPUT]\n' + output.trim());
    console.log('\n[PASS] Prisma migrate deploy completed successfully.');
  } catch (err) {
    console.error('Migration deployment failed:', err.stdout || err.stderr || err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deployMigrations();
}
