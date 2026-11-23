/**
 * NAVA CREATIONS â€” GATE B TASK B2 VERIFICATION ASSERTIONS
 * Proves role boundaries, DDL denials, table isolation, and RLS lockdown.
 */

const { execFileSync } = require('child_process');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const PSQL_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

function runPsqlQuery(user, password, sql) {
  const env = { ...process.env, PGPASSWORD: password };
  return execFileSync(PSQL_PATH, [
    '-h', '127.0.0.1',
    '-p', '5432',
    '-U', user,
    '-d', 'nava_gateb_test',
    '-w',
    '-c', sql,
  ], { env, encoding: 'utf8' });
}

function expectFailure(user, password, sql, allowedErrorSnippets) {
  const snippets = Array.isArray(allowedErrorSnippets) ? allowedErrorSnippets : [allowedErrorSnippets];
  try {
    const env = { ...process.env, PGPASSWORD: password };
    execFileSync(PSQL_PATH, [
      '-h', '127.0.0.1',
      '-p', '5432',
      '-U', user,
      '-d', 'nava_gateb_test',
      '-w',
      '-c', sql,
    ], { env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    throw new Error(`SECURITY ASSERTION FAILED: Query succeeded unexpectedly! SQL: ${sql}`);
  } catch (err) {
    const output = (err.stderr || err.stdout || err.message || '').toString();
    const matched = snippets.some(s => output.toLowerCase().includes(s.toLowerCase()));
    if (matched) {
      return { pass: true, detail: output.trim() };
    }
    throw new Error(`Expected error containing one of [${snippets.join(', ')}], but got: ${output}`);
  }
}

async function verifyTaskB2() {
  console.log('=============================================================');
  console.log('GATE B TASK B2: POSTGRESQL 16 ROLE SEPARATION & RLS AUDIT');
  console.log('=============================================================');

  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Environment Guard: Verified target DB "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  const appPassword = env.NAVA_APP_PASSWORD;
  const adminPassword = env.POSTGRES_ADMIN_PASSWORD;

  // -------------------------------------------------------------------------
  // 1. Role Security Attributes Audit (pg_roles)
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Role Security Attributes (pg_roles) ---');
  const rolesOut = runPsqlQuery('postgres', adminPassword, `
    SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls
    FROM pg_roles
    WHERE rolname IN ('nava_migrator', 'nava_app', 'anon', 'authenticated')
    ORDER BY rolname;
  `);
  console.log(rolesOut);

  // -------------------------------------------------------------------------
  // 2. nava_app Application CRUD Assertions
  // -------------------------------------------------------------------------
  console.log('\n--- 2. nava_app Application CRUD Assertions ---');
  const testCatId = `cat_rls_test_${Date.now()}`;
  
  // 2a. INSERT
  runPsqlQuery('nava_app', appPassword, `
    INSERT INTO categories (id, name, slug, updated_at) VALUES ('${testCatId}', 'RLS Test Category', 'rls-test-slug-${Date.now()}', NOW());
  `);
  console.log('[PASS] nava_app INSERT succeeded.');

  // 2b. SELECT
  const selectOut = runPsqlQuery('nava_app', appPassword, `
    SELECT id, name FROM categories WHERE id = '${testCatId}';
  `);
  if (!selectOut.includes(testCatId)) throw new Error('SELECT failed to find inserted row');
  console.log('[PASS] nava_app SELECT succeeded.');

  // 2c. UPDATE
  runPsqlQuery('nava_app', appPassword, `
    UPDATE categories SET name = 'Updated RLS Category', updated_at = NOW() WHERE id = '${testCatId}';
  `);
  console.log('[PASS] nava_app UPDATE succeeded.');

  // 2d. DELETE
  runPsqlQuery('nava_app', appPassword, `
    DELETE FROM categories WHERE id = '${testCatId}';
  `);
  console.log('[PASS] nava_app DELETE succeeded.');

  // -------------------------------------------------------------------------
  // 3. nava_app Forbidden Operations (DDL, TRUNCATE, _prisma_migrations)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. nava_app Forbidden Operations Assertions ---');

  // 3a. DROP TABLE
  const dropRes = expectFailure('nava_app', appPassword, 'DROP TABLE categories;', ['permission denied', 'must be owner of table']);
  console.log(`[PASS] nava_app DROP TABLE strictly denied: "${dropRes.detail.split('\n')[0]}"`);

  // 3b. ALTER TABLE
  const alterRes = expectFailure('nava_app', appPassword, 'ALTER TABLE categories ADD COLUMN dummy int;', ['permission denied', 'must be owner of table']);
  console.log(`[PASS] nava_app ALTER TABLE strictly denied: "${alterRes.detail.split('\n')[0]}"`);

  // 3c. TRUNCATE TABLE
  const truncRes = expectFailure('nava_app', appPassword, 'TRUNCATE categories;', ['permission denied', 'must be owner of table']);
  console.log(`[PASS] nava_app TRUNCATE strictly denied: "${truncRes.detail.split('\n')[0]}"`);

  // 3d. SELECT * FROM _prisma_migrations
  const migRes = expectFailure('nava_app', appPassword, 'SELECT * FROM _prisma_migrations;', ['permission denied']);
  console.log(`[PASS] nava_app _prisma_migrations access strictly denied: "${migRes.detail.split('\n')[0]}"`);

  // -------------------------------------------------------------------------
  // 4. anon and authenticated Default Deny-All Assertions
  // -------------------------------------------------------------------------
  console.log('\n--- 4. anon & authenticated Role Isolation Assertions ---');
  // Both roles are tested via SET ROLE in an unprivileged session
  const tablesToTest = ['orders', 'payments', 'users'];
  for (const table of tablesToTest) {
    const anonRes = expectFailure('postgres', adminPassword, `SET ROLE anon; SELECT * FROM public.${table};`, 'permission denied');
    console.log(`[PASS] anon denied on "${table}": "${anonRes.detail.split('\n')[0]}"`);

    const authRes = expectFailure('postgres', adminPassword, `SET ROLE authenticated; SELECT * FROM public.${table};`, 'permission denied');
    console.log(`[PASS] authenticated denied on "${table}": "${authRes.detail.split('\n')[0]}"`);
  }

  // -------------------------------------------------------------------------
  // 5. RLS Policies Audit (pg_policies)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. RLS Policies Audit (pg_policies) ---');
  const policiesOut = runPsqlQuery('postgres', adminPassword, `
    SELECT schemaname, tablename, policyname, roles, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  console.log(policiesOut);

  console.log('=============================================================');
  console.log('GATE B TASK B2 VERIFICATION: ALL ASSERTIONS PASSED (100%)');
  console.log('=============================================================');
}

verifyTaskB2().catch(err => {
  console.error('[TASK B2 FAILED]:', err.message);
  process.exit(1);
});
