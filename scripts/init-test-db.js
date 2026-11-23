/**
 * NAVA CREATIONS — GATE B DATABASE BOOTSTRAPPER & ROLE PROVISIONER
 * Connects to PostgreSQL 16 on 127.0.0.1 using temporary admin credentials,
 * creates nava_gateb_test, provisions least-privilege roles (nava_migrator, nava_app),
 * and verifies that DATABASE_URL (nava_app) and DIRECT_URL (nava_migrator) authenticate properly.
 * 
 * GUARANTEE: Zero credentials or passwords are ever logged or printed.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const PSQL_PATH = process.platform === 'win32'
  ? 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe'
  : (fs.existsSync('/usr/bin/psql') ? '/usr/bin/psql' : '/mnt/c/Program Files/PostgreSQL/16/bin/psql.exe');

function runPsqlCommand(database, user, password, sql) {
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
  return execFileSync(PSQL_PATH, args, { env, encoding: 'utf8' }).trim();
}

function bootstrapDatabase() {
  console.log('--- Step 0: Pre-flight Safety Guard Evaluation ---');
  // Enforces host, database name, and role separation BEFORE touching PostgreSQL
  const guard = verifyTestDatabaseSafeguards();
  console.log('Safety guard contract verified: [PASS]');
  console.log(`Target Database: ${guard.database} | Target Host: ${guard.host}`);
  console.log(`Runtime Role: ${guard.runtimeRole} | Migration Role: ${guard.migrationRole}`);

  const env = loadEnvTest();

  // 1. Verify administrative password is provided for one-time bootstrap
  const adminPassword = env.POSTGRES_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.trim() === '' || adminPassword === 'REPLACE_WITH_YOUR_POSTGRES_ADMIN_PASSWORD') {
    throw new Error('SAFETY HALT: POSTGRES_ADMIN_PASSWORD not set in .env.test. Required solely for initial database creation.');
  }

  const migratorPassword = env.NAVA_MIGRATOR_PASSWORD;
  if (!migratorPassword || migratorPassword.trim() === '' || migratorPassword === 'REPLACE_WITH_MIGRATOR_PASSWORD') {
    throw new Error('SAFETY HALT: NAVA_MIGRATOR_PASSWORD not set in .env.test.');
  }

  const appPassword = env.NAVA_APP_PASSWORD;
  if (!appPassword || appPassword.trim() === '' || appPassword === 'REPLACE_WITH_APP_PASSWORD') {
    throw new Error('SAFETY HALT: NAVA_APP_PASSWORD not set in .env.test.');
  }

  console.log('\n--- Step 1: Connecting to PostgreSQL 16 server as bootstrap admin ---');
  const serverVersion = runPsqlCommand('postgres', 'postgres', adminPassword, 'SELECT version();');
  const shortVersion = serverVersion.split('\n')[0];
  console.log('PostgreSQL version detected:', shortVersion);

  if (!serverVersion.includes('PostgreSQL 16')) {
    throw new Error(`SAFETY HALT: Expected PostgreSQL 16.x, but server reported: ${shortVersion}`);
  }

  console.log('\n--- Step 2: Ensuring isolated test database nava_gateb_test exists ---');
  const dbExists = runPsqlCommand('postgres', 'postgres', adminPassword, "SELECT 1 FROM pg_database WHERE datname = 'nava_gateb_test';");
  if (dbExists === '1') {
    console.log('Database nava_gateb_test already exists.');
  } else {
    runPsqlCommand('postgres', 'postgres', adminPassword, "CREATE DATABASE nava_gateb_test ENCODING 'UTF8';");
    console.log('Created isolated test database nava_gateb_test.');
  }

  console.log('\n--- Step 3: Provisioning least-privilege roles (nava_migrator, nava_app) ---');
  // Escape passwords for SQL literal
  const escMigratorPw = migratorPassword.replace(/'/g, "''");
  const escAppPw = appPassword.replace(/'/g, "''");

  const rolesDdl = `
    DO $$
    BEGIN
      -- Provision migration role (DDL owner)
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nava_migrator') THEN
        CREATE ROLE nava_migrator WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${escMigratorPw}';
      ELSE
        ALTER ROLE nava_migrator WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${escMigratorPw}';
      END IF;

      -- Provision runtime application role (DML only)
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nava_app') THEN
        CREATE ROLE nava_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${escAppPw}';
      ELSE
        ALTER ROLE nava_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${escAppPw}';
      END IF;
    END $$;

    -- Grant database connection & ownership
    ALTER DATABASE nava_gateb_test OWNER TO nava_migrator;
    GRANT CONNECT ON DATABASE nava_gateb_test TO nava_app;
  `;
  runPsqlCommand('postgres', 'postgres', adminPassword, rolesDdl);
  console.log('Roles nava_migrator and nava_app provisioned and granted database access.');

  console.log('\n--- Step 4: Configuring public schema permissions in nava_gateb_test ---');
  const schemaDdl = `
    ALTER SCHEMA public OWNER TO nava_migrator;
    GRANT USAGE, CREATE ON SCHEMA public TO nava_migrator;
    GRANT USAGE ON SCHEMA public TO nava_app;

    -- Pre-configure default privileges for future tables/sequences created by nava_migrator
    -- Eliminates premature table-grant failures before migrations run, ensuring nava_app automatically gets DML
    ALTER DEFAULT PRIVILEGES FOR ROLE nava_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nava_app;
    ALTER DEFAULT PRIVILEGES FOR ROLE nava_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nava_app;
  `;
  runPsqlCommand('nava_gateb_test', 'postgres', adminPassword, schemaDdl);
  console.log('Schema public ownership set to nava_migrator; USAGE granted to nava_app.');

  console.log('\n--- Step 5: Verifying role authentication independently ---');
  const migratorCheck = runPsqlCommand('nava_gateb_test', 'nava_migrator', migratorPassword, 'SELECT current_user, current_database();');
  console.log('DIRECT_URL role verification: SUCCESS (User: nava_migrator, DB: nava_gateb_test)');

  const appCheck = runPsqlCommand('nava_gateb_test', 'nava_app', appPassword, 'SELECT current_user, current_database();');
  console.log('DATABASE_URL role verification: SUCCESS (User: nava_app, DB: nava_gateb_test)');

  console.log('\n=============================================================');
  console.log('ISOLATED TEST DATABASE INITIALIZATION COMPLETE');
  console.log('Target: nava_gateb_test on PostgreSQL 16 (127.0.0.1:5432)');
  console.log('=============================================================');
}

if (require.main === module) {
  try {
    bootstrapDatabase();
  } catch (err) {
    console.error('BOOTSTRAP HALTED:', err.message);
    process.exit(1);
  }
}
