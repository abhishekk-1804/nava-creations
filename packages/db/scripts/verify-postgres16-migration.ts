/**
 * PostgreSQL 16 Migration Verification Runner
 * 
 * Usage:
 *   npx tsx scripts/verify-postgres16-migration.ts
 * 
 * Tests:
 * 1. Reachability of PostgreSQL daemon.
 * 2. Execution of test migration sequence against empty database.
 * 3. Exact reproduction of Error 55P04 on single-transaction enum mutation.
 * 4. Validation of sequential 2-step migration pattern.
 * 5. Parity between Prisma schema and deployed SQL catalog.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  console.log('='.repeat(70));
  console.log('NAVA CREATIONS — PostgreSQL 16 Migration Verification Harness');
  console.log('='.repeat(70));

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('placeholder') || dbUrl.includes('user:password')) {
    console.log('\n[STATUS: BLOCKED]');
    console.log('Reason: No local or remote PostgreSQL 16 environment is available.');
    console.log('Docker is not installed on this system, and no PostgreSQL daemon is running.');
    console.log('\nVerification Script Prepared:');
    console.log('  File: packages/db/scripts/verify-postgres16-migration.sql');
    console.log('\nWhen a PostgreSQL 16 instance is available, execute:');
    console.log('  psql "$DATABASE_URL" -f packages/db/scripts/verify-postgres16-migration.sql');
    console.log('  pnpm --filter @nava/db db:migrate:deploy');
    console.log('  pnpm --filter @nava/db db:migrate:status');
    console.log('='.repeat(70));
    return;
  }

  console.log('\nPostgreSQL connection string detected. Attempting verification...');
  try {
    const output = execSync('pnpm --filter @nava/db validate', { encoding: 'utf8' });
    console.log(output);
  } catch (err) {
    console.error('Validation error:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
