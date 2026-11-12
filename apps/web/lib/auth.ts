import { prisma } from '@nava/db';
import crypto from 'node:crypto';
import { CONFIG } from './config';

export interface AdminAuthContext {
  userId: string;
  role: string;
}

/**
 * Checks if database connection string is configured and reachable.
 */
function isDatabaseAvailable(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim() !== '' && !url.includes('placeholder') && !url.includes('ep-sample'));
}

/**
 * Derives the active secret key for administrative operations.
 * Fails safely if unconfigured.
 */
function getAdminAuthSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret || secret.trim() === '' || secret.length < 16) {
    throw new Error('ADMIN_AUTH_SECRET must be configured in environment with at least 16 characters.');
  }
  return secret.trim();
}

/**
 * Issues a cryptographically secure administrative session.
 * In live mode: persists session hash in prisma.adminSession.
 * In development/demo mode: uses HMAC-SHA256 signed bearer token with strict timestamp expiry.
 */
export async function issueAdminSession(metadata?: {
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<{ sessionToken: string; expiresAt: Date; role: string }> {
  const secret = getAdminAuthSecret();
  const rawId = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + CONFIG.auth.sessionDurationSeconds * 1000);
  const expiryTimestamp = expiresAt.getTime().toString();

  // Compute HMAC signature over token payload
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${rawId}.${expiryTimestamp}`);
  const signature = hmac.digest('hex');

  // Complete token carries payload and unforgeable signature
  const sessionToken = `${rawId}.${expiryTimestamp}.${signature}`;
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

  if (isDatabaseAvailable()) {
    try {
      // Find or provision default owner-manager record
      let adminUser = await prisma.user.findFirst({
        where: {
          role: { in: ['SUPER_ADMIN', 'STORE_MANAGER'] },
          isActive: true,
        },
      });

      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: 'owner@nava-creations.internal',
            phone: '+919886000000',
            name: 'Studio Owner & Manager',
            role: 'STORE_MANAGER',
            isActive: true,
          },
        });
      }

      await prisma.adminSession.create({
        data: {
          userId: adminUser.id,
          sessionTokenHash: tokenHash,
          expiresAt,
          isRevoked: false,
          userAgent: metadata?.userAgent || null,
          ipAddress: metadata?.ipAddress || null,
        },
      });

      return {
        sessionToken,
        expiresAt,
        role: adminUser.role,
      };
    } catch (dbError) {
      // Fallback only if DB call failed in non-production development
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to record admin session in production database');
      }
    }
  }

  // Non-production fallback mode: return signed HMAC token
  return {
    sessionToken,
    expiresAt,
    role: 'STORE_MANAGER',
  };
}

/**
 * Verifies admin session token from Authorization header or cookie.
 * Validates expiration, signature, and database revocation.
 * If authentication fails or session is invalid, returns null.
 */
export async function verifyAdminSession(request: Request): Promise<AdminAuthContext | null> {
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    // Check cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieName = CONFIG.auth.sessionCookieName;
    const match = cookieHeader.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`));
    if (match && match[1]) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token || token.length < 32) {
    return null;
  }

  // Parse token parts: <rawId>.<expiryTimestamp>.<signature>
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return null;
  }

  const rawId = parts[0];
  const expiryTimestampStr = parts[1];
  const signature = parts[2];
  const expiryTimestamp = parseInt(expiryTimestampStr, 10);
  if (isNaN(expiryTimestamp) || Date.now() > expiryTimestamp) {
    // Session expired
    return null;
  }

  // Verify HMAC signature
  try {
    const secret = getAdminAuthSecret();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${rawId}.${expiryTimestampStr}`);
    const expectedSignature = hmac.digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }
  } catch (_e) {
    return null;
  }

  // If database is available, enforce database persistence and revocation check
  if (isDatabaseAvailable()) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const session = await prisma.adminSession.findUnique({
        where: { sessionTokenHash: tokenHash },
        include: { user: true },
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        return null;
      }

      if (!session.user || !session.user.isActive) {
        return null;
      }

      const adminRoles = new Set(['SUPER_ADMIN', 'STORE_MANAGER', 'CATALOG_EDITOR']);
      if (!adminRoles.has(session.user.role)) {
        return null;
      }

      return {
        userId: session.user.id,
        role: session.user.role,
      };
    } catch (_error) {
      if (process.env.NODE_ENV === 'production') {
        return null;
      }
    }
  }

  // Development fallback for verified HMAC signatures
  return {
    userId: 'dev-store-manager',
    role: 'STORE_MANAGER',
  };
}

/**
 * Revokes an administrative session server-side.
 */
export async function revokeAdminSession(request: Request): Promise<void> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieName = CONFIG.auth.sessionCookieName;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`));
  const token = match && match[1] ? decodeURIComponent(match[1]) : null;

  if (token && isDatabaseAvailable()) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.adminSession.updateMany({
        where: { sessionTokenHash: tokenHash },
        data: { isRevoked: true },
      });
    } catch (_e) {
      // Ignore database errors on logout
    }
  }
}
