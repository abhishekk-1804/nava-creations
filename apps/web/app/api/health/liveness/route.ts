import { NextResponse } from 'next/server';

const processStartTime = Date.now();

/**
 * Liveness Probe: Verifies the Node.js process is responsive.
 * Used by orchestrators to determine whether the container needs to be restarted.
 */
export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);

  return NextResponse.json(
    {
      status: 'alive',
      service: 'nava-creations-web',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'development',
    },
    { status: 200 }
  );
}
