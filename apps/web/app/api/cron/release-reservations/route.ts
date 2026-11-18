import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { InventoryReservationService } from '@/lib/inventory-reservation-service';
import { assertProductionSecrets } from '@/lib/env-validator';

function isAuthorized(request: NextRequest): boolean {
  const isProd = process.env.NODE_ENV === 'production';
  const configuredSecret = process.env.CRON_SECRET?.trim();

  // Fail-closed: Secret must be explicitly configured
  if (!configuredSecret) {
    console.error('[CRON:SECURITY] CRON_SECRET is not configured in environment.');
    return false;
  }

  // In production, reject weak or placeholder secrets (must be at least 32 characters)
  if (isProd && (configuredSecret.length < 32 || configuredSecret === 'nava-cron-secret-2026-safe' || configuredSecret.includes('placeholder'))) {
    console.error('[CRON:SECURITY] CRON_SECRET is weak or placeholder in production.');
    return false;
  }

  // Extract token ONLY from Authorization Bearer header or x-cron-secret header
  // SECURITY REQUIREMENT: Query string secret authentication is strictly prohibited to prevent token leakage in server logs
  const authHeader = request.headers.get('authorization') || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    token = request.headers.get('x-cron-secret')?.trim() || '';
  }

  if (!token) {
    return false;
  }

  try {
    const tokenBuf = Buffer.from(token, 'utf8');
    const expectedBuf = Buffer.from(configuredSecret, 'utf8');
    if (tokenBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  } catch {
    return false;
  }
}

async function handleRelease(request: NextRequest) {
  // Enforce production security preconditions before executing reservation sweeps
  assertProductionSecrets();

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid cron authentication credentials required' },
      { status: 401 }
    );
  }

  try {
    const releasedCount = await InventoryReservationService.releaseExpiredReservations();
    return NextResponse.json(
      {
        success: true,
        releasedCount,
        timestamp: new Date().toISOString(),
        message: `Successfully released ${releasedCount} expired inventory reservation(s).`,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to release expired reservations';
    return NextResponse.json(
      { error: 'Reservation cleanup failed', message },
      { status: 500 }
    );
  }
}

/**
 * State-changing cron operations MUST be POST-only.
 * GET returns HTTP 405 Method Not Allowed with Allow: POST.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed', message: 'The reservation release endpoint requires POST.' },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  return handleRelease(request);
}
