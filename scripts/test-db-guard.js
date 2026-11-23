/**
 * NAVA CREATIONS — GATE B TEST DATABASE SAFETY GUARD
 * Enforces mandatory database identity and role separation checks before any test operation.
 * GUARANTEE: Zero credentials or connection strings containing passwords are ever logged.
 */

const fs = require('fs');
const path = require('path');

function loadEnvTest() {
  const envTestPath = path.resolve(__dirname, '..', '.env.test');
  if (!fs.existsSync(envTestPath)) {
    throw new Error(`SAFETY HALT: .env.test file not found at ${envTestPath}`);
  }

  const content = fs.readFileSync(envTestPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function parseDbUrl(urlStr, varName) {
  try {
    const parsed = new URL(urlStr);
    return {
      protocol: parsed.protocol,
      user: parsed.username,
      hasPassword: Boolean(parsed.password && parsed.password.trim() !== ''),
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, ''),
      // Password is intentionally omitted from the returned object
    };
  } catch (err) {
    throw new Error(`SAFETY HALT: Invalid ${varName} format: ${err.message}`);
  }
}

function verifyTestDatabaseSafeguards() {
  const env = loadEnvTest();

  // 1. Confirm NAVA_GATE_B_TEST_DB=true
  if (env.NAVA_GATE_B_TEST_DB !== 'true') {
    throw new Error('SAFETY HALT: NAVA_GATE_B_TEST_DB is not set to "true" in .env.test.');
  }

  const expectedHost = env.EXPECTED_TEST_DB_HOST || '127.0.0.1';
  const expectedDb = env.EXPECTED_TEST_DB_NAME || 'nava_gateb_test';

  // 2. Parse DATABASE_URL & DIRECT_URL (ensuring credentials are never exposed)
  if (!env.DATABASE_URL) throw new Error('SAFETY HALT: DATABASE_URL is missing in .env.test.');
  if (!env.DIRECT_URL) throw new Error('SAFETY HALT: DIRECT_URL is missing in .env.test.');

  const dbUrl = parseDbUrl(env.DATABASE_URL, 'DATABASE_URL');
  const directUrl = parseDbUrl(env.DIRECT_URL, 'DIRECT_URL');

  // 3. Verify connection hosts
  const allowedHosts = [expectedHost, 'localhost', '127.0.0.1'];
  if (!allowedHosts.includes(dbUrl.host)) {
    throw new Error(`SAFETY HALT: DATABASE_URL host (${dbUrl.host}) does not match expected test host (${expectedHost}).`);
  }
  if (!allowedHosts.includes(directUrl.host)) {
    throw new Error(`SAFETY HALT: DIRECT_URL host (${directUrl.host}) does not match expected test host (${expectedHost}).`);
  }

  // 4. Verify target databases
  if (dbUrl.database !== expectedDb) {
    throw new Error(`SAFETY HALT: DATABASE_URL target database (${dbUrl.database}) is NOT ${expectedDb}.`);
  }
  if (directUrl.database !== expectedDb) {
    throw new Error(`SAFETY HALT: DIRECT_URL target database (${directUrl.database}) is NOT ${expectedDb}.`);
  }

  // 5. Enforce Strict Role Separation (Mandate Points 1 & 2)
  if (dbUrl.user === 'postgres' || directUrl.user === 'postgres') {
    throw new Error('SAFETY HALT: The postgres superuser must NEVER be used in DATABASE_URL or DIRECT_URL. Use nava_app and nava_migrator.');
  }
  if (dbUrl.user !== 'nava_app') {
    throw new Error(`SAFETY HALT: DATABASE_URL user must be "nava_app" (found: "${dbUrl.user}").`);
  }
  if (directUrl.user !== 'nava_migrator') {
    throw new Error(`SAFETY HALT: DIRECT_URL user must be "nava_migrator" (found: "${directUrl.user}").`);
  }

  return {
    status: 'VALID',
    database: expectedDb,
    host: expectedHost,
    runtimeRole: dbUrl.user,
    migrationRole: directUrl.user,
  };
}

module.exports = {
  loadEnvTest,
  parseDbUrl,
  verifyTestDatabaseSafeguards,
};

if (require.main === module) {
  try {
    const res = verifyTestDatabaseSafeguards();
    console.log('SAFETY CHECK RESULT: VALID');
    console.log(`Database: ${res.database}`);
    console.log(`Host: ${res.host}`);
    console.log(`Runtime Role: ${res.runtimeRole}`);
    console.log(`Migration Role: ${res.migrationRole}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
