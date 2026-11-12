/**
 * Database Environment & Connectivity Verification Script
 * Validates connection strings, pooled vs direct architecture, and reachability.
 * Strictly masks credentials to prevent secret leaks in logs.
 */

import { PrismaClient } from '@prisma/client';

function maskDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl || rawUrl.trim() === '') return '(not set)';
  try {
    const parsed = new URL(rawUrl);
    const user = parsed.username || '***';
    const host = parsed.host;
    const pathname = parsed.pathname;
    const search = parsed.search;
    return `${parsed.protocol}//${user}:*****@${host}${pathname}${search}`;
  } catch {
    // If not standard URL format, mask most characters
    return rawUrl.slice(0, 12) + '*****' + rawUrl.slice(-6);
  }
}

function isPlaceholder(url: string | undefined): boolean {
  if (!url) return true;
  return (
    url.includes('placeholder') ||
    url.includes('ep-sample') ||
    url.includes('user:password') ||
    url.trim() === ''
  );
}

async function runCheck() {
  console.log('='.repeat(70));
  console.log('NAVA CREATIONS — Database Environment & Connectivity Verifier');
  console.log('='.repeat(70));

  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  console.log(`\n1. Connection String Audit:`);
  console.log(`   - DATABASE_URL (Pooled): ${maskDatabaseUrl(dbUrl)}`);
  console.log(`   - DIRECT_URL   (Direct): ${maskDatabaseUrl(directUrl)}`);

  const dbIsPlaceholder = isPlaceholder(dbUrl);
  const directIsPlaceholder = isPlaceholder(directUrl);

  if (dbIsPlaceholder || directIsPlaceholder) {
    console.log(`\n2. Configuration Status: ⚠️  UNCONFIGURED / PLACEHOLDER DETECTED`);
    console.log(`   Database connection strings in current environment are documentation placeholders.`);
    console.log(`   The application is operating in resilient fallback mode (sample catalogue).`);
    console.log(`\n3. Setup Instructions for Development Database:`);
    console.log(`   To connect a real managed PostgreSQL development database (Neon / Supabase / Local):`);
    console.log(`   a) Sign up / Log in to https://console.neon.tech or https://supabase.com`);
    console.log(`   b) Create a new project: 'nava-creations-dev' (region: ap-southeast-1 Singapore recommended)`);
    console.log(`   c) In your local .env.local file (which is git-ignored), update:`);
    console.log(`      DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/neondb?sslmode=require&pgbouncer=true"`);
    console.log(`      DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/neondb?sslmode=require"`);
    console.log(`   d) Run migration deployment:`);
    console.log(`      pnpm --filter @nava/db db:migrate:deploy`);
    console.log(`   e) Re-run this verifier:`);
    console.log(`      pnpm --filter @nava/db db:check`);
    console.log('\n' + '='.repeat(70));
    return;
  }

  console.log(`\n2. Configuration Status: ✅ Valid non-placeholder URLs detected`);
  console.log(`3. Testing Live Connection (SELECT 1 with 3s timeout)...`);

  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  try {
    const start = Date.now();
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as connected`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out after 3000ms')), 3000)
      ),
    ]);
    const durationMs = Date.now() - start;
    console.log(`   ✅ Successfully connected to PostgreSQL in ${durationMs}ms`);
    console.log(`   Database is LIVE and ready for queries.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`   ❌ Connection Failed: ${message}`);
    console.log(`   Status: ENVIRONMENT BLOCKED — Check network, SSL certificates, or credentials.`);
  } finally {
    await prisma.$disconnect();
    console.log('='.repeat(70));
  }
}

runCheck().catch((err) => {
  console.error('Fatal error in database verifier:', err);
  process.exit(1);
});
