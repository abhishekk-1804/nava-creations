import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Configure database URL with PgBouncer connection pooling options in production
 * or when connecting to a pooled Supabase / PgBouncer port (6543 / pooler).
 * Under high-concurrency (1M+ requests / 10 Lakhs users), connection_limit=1 prevents
 * database connection pool exhaustion across serverless function instances.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  const isProduction = process.env.NODE_ENV === 'production';
  const isPooledEndpoint = url.includes('pooler') || url.includes(':6543') || process.env.USE_PGBOUNCER === 'true';

  if ((isProduction || isPooledEndpoint) && !url.includes('pgbouncer=true')) {
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.searchParams.has('pgbouncer')) {
        parsedUrl.searchParams.set('pgbouncer', 'true');
      }
      if (!parsedUrl.searchParams.has('connection_limit')) {
        parsedUrl.searchParams.set('connection_limit', '1');
      }
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  return url;
}

const datasourceUrl = getOptimizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
