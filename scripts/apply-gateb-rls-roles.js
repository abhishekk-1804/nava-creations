/**
 * NAVA CREATIONS â€” GATE B ROLE SEPARATION & RLS LOCKDOWN
 * 
 * Enforces:
 * 1. nava_migrator: Table owner, DDL permissions, owns _prisma_migrations.
 * 2. nava_app: DML only (SELECT, INSERT, UPDATE, DELETE), sequences USAGE,
 *    explicit RLS policies on all application tables, ZERO access to _prisma_migrations.
 * 3. anon & authenticated: NOLOGIN, zero grants, zero permissive policies (default deny-all).
 */

const { execFileSync } = require('child_process');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const PSQL_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

function runPsql(database, user, password, sql) {
  const env = { ...process.env, PGPASSWORD: password };
  return execFileSync(PSQL_PATH, [
    '-h', '127.0.0.1',
    '-p', '5432',
    '-U', user,
    '-d', database,
    '-w',
    '-c', sql,
  ], { env, encoding: 'utf8' });
}

function applyRoleSeparationAndRls() {
  console.log('=== Step 1: Pre-flight Safety Guard Evaluation ===');
  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Target DB: ${guard.database} on ${guard.host}`);

  const env = loadEnvTest();
  const adminPassword = env.POSTGRES_ADMIN_PASSWORD;
  const migratorPassword = env.NAVA_MIGRATOR_PASSWORD;
  const appPassword = env.NAVA_APP_PASSWORD;

  console.log('\n=== Step 2: Provisioning anon and authenticated roles ===');
  const provisionRolesSql = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      ELSE
        ALTER ROLE anon NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      ELSE
        ALTER ROLE authenticated NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      END IF;

      -- Ensure nava_migrator and nava_app have least-privilege security flags
      ALTER ROLE nava_migrator NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      ALTER ROLE nava_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END $$;
  `;
  runPsql('nava_gateb_test', 'postgres', adminPassword, provisionRolesSql);
  console.log('[PASS] anon and authenticated roles verified with NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS.');

  console.log('\n=== Step 3: Configuring Object Ownership, RLS & Permissions ===');
  const rlsAndPermissionsSql = `
    -- 1. Ensure nava_migrator owns all tables in public
    DO $$
    DECLARE
      tbl record;
    BEGIN
      FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO nava_migrator;', tbl.tablename);
      END LOOP;
    END $$;

    -- 2. Schema USAGE (allow role to resolve schema public objects so table-level ACL and RLS apply)
    GRANT USAGE ON SCHEMA public TO nava_app, anon, authenticated;
    REVOKE CREATE ON SCHEMA public FROM anon, authenticated, PUBLIC;

    -- 3. Grant DML to nava_app on all current application tables
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nava_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nava_app;

    -- 4. Enable RLS and create explicit permissive policies for nava_app
    DO $$
    DECLARE
      tbl record;
    BEGIN
      FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
      LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
        EXECUTE format('DROP POLICY IF EXISTS nava_app_all ON public.%I;', tbl.tablename);
        EXECUTE format('CREATE POLICY nava_app_all ON public.%I TO nava_app USING (true) WITH CHECK (true);', tbl.tablename);
      END LOOP;
    END $$;

    -- 5. Strict lockdown of _prisma_migrations (nava_migrator ONLY, zero access for nava_app/anon/authenticated)
    REVOKE ALL ON TABLE "_prisma_migrations" FROM nava_app;
    REVOKE ALL ON TABLE "_prisma_migrations" FROM anon;
    REVOKE ALL ON TABLE "_prisma_migrations" FROM authenticated;
    REVOKE ALL ON TABLE "_prisma_migrations" FROM PUBLIC;
    GRANT ALL ON TABLE "_prisma_migrations" TO nava_migrator;

    -- 6. Strict deny-all for anon and authenticated
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, PUBLIC;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, PUBLIC;
  `;
  runPsql('nava_gateb_test', 'postgres', adminPassword, rlsAndPermissionsSql);
  console.log('[PASS] RLS enabled and role permissions configured.');
}

if (require.main === module) {
  try {
    applyRoleSeparationAndRls();
  } catch (err) {
    console.error('[FAIL]', err.message);
    process.exit(1);
  }
}
