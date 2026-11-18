/**
 * Safe Proxy IP Resolution Utility
 * 
 * Protects against IP spoofing attacks via untrusted X-Forwarded-For or X-Real-IP headers.
 * 
 * Deployment Proxy Guidelines:
 * 1. By default, untrusted incoming X-Forwarded-For headers MUST NOT be trusted in production.
 * 2. When deployed behind a verified reverse proxy (e.g., Cloudflare, AWS ALB, Nginx, Vercel),
 *    the environment variable TRUST_PROXY="true" must be explicitly configured.
 * 3. Specific proxy providers can be specified via PROXY_PROVIDER="cloudflare" | "standard".
 *    - "cloudflare": Prefers validated 'cf-connecting-ip' header.
 *    - "standard": Uses sanitized 'x-real-ip' or leftmost validated IP from 'x-forwarded-for'.
 * 4. In development and test environments (NODE_ENV !== 'production'), headers are accepted
 *    to facilitate testing and local simulation, but flagged as development fallbacks.
 * 5. If proxy trust cannot be established in production, the system falls back to a conservative
 *    'untrusted-direct-client' identifier and sets response auditing header 'X-RateLimit-Untrusted-Proxy: true'.
 */

export interface ClientIpResult {
  clientIp: string;
  isTrusted: boolean;
  source: 'cf-connecting-ip' | 'x-real-ip' | 'x-forwarded-for' | 'dev-fallback' | 'untrusted-fallback';
}

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$|^::$/;

/**
 * Validates whether an IP address matches standard IPv4 or IPv6 syntax.
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const trimmed = ip.trim();
  return IPV4_REGEX.test(trimmed) || IPV6_REGEX.test(trimmed);
}

/**
 * Resolves the client IP address using safe, explicit proxy trust rules.
 */
export function resolveClientIp(
  request: Request,
  overrideOptions?: { trustProxy?: boolean; proxyProvider?: 'cloudflare' | 'standard' }
): ClientIpResult {
  // SECURITY: Production security posture is strictly governed by NODE_ENV.
  // APP_ENV=test can NEVER downgrade proxy trust validation in production.
  const isProd = process.env.NODE_ENV === 'production';
  const trustProxy = overrideOptions?.trustProxy ?? (process.env.TRUST_PROXY === 'true');
  const proxyProvider = overrideOptions?.proxyProvider ?? process.env.PROXY_PROVIDER ?? 'standard';

  // 1. Cloudflare deployment with trusted proxy configuration
  if (trustProxy && proxyProvider === 'cloudflare') {
    const cfIp = request.headers.get('cf-connecting-ip')?.trim();
    if (cfIp && isValidIp(cfIp)) {
      return { clientIp: cfIp, isTrusted: true, source: 'cf-connecting-ip' };
    }
  }

  // 2. Standard trusted reverse proxy (e.g. AWS ALB, Nginx, Vercel) with TRUST_PROXY="true"
  if (trustProxy) {
    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp && isValidIp(realIp)) {
      return { clientIp: realIp, isTrusted: true, source: 'x-real-ip' };
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // Split on comma, get first (client) IP, trim and validate
      const candidate = forwardedFor.split(',')[0]?.trim();
      if (candidate && isValidIp(candidate)) {
        return { clientIp: candidate, isTrusted: true, source: 'x-forwarded-for' };
      }
    }
  }

  // 3. Development / Test environment fallback (allows automated tests to simulate client IPs)
  if (!isProd) {
    const devForwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (devForwarded && isValidIp(devForwarded)) {
      return { clientIp: devForwarded, isTrusted: true, source: 'dev-fallback' };
    }
    const devRealIp = request.headers.get('x-real-ip')?.trim();
    if (devRealIp && isValidIp(devRealIp)) {
      return { clientIp: devRealIp, isTrusted: true, source: 'dev-fallback' };
    }
    return { clientIp: '127.0.0.1', isTrusted: false, source: 'dev-fallback' };
  }

  // 4. Production without configured trusted proxy: REJECT untrusted forwarded headers!
  // Fall back to a safe shared fallback bucket to prevent header spoofing attacks.
  return {
    clientIp: 'untrusted-direct-client',
    isTrusted: false,
    source: 'untrusted-fallback',
  };
}
