import { NextResponse } from 'next/server';
import { prisma } from '@nava/db';

/**
 * Readiness Probe: Verifies whether the application can communicate with required dependencies.
 * Performs a lightweight database query (SELECT 1) with an aggressive timeout.
 * Returns HTTP 200 when ready, or HTTP 503 Service Unavailable when the database is unreachable.
 * Never exposes secrets, database URLs, or internal infrastructure details.
 */
export async function GET() {
  const isDbConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');

  if (!isDbConfigured) {
    return NextResponse.json(
      {
        status: 'not_ready',
        service: 'nava-creations-web',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'unconfigured',
        },
        error: 'Database connection configuration is missing',
      },
      { status: 503 }
    );
  }

  try {
    // Perform database ping with a 3-second timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connectivity check timed out')), 3000)
      ),
    ]);

    return NextResponse.json(
      {
        status: 'ready',
        service: 'nava-creations-web',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'connected',
        },
      },
      { status: 200 }
    );
  } catch (_err) {
    return NextResponse.json(
      {
        status: 'not_ready',
        service: 'nava-creations-web',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'disconnected',
        },
        error: 'Database dependency is unavailable',
      },
      { status: 503 }
    );
  }
}
