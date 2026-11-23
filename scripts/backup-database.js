/**
 * NAVA CREATIONS — AUTOMATED DATABASE BACKUP UTILITY
 * Creates consistent, timestamped PostgreSQL backups using pg_dump.
 * Supports custom compressed format (-Fc) for atomic PITR restoration, and plain SQL.
 * 
 * GUARANTEE: Never prints passwords, secrets, or credential-bearing connection strings.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findPgBinary(binName) {
  if (process.platform === 'win32') {
    const defaultWinPath = `C:\\Program Files\\PostgreSQL\\16\\bin\\${binName}.exe`;
    if (fs.existsSync(defaultWinPath)) return defaultWinPath;
  }
  const nixPath = `/usr/bin/${binName}`;
  if (fs.existsSync(nixPath)) return nixPath;
  return binName;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
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

function parseConnectionDetails(options = {}) {
  const envFile = options.envFile || path.resolve(__dirname, '..', '.env.test');
  const fileEnv = loadEnvFile(envFile);

  const urlStr = process.env.DIRECT_URL || fileEnv.DIRECT_URL || process.env.DATABASE_URL || fileEnv.DATABASE_URL;

  if (urlStr) {
    try {
      const parsed = new URL(urlStr);
      return {
        user: parsed.username || 'postgres',
        password: decodeURIComponent(parsed.password || ''),
        host: parsed.hostname || '127.0.0.1',
        port: parsed.port || '5432',
        database: options.db || parsed.pathname.replace(/^\//, '') || 'nava_gateb_test',
      };
    } catch {
      // Fallback to explicit params
    }
  }

  return {
    user: process.env.PGUSER || fileEnv.NAVA_MIGRATOR_USER || 'nava_migrator',
    password: process.env.PGPASSWORD || fileEnv.NAVA_MIGRATOR_PASSWORD || fileEnv.POSTGRES_ADMIN_PASSWORD || '',
    host: process.env.PGHOST || fileEnv.EXPECTED_TEST_DB_HOST || '127.0.0.1',
    port: process.env.PGPORT || '5432',
    database: options.db || fileEnv.EXPECTED_TEST_DB_NAME || 'nava_gateb_test',
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function runBackup(options = {}) {
  const startTime = Date.now();
  const conn = parseConnectionDetails(options);
  const pgDumpBin = findPgBinary('pg_dump');

  const format = options.format || 'custom'; // 'custom' (.dump) or 'plain' (.sql)
  const extension = format === 'custom' ? 'dump' : 'sql';

  const backupsDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = options.output
    ? path.resolve(options.output)
    : path.resolve(backupsDir, `${conn.database}_${timestamp}.${extension}`);

  console.log('=============================================================');
  console.log('NAVA CREATIONS — DATABASE BACKUP GENERATOR');
  console.log('=============================================================');
  console.log(`[TARGET DATABASE] : ${conn.database}`);
  console.log(`[TARGET HOST]     : ${conn.host}:${conn.port}`);
  console.log(`[DATABASE USER]   : ${conn.user}`);
  console.log(`[BACKUP FORMAT]   : ${format.toUpperCase()}`);
  console.log(`[OUTPUT PATH]     : ${filename}`);

  const args = [
    '-h', conn.host,
    '-p', String(conn.port),
    '-U', conn.user,
    '-d', conn.database,
    '--no-owner',
    '--no-privileges',
  ];

  if (format === 'custom') {
    args.push('-Fc');
  } else {
    args.push('-Fp');
  }

  if (options.schemaOnly) {
    args.push('--schema-only');
  } else if (options.dataOnly) {
    args.push('--data-only');
  }

  args.push('-f', filename);

  const execEnv = {
    ...process.env,
    PGPASSWORD: conn.password,
  };

  try {
    execFileSync(pgDumpBin, args, { env: execEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    throw new Error(`pg_dump failed with exit status: ${err.status || err.message}`);
  }

  if (!fs.existsSync(filename)) {
    throw new Error(`Backup failed: destination file was not created at ${filename}`);
  }

  const stats = fs.statSync(filename);
  if (stats.size === 0) {
    fs.unlinkSync(filename);
    throw new Error('Backup failed: destination file was created with 0 bytes.');
  }

  const durationMs = Date.now() - startTime;
  console.log('-------------------------------------------------------------');
  console.log(`[STATUS]          : SUCCESS`);
  console.log(`[FILE SIZE]       : ${formatBytes(stats.size)} (${stats.size} bytes)`);
  console.log(`[DURATION]        : ${durationMs}ms`);
  console.log('=============================================================');

  return {
    filePath: filename,
    sizeBytes: stats.size,
    durationMs,
    format,
    database: conn.database,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  for (const arg of args) {
    if (arg.startsWith('--output=')) options.output = arg.slice(9);
    else if (arg.startsWith('--format=')) options.format = arg.slice(9);
    else if (arg.startsWith('--db=')) options.db = arg.slice(5);
    else if (arg.startsWith('--env-file=')) options.envFile = arg.slice(11);
    else if (arg === '--schema-only') options.schemaOnly = true;
    else if (arg === '--data-only') options.dataOnly = true;
  }

  try {
    runBackup(options);
  } catch (err) {
    console.error(`\n[FATAL BACKUP ERROR] ${err.message}`);
    process.exit(1);
  }
}

module.exports = { runBackup, parseConnectionDetails, findPgBinary };
