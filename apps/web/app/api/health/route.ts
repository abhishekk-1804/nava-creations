import { NextResponse } from 'next/server';
import { prisma } from '@nava/db';

const processStartTime = Date.now();

/**
 * Aggregate Health Check: Combines process liveness with database dependency readiness.
 * Returns HTTP 200 when all core services are operational.
 * Returns HTTP 503 Service Unavailable when required dependencies (database) are failing.
 * Never exposes credentials, connection URLs, or sensitive stack traces.
 */
export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);
  const isDbConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');

  let dbStatus: 'connected' | 'disconnected' | 'unconfigured' = isDbConfigured ? 'disconnected' : 'unconfigured';
  let isHealthy = false;

  if (isDbConfigured) {
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DB check timed out')), 3000)
        ),
      ]);
      dbStatus = 'connected';
      isHealthy = true;
    } catch (_err) {
      dbStatus = 'disconnected';
      isHealthy = false;
    }
  }

  const httpStatus = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'nava-creations-web',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0-sprint-2a.2',
      checks: {
        process: 'alive',
        domainModule: 'ready',
        database: dbStatus,
      },
    },
    { status: httpStatus }
  );
}
