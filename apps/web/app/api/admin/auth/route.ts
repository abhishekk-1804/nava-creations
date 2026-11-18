import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { issueAdminSession, revokeAdminSession } from '@/lib/auth';
import { CONFIG } from '@/lib/config';
import { authRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';
import { assertProductionSecrets } from '@/lib/env-validator';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Ensure production environment secrets are strictly configured before auth operations
    assertProductionSecrets();

    // SECURITY: Production security posture is strictly governed by NODE_ENV.
    // APP_ENV=test can NEVER downgrade production authentication or rate limiting.
    const isProd = process.env.NODE_ENV === 'production';
    const ipResolution = resolveClientIp(request);
    const clientIp = ipResolution.clientIp;
    const isIpTrusted = ipResolution.isTrusted;
    const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1';

    // 1. Layer 1 Check: Client IP Rate Limiting
    // In production, rate limits apply to all trusted client IPs.
    // In dev/test (!isProd), simulated non-loopback IPs are rate limited, while raw local runner
    // loopback (127.0.0.1) is bypassed to allow high-volume automated test suites to run without self-exhaustion.
    const ipKey = isIpTrusted && (!isLoopback || isProd)
      ? `ip:${clientIp}`
      : !isIpTrusted && isProd
        ? `untrusted:${crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 12)}`
        : null;

    let ipRateCheck = null;
    if (ipKey) {
      ipRateCheck = await authRateLimiter.checkDistributed(ipKey, 10, 900);
      if (!ipRateCheck.allowed) {
        return NextResponse.json(
          {
            error: `Too many failed authentication attempts. Please retry in ${ipRateCheck.resetInSeconds} seconds.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(ipRateCheck.resetInSeconds),
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Backend': ipRateCheck.backend,
              ...(ipRateCheck.degraded ? { 'X-RateLimit-Degraded': 'true' } : {}),
              ...(!isIpTrusted ? { 'X-RateLimit-Untrusted-Proxy': 'true' } : {}),
            },
          }
        );
      }
    }

    // 2. Parse request body to extract credentials
    const body = await request.json().catch(() => ({}));
    const secretInput = (body.token || body.secretKey || body.password || '').trim();

    // 3. Optional Account Rate Limiting ONLY when an explicit non-empty account is provided
    // CRITICAL SECURITY FIX (BLK-02): NEVER fallback to a hardcoded shared 'admin' bucket.
    // In NAVA's studio secret authentication model, the web UI submits only the secret token.
    // Lacking an account identifier must NEVER lock out all studio managers globally.
    const explicitAccount = (body.account || body.username || body.email || '').trim().toLowerCase();
    let accountKey: string | null = null;
    let accountRateCheck = null;

    if (explicitAccount) {
      const accountHash = crypto.createHash('sha256').update(explicitAccount).digest('hex').slice(0, 16);
      accountKey = `acc:${accountHash}`;
      accountRateCheck = await authRateLimiter.checkDistributed(accountKey, 10, 900);
      if (!accountRateCheck.allowed) {
        return NextResponse.json(
          {
            error: `Too many failed authentication attempts. Please retry in ${accountRateCheck.resetInSeconds} seconds.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(accountRateCheck.resetInSeconds),
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Backend': accountRateCheck.backend,
              ...(accountRateCheck.degraded ? { 'X-RateLimit-Degraded': 'true' } : {}),
            },
          }
        );
      }
    }

    // Calculate effective remaining attempts for informational headers
    const effectiveRemaining = accountRateCheck && ipRateCheck
      ? Math.min(ipRateCheck.remaining, accountRateCheck.remaining)
      : accountRateCheck?.remaining ?? ipRateCheck?.remaining ?? 10;
    const rateLimitBackend = accountRateCheck?.backend || ipRateCheck?.backend || 'memory';

    if (!secretInput) {
      if (ipKey) {
        await authRateLimiter.recordFailure(ipKey, 900);
      }
      if (accountKey) {
        await authRateLimiter.recordFailure(accountKey, 900);
      }
      return NextResponse.json(
        { error: 'Administrative secret key or credentials required' },
        {
          status: 400,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(Math.max(0, effectiveRemaining - 1)),
            'X-RateLimit-Backend': rateLimitBackend,
          },
        }
      );
    }

    const configuredSecret = process.env.ADMIN_AUTH_SECRET;
    if (!configuredSecret || configuredSecret.trim().length < 16) {
      return NextResponse.json(
        { error: 'Server misconfiguration: ADMIN_AUTH_SECRET not securely configured' },
        { status: 500 }
      );
    }

    let isValid = false;
    let authenticatedAdminUser: { id: string; role: string } | null = null;

    // Check credential-based admin login (Email + Password)
    if (explicitAccount && secretInput) {
      try {
        const { prisma } = await import('@nava/db');
        const user = await prisma.user.findFirst({
          where: {
            email: explicitAccount,
            role: { in: ['SUPER_ADMIN', 'STORE_MANAGER', 'ORDER_OPERATOR', 'CATALOG_EDITOR'] },
            isActive: true,
          },
        });

        if (user && user.passwordHash) {
          const { verifyPassword } = await import('@/lib/customer-auth');
          const isPasswordValid = await verifyPassword(secretInput, user.passwordHash);
          if (isPasswordValid) {
            isValid = true;
            authenticatedAdminUser = { id: user.id, role: user.role };
          }
        }
      } catch (_e) {
        // Fallback to token check
      }
    }

    // Check token-based / secret-based login if not already authenticated
    if (!isValid) {
      const inputBuffer = Buffer.from(secretInput, 'utf8');
      const secretBuffer = Buffer.from(configuredSecret.trim(), 'utf8');

      isValid =
        inputBuffer.length === secretBuffer.length &&
        crypto.timingSafeEqual(inputBuffer, secretBuffer);
    }

    if (!isValid) {
      if (ipKey) {
        await authRateLimiter.recordFailure(ipKey, 900);
      }
      if (accountKey) {
        await authRateLimiter.recordFailure(accountKey, 900);
      }
      return NextResponse.json(
        { error: 'Invalid administrative credentials. Access denied.' },
        {
          status: 401,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(Math.max(0, effectiveRemaining - 1)),
            'X-RateLimit-Backend': rateLimitBackend,
          },
        }
      );
    }

    // Reset rate limiter counters on successful authentication
    if (ipKey) {
      await authRateLimiter.reset(ipKey);
    }
    if (accountKey) {
      await authRateLimiter.reset(accountKey);
    }

    // Issue cryptographically signed & persisted session
    const userAgent = request.headers.get('user-agent');
    const ipAddress = clientIp;

    const session = await issueAdminSession({
      userAgent,
      ipAddress,
      userId: authenticatedAdminUser?.id,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Administrative session established',
      role: session.role,
      expiresAt: session.expiresAt.toISOString(),
    });

    response.cookies.set({
      name: CONFIG.auth.sessionCookieName,
      value: session.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CONFIG.auth.sessionDurationSeconds,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await revokeAdminSession(request);
    const response = NextResponse.json({
      success: true,
      message: 'Administrative session revoked successfully',
    });

    response.cookies.set({
      name: CONFIG.auth.sessionCookieName,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
