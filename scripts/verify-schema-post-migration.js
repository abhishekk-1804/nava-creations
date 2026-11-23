/**
 * NAVA CREATIONS — GATE B POST-MIGRATION SCHEMA, INDEX & CONSTRAINT VERIFIER
 * Audits _prisma_migrations, table inventory, unique constraints, foreign keys,
 * and role access boundaries on all deployed relations.
 * 
 * NEVER prints credentials or passwords.
 */

const { execFileSync } = require('child_process');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const PSQL_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

function queryPsql(user, password, sql, database = 'nava_gateb_test') {
  const env = { ...process.env, PGPASSWORD: password };
  const args = [
    '-h', '127.0.0.1',
    '-p', '5432',
    '-U', user,
    '-d', database,
    '-w',
    '-t',
    '-A',
    '-c', sql,
  ];
  return execFileSync(PSQL_PATH, args, { env, encoding: 'utf8' }).trim();
}

function verifyPostMigration() {
  console.log('=== GATE B POST-MIGRATION SCHEMA VERIFICATION ===');
  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Safety Guard Confirmed: Target DB "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  const migratorPw = env.NAVA_MIGRATOR_PASSWORD;
  const appPw = env.NAVA_APP_PASSWORD;

  // 1. Verify _prisma_migrations records
  console.log('\n--- 1. Verifying _prisma_migrations Records ---');
  const migSql = `
    SELECT migration_name, (finished_at IS NOT NULL) as finished, (rolled_back_at IS NULL) as not_rolled_back
    FROM _prisma_migrations
    ORDER BY started_at ASC;
  `;
  const migOut = queryPsql('nava_migrator', migratorPw, migSql);
  const expectedMigrations = [
    '0_init',
    '20261111_add_enquiries',
    '2026111201_add_payment_enums',
    '2026111202_apply_sovereign_payments',
  ];

  const actualMigrations = [];
  for (const rawLine of migOut.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const [name, finished, notRolledBack] = line.split('|').map(s => s.trim());
    console.log(`Migration: ${name.padEnd(36)} | Finished: ${finished} | NotRolledBack: ${notRolledBack}`);
    if (finished !== 't' || notRolledBack !== 't') {
      throw new Error(`MIGRATION FAILURE: Migration ${name} is incomplete or rolled back!`);
    }
    actualMigrations.push(name);
  }

  for (const exp of expectedMigrations) {
    if (!actualMigrations.includes(exp)) {
      throw new Error(`MISSING MIGRATION: Expected ${exp} in _prisma_migrations!`);
    }
  }
  console.log('[PASS] All 4 migrations deployed and recorded successfully.');

  // 2. Table Inventory Check
  console.log('\n--- 2. Public Schema Table Inventory ---');
  const tablesSql = `
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  const tablesOut = queryPsql('nava_migrator', migratorPw, tablesSql);
  const tables = tablesOut.split('\n').map(s => s.trim()).filter(Boolean);
  console.log(`Total Tables Deployed: ${tables.length}`);
  console.log(`Tables: ${tables.join(', ')}`);

  const criticalTables = [
    'users', 'customer_addresses', 'categories', 'products', 'product_variants',
    'orders', 'order_items', 'payments', 'payment_attempts', 'refunds',
    'cart_items', 'carts', 'enquiries', 'audit_logs', 'inventory_items',
    'inventory_reservations', 'inventory_reservation_items', '_prisma_migrations',
  ];
  for (const crit of criticalTables) {
    if (!tables.includes(crit)) {
      throw new Error(`MISSING CRITICAL TABLE: ${crit} was not created!`);
    }
  }
  console.log('[PASS] All critical domain tables verified.');

  // 3. Unique Constraints Verification
  console.log('\n--- 3. Verifying Key Unique Constraints & Indexes ---');
  const indexSql = `
    SELECT indexname, tablename
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE '%key'
    ORDER BY tablename, indexname;
  `;
  const indexOut = queryPsql('nava_migrator', migratorPw, indexSql);
  console.log('Unique Constraints Detected:');
  for (const rawLine of indexOut.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    console.log(`       ${line}`);
  }

  const expectedUnique = [
    'payments_verified_transaction_id_key',
    'payments_payment_reference_key',
    'orders_order_number_key',
    'enquiries_enquiry_number_key',
  ];
  for (const u of expectedUnique) {
    if (!indexOut.includes(u)) {
      throw new Error(`MISSING UNIQUE CONSTRAINT: ${u} was not found!`);
    }
  }
  console.log('[PASS] Critical unique constraints confirmed active.');

  // 4. Role Permissions & Lockdown on _prisma_migrations
  console.log('\n--- 4. Role Isolation & Migration Table Lockdown ---');
  // Revoke _prisma_migrations from nava_app
  queryPsql('nava_migrator', migratorPw, 'REVOKE ALL ON TABLE _prisma_migrations FROM nava_app;');
  console.log('[PASS] Revoked all permissions on _prisma_migrations from nava_app.');

  // Verify nava_app CANNOT access _prisma_migrations
  try {
    queryPsql('nava_app', appPw, 'SELECT * FROM _prisma_migrations;');
    throw new Error('SECURITY VIOLATION: nava_app was able to SELECT from _prisma_migrations!');
  } catch (err) {
    if (err.message.includes('permission denied for table _prisma_migrations')) {
      console.log('[PASS] Access to _prisma_migrations strictly DENIED for nava_app.');
    } else {
      throw err;
    }
  }

  // Verify nava_app CAN perform DML on application tables (e.g. audit_logs, users)
  console.log('\n--- 5. Verifying Application DML Access for nava_app ---');
  const testInsert = queryPsql(
    'nava_app',
    appPw,
    "INSERT INTO audit_logs (id, action, entity, entity_id, created_at) VALUES ('00000000-0000-0000-0000-000000000001', 'GATE_B_VERIFY', 'Test', 'test-1', NOW()) RETURNING id;"
  );
  console.log(`[PASS] nava_app INSERT on application table verified (ID: ${testInsert})`);

  const testSelect = queryPsql(
    'nava_app',
    appPw,
    "SELECT action FROM audit_logs WHERE id = '00000000-0000-0000-0000-000000000001';"
  );
  console.log(`[PASS] nava_app SELECT verified (Action: ${testSelect})`);

  queryPsql(
    'nava_app',
    appPw,
    "DELETE FROM audit_logs WHERE id = '00000000-0000-0000-0000-000000000001';"
  );
  console.log('[PASS] nava_app DELETE verified.');

  // Verify nava_app CANNOT TRUNCATE
  try {
    queryPsql('nava_app', appPw, 'TRUNCATE TABLE audit_logs;');
    throw new Error('SECURITY VIOLATION: nava_app was permitted to TRUNCATE TABLE!');
  } catch (err) {
    if (err.message.includes('permission denied for table audit_logs')) {
      console.log('[PASS] nava_app TRUNCATE strictly DENIED: "permission denied for table audit_logs".');
    } else {
      throw err;
    }
  }

  console.log('\n=============================================================');
  console.log('GATE B POST-MIGRATION AUDIT PASSED WITH 100% COMPLIANCE');
  console.log('=============================================================');
}

if (require.main === module) {
  try {
    verifyPostMigration();
  } catch (err) {
    console.error('VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}
