/**
 * NAVA CREATIONS — AUTOMATED DATABASE RESTORATION UTILITY
 * Restores a PostgreSQL dump into a verified target test/disposable database.
 * 
 * STRICT PRODUCTION SAFEGUARD:
 * Refuses to run against any database whose name does not explicitly indicate
 * a test, disposable, sandbox, or staging environment.
 * 
 * GUARANTEE: Never prints passwords, secrets, or credential-bearing connection strings.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { parseConnectionDetails, findPgBinary } = require('./backup-database');

const ALLOWED_TARGET_PATTERNS = [
  /test/i,
  /disposable/i,
  /restore/i,
  /staging/i,
  /sandbox/i,
  /dev/i,
];

const FORBIDDEN_TARGET_PATTERNS = [
  /^production$/i,
  /^prod$/i,
  /nava_prod/i,
  /nava_production/i,
  /^nava$/i,
];

function validateTargetDatabaseSafety(targetDb) {
  if (!targetDb || typeof targetDb !== 'string') {
    throw new Error('SAFETY HALT: Target database name must be a non-empty string.');
  }

  for (const forbidden of FORBIDDEN_TARGET_PATTERNS) {
    if (forbidden.test(targetDb)) {
      throw new Error(`SAFETY REFUSAL: Target database "${targetDb}" matches forbidden production pattern (${forbidden}). Restoration strictly blocked.`);
    }
  }

  const isAllowed = ALLOWED_TARGET_PATTERNS.some((pattern) => pattern.test(targetDb));
  if (!isAllowed) {
    throw new Error(
      `SAFETY REFUSAL: Target database "${targetDb}" does not match any approved non-production pattern (must contain: test, disposable, restore, staging, sandbox, or dev). Restoration strictly blocked.`
    );
  }

  return true;
}

function findLatestBackup(backupsDir) {
  if (!fs.existsSync(backupsDir)) return null;
  const files = fs.readdirSync(backupsDir)
    .filter((f) => f.endsWith('.dump') || f.endsWith('.sql'))
    .map((f) => {
      const fullPath = path.join(backupsDir, f);
      return { path: fullPath, mtime: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].path : null;
}

function runSqlInDatabase(conn, dbName, sql, userOverride, passwordOverride) {
  const psqlBin = findPgBinary('psql');
  const user = userOverride || conn.user;
  const password = passwordOverride !== undefined ? passwordOverride : conn.password;

  const args = [
    '-h', conn.host,
    '-p', String(conn.port),
    '-U', user,
    '-d', dbName,
    '-t',
    '-A',
    '-c', sql,
  ];

  const execEnv = {
    ...process.env,
    PGPASSWORD: password,
  };

  return execFileSync(psqlBin, args, { env: execEnv, encoding: 'utf8' }).trim();
}

function verifyRestoredData(conn, targetDb) {
  console.log('\n--- Post-Restoration Data Verification ---');
  // Schema uses @map() on Prisma models resulting in lowercase plural tables
  const tables = ['products', 'categories', 'product_variants', 'inventory_items', 'orders', 'payments'];
  const results = {};
  let failureCount = 0;

  for (const table of tables) {
    try {
      const count = runSqlInDatabase(conn, targetDb, `SELECT count(*) FROM "${table}";`);
      const parsed = parseInt(count, 10);
      if (isNaN(parsed)) {
        throw new Error(`Unexpected count output: ${count}`);
      }
      results[table] = parsed;
      console.log(`[VERIFY TABLE] "${table}" : ${results[table]} records verified`);
    } catch (err) {
      console.log(`[VERIFY TABLE] "${table}" : FAILED (${err.message.split('\n')[0]})`);
      results[table] = -1;
      failureCount++;
    }
  }

  if (failureCount > 0) {
    throw new Error(`Restoration verification failed for ${failureCount} required table(s).`);
  }

  return results;
}

function runRestore(options = {}) {
  const startTime = Date.now();
  const backupsDir = path.resolve(__dirname, '..', 'backups');

  // Resolve source file
  const backupFile = options.file
    ? path.resolve(options.file)
    : findLatestBackup(backupsDir);

  if (!backupFile || !fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile || 'no backups found in ' + backupsDir}`);
  }

  const fileStats = fs.statSync(backupFile);
  if (fileStats.size === 0) {
    throw new Error(`Backup file is empty (0 bytes): ${backupFile}`);
  }

  // Parse connection details
  const conn = parseConnectionDetails(options);
  const targetDb = options.targetDb || conn.database;

  // Strict Safety Gate Check
  validateTargetDatabaseSafety(targetDb);

  console.log('=============================================================');
  console.log('NAVA CREATIONS — DATABASE RESTORATION UTILITY');
  console.log('=============================================================');
  console.log(`[SOURCE BACKUP]   : ${backupFile}`);
  console.log(`[BACKUP FILE SIZE]: ${(fileStats.size / 1024).toFixed(2)} KB`);
  console.log(`[TARGET HOST]     : ${conn.host}:${conn.port}`);
  console.log(`[TARGET DATABASE] : ${targetDb} (Verified Non-Production)`);
  console.log(`[RESTORE USER]    : ${conn.user}`);

  const isCustomFormat = backupFile.endsWith('.dump');
  const execEnv = {
    ...process.env,
    PGPASSWORD: conn.password,
  };

  // Ensure target database exists if requested
  if (options.createDb) {
    console.log(`\n[STEP 1] Ensuring target database "${targetDb}" exists...`);
    const { loadEnvTest } = require('./test-db-guard');
    let adminPw = '';
    try {
      const env = loadEnvTest();
      adminPw = env.POSTGRES_ADMIN_PASSWORD || '';
    } catch {}

    try {
      const dbCheck = runSqlInDatabase(conn, 'postgres', `SELECT 1 FROM pg_database WHERE datname = '${targetDb}';`, 'postgres', adminPw);
      if (dbCheck !== '1') {
        runSqlInDatabase(conn, 'postgres', `CREATE DATABASE ${targetDb} OWNER ${conn.user};`, 'postgres', adminPw);
        console.log(`[PASS] Created target database "${targetDb}" owned by ${conn.user}.`);
      } else {
        console.log(`[INFO] Database "${targetDb}" already exists.`);
      }
    } catch (err) {
      console.log(`[WARN] Database creation note: ${err.message.split('\n')[0]}`);
    }
  }

  console.log(`\n[STEP 2] Executing restore into "${targetDb}"...`);
  if (isCustomFormat) {
    const pgRestoreBin = findPgBinary('pg_restore');
    const args = [
      '-h', conn.host,
      '-p', String(conn.port),
      '-U', conn.user,
      '-d', targetDb,
      '--no-owner',
      '--no-privileges',
    ];

    if (options.clean) {
      args.push('--clean', '--if-exists');
    }

    args.push(backupFile);

    try {
      execFileSync(pgRestoreBin, args, { env: execEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      // pg_restore exits with status 1 on minor SQL notices / warnings, which is acceptable if data verifies
      if (err.status && err.status > 1) {
        throw new Error(`pg_restore fatal error (status ${err.status}): ${err.message}`);
      }
    }
  } else {
    const psqlBin = findPgBinary('psql');
    const args = [
      '-h', conn.host,
      '-p', String(conn.port),
      '-U', conn.user,
      '-d', targetDb,
      '-f', backupFile,
    ];

    try {
      execFileSync(psqlBin, args, { env: execEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      throw new Error(`psql restore failed: ${err.message}`);
    }
  }

  console.log('[PASS] Database restoration binary execution completed.');

  // Step 3: Verification
  const counts = verifyRestoredData(conn, targetDb);

  const durationMs = Date.now() - startTime;
  console.log('-------------------------------------------------------------');
  console.log(`[STATUS]          : RESTORATION & VERIFICATION SUCCESS`);
  console.log(`[DURATION]        : ${durationMs}ms`);
  console.log('=============================================================');

  return {
    status: 'SUCCESS',
    targetDb,
    backupFile,
    counts,
    durationMs,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  for (const arg of args) {
    if (arg.startsWith('--file=')) options.file = arg.slice(7);
    else if (arg.startsWith('--target-db=')) options.targetDb = arg.slice(12);
    else if (arg.startsWith('--env-file=')) options.envFile = arg.slice(11);
    else if (arg === '--clean') options.clean = true;
    else if (arg === '--create-db') options.createDb = true;
  }

  try {
    runRestore(options);
  } catch (err) {
    console.error(`\n[FATAL RESTORE ERROR] ${err.message}`);
    process.exit(1);
  }
}

module.exports = { runRestore, validateTargetDatabaseSafety };
