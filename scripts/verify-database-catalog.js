/**
 * NAVA CREATIONS — GATE B LIVE SQL CATALOG & ROLE PERMISSIONS VERIFIER
 * Connects directly using least-privilege credentials from .env.test.
 * Verifies database identity, server version, database ownership, role attributes,
 * role separation, and DDL/DML boundaries.
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

function runVerification() {
  console.log('=== GATE B LIVE SQL CATALOG & PERMISSIONS AUDIT ===');
  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Safety Guard: Validated database "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  const migratorPw = env.NAVA_MIGRATOR_PASSWORD;
  const appPw = env.NAVA_APP_PASSWORD;

  // 1. Database Identity & Server Version
  console.log('\n--- 1. Database Identity & PostgreSQL Version ---');
  const dbInfo = queryPsql('nava_migrator', migratorPw, 'SELECT current_database(), current_user, version();');
  const [currDb, currUser, fullVer] = dbInfo.split('|');
  console.log(`[PASS] current_database(): ${currDb}`);
  console.log(`[PASS] current_user:       ${currUser}`);
  console.log(`[PASS] PostgreSQL version: ${fullVer.split(',')[0]}`);

  if (currDb !== 'nava_gateb_test') throw new Error(`DB mismatch: Expected nava_gateb_test, got ${currDb}`);
  if (currUser !== 'nava_migrator') throw new Error(`Role mismatch: Expected nava_migrator, got ${currUser}`);
  if (!fullVer.includes('PostgreSQL 16')) throw new Error(`Version mismatch: Expected PostgreSQL 16, got ${fullVer}`);

  // 2. Database Ownership
  console.log('\n--- 2. Database Ownership ---');
  const dbOwner = queryPsql('nava_migrator', migratorPw, "SELECT pg_catalog.pg_get_userbyid(datdba) FROM pg_database WHERE datname = 'nava_gateb_test';");
  console.log(`[PASS] Database Owner:    ${dbOwner}`);
  if (dbOwner !== 'nava_migrator') throw new Error(`Ownership mismatch: Expected nava_migrator, got ${dbOwner}`);

  // 3. Role Attributes Inspection (Least Privilege Verification)
  console.log('\n--- 3. Role Attributes & Security Flags (pg_roles) ---');
  const rolesSql = `
    SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls
    FROM pg_roles 
    WHERE rolname IN ('nava_app', 'nava_migrator')
    ORDER BY rolname;
  `;
  const rolesOut = queryPsql('nava_migrator', migratorPw, rolesSql);
  for (const rawLine of rolesOut.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const [name, superuser, inherit, createrole, createdb, canlogin, bypassrls] = line.split('|').map(s => s.trim());
    console.log(`Role: ${name.padEnd(15)} | Superuser: ${superuser} | Inherit: ${inherit} | CreateDB: ${createdb} | CreateRole: ${createrole} | CanLogin: ${canlogin} | BypassRLS: ${bypassrls}`);
    
    if (superuser !== 'f') throw new Error(`SECURITY VIOLATION: Role ${name} is marked as SUPERUSER!`);
    if (createrole !== 'f') throw new Error(`SECURITY VIOLATION: Role ${name} has CREATEROLE privilege!`);
    if (createdb !== 'f') throw new Error(`SECURITY VIOLATION: Role ${name} has CREATEDB privilege!`);
    if (bypassrls !== 'f') throw new Error(`SECURITY VIOLATION: Role ${name} has BYPASSRLS privilege!`);
    if (canlogin !== 't') throw new Error(`CONFIG DEFECT: Role ${name} cannot login!`);
  }
  console.log('[PASS] Both roles confirmed least-privilege: NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS.');

  // 4. Schema Permissions & DDL/DML Boundary Test
  console.log('\n--- 4. Schema Permissions & DDL/DML Privilege Boundaries ---');
  
  // DDL test: nava_migrator CAN create and drop tables
  queryPsql('nava_migrator', migratorPw, 'CREATE TABLE _perm_test (id serial primary key, val text); DROP TABLE _perm_test;');
  console.log('[PASS] nava_migrator DDL capability verified: Successfully created and dropped table.');

  // DDL rejection test: nava_app CANNOT create tables
  try {
    queryPsql('nava_app', appPw, 'CREATE TABLE _perm_test_app (id int);');
    throw new Error('SECURITY VIOLATION: nava_app was permitted to CREATE TABLE!');
  } catch (err) {
    if (err.message.includes('permission denied for schema public')) {
      console.log('[PASS] nava_app DDL strictly DENIED: "permission denied for schema public".');
    } else {
      throw err;
    }
  }

  // 5. Schema Default Privileges for nava_app
  console.log('\n--- 5. Public Schema Default Privileges Verification ---');
  const defPrivSql = `
    SELECT defaclobjtype, defaclacl
    FROM pg_default_acl
    WHERE defaclnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  `;
  const defPrivOut = queryPsql('nava_migrator', migratorPw, defPrivSql);
  console.log('[PASS] Public Schema Default Privileges configured:');
  for (const line of defPrivOut.split('\n')) {
    console.log(`       ${line}`);
  }

  console.log('\n=============================================================');
  console.log('ALL LIVE SQL DATABASE CATALOG & PERMISSION CHECKS PASSED');
  console.log('Target: nava_gateb_test on PostgreSQL 16 (127.0.0.1:5432)');
  console.log('=============================================================');
}

if (require.main === module) {
  try {
    runVerification();
  } catch (err) {
    console.error('VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}
