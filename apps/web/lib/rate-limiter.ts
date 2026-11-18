/**
 * Rate Limiter for Authentication & Sensitive Endpoints
 * 
 * Supports:
 * 1. Distributed Shared-Store (Upstash Redis REST API) for multi-instance deployments (serverless, edge, cluster).
 * 2. In-Memory Sliding-Window fallback for local development or when Redis is unconfigured/unreachable.
 * 3. Atomic counter increment with fixed window expiry semantics (never extends lockout indefinitely).
 * 4. Production observability with degraded state logging and response header tagging.
 */

export type RateLimitBackend = 'memory' | 'upstash_redis' | 'memory_fallback';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  backend: RateLimitBackend;
  simulationTag?: string;
  degraded?: boolean;
}

interface MemoryRecord {
  count: number;
  resetAt: number;
}

const globalForMemoryRecords = globalThis as unknown as { memoryRateLimiterRecords?: Map<string, MemoryRecord> };
const sharedRecords = globalForMemoryRecords.memoryRateLimiterRecords ?? new Map<string, MemoryRecord>();
if (process.env.NODE_ENV !== 'production') {
  globalForMemoryRecords.memoryRateLimiterRecords = sharedRecords;
}

export class MemoryRateLimiter {
  private records = sharedRecords;

  check(
    key: string,
    maxAttempts = 10,
    windowMs = 15 * 60 * 1000
  ): { allowed: boolean; remaining: number; resetInSeconds: number } {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetAt) {
      return {
        allowed: true,
        remaining: maxAttempts,
        resetInSeconds: Math.ceil(windowMs / 1000),
      };
    }

    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    if (record.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - record.count),
      resetInSeconds,
    };
  }

  recordFailure(key: string, windowMs = 15 * 60 * 1000): void {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetAt) {
      this.records.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
    } else {
      record.count += 1;
    }
  }

  reset(key: string): void {
    this.records.delete(key);
  }
}

export class HybridRateLimiter {
  private memory = new MemoryRateLimiter();

  isRedisConfigured(): boolean {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    return Boolean(
      url &&
      token &&
      !url.includes('sample-redis') &&
      !token.includes('placeholder') &&
      url.startsWith('https://')
    );
  }

  /**
   * Synchronous check against local in-memory store (for testing or zero-overhead scenarios).
   */
  check(
    key: string,
    maxAttempts = 10,
    windowMs = 15 * 60 * 1000
  ): { allowed: boolean; remaining: number; resetInSeconds: number } {
    return this.memory.check(key, maxAttempts, windowMs);
  }

  /**
   * Primary asynchronous rate-limit check.
   * Uses Upstash Redis when configured; falls back safely to memory with explicit audit headers.
   */
  async checkDistributed(
    key: string,
    maxAttempts = 10,
    windowSeconds = 900
  ): Promise<RateLimitResult> {
    if (!this.isRedisConfigured()) {
      const res = this.memory.check(key, maxAttempts, windowSeconds * 1000);
      return { ...res, backend: 'memory', simulationTag: '[UNIT_SIMULATION_ONLY]' };
    }

    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    const redisKey = `ratelimit:auth:${key}`;

    try {
      const response = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['GET', redisKey],
          ['TTL', redisKey],
        ]),
        signal: AbortSignal.timeout(1500),
      });

      if (!response.ok) {
        throw new Error(`Redis pipeline failed with HTTP ${response.status}`);
      }

      const results = await response.json();
      const currentCount = parseInt(results[0]?.result || '0', 10);
      const ttl = parseInt(results[1]?.result || '-1', 10);
      const resetInSeconds = ttl > 0 ? ttl : windowSeconds;

      if (currentCount >= maxAttempts) {
        return {
          allowed: false,
          remaining: 0,
          resetInSeconds,
          backend: 'upstash_redis',
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxAttempts - currentCount),
        resetInSeconds,
        backend: 'upstash_redis',
      };
    } catch (err) {
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        console.error(
          `[RateLimiter:CRITICAL] Upstash Redis unreachable in production! Falling back to process memory limiter for key "${key}". Error:`,
          err instanceof Error ? err.message : err
        );
      }

      const res = this.memory.check(key, maxAttempts, windowSeconds * 1000);
      return {
        ...res,
        backend: isProd ? 'memory_fallback' : 'memory',
        degraded: isProd,
      };
    }
  }

  /**
   * Atomically records a failed attempt.
   * When using Redis, sets TTL only on the first failure to prevent extending the lockout window.
   */
  async recordFailure(key: string, windowSeconds = 900): Promise<void> {
    this.memory.recordFailure(key, windowSeconds * 1000);

    if (this.isRedisConfigured()) {
      const url = process.env.UPSTASH_REDIS_REST_URL!;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
      const redisKey = `ratelimit:auth:${key}`;

      try {
        // Atomic Lua script: INCR and only set EXPIRE if count == 1 (first attempt)
        const luaScript =
          "local c = redis.call('INCR', KEYS[1]); if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return c;";

        await fetch(`${url}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['EVAL', luaScript, '1', redisKey, String(windowSeconds)],
          ]),
          signal: AbortSignal.timeout(2000),
        });
      } catch (err) {
        // Fallback already recorded in local memory
        console.warn(
          `[RateLimiter] Failed to record failure in Redis for "${key}":`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  /**
   * Clears the failed attempt count upon successful authentication.
   */
  async reset(key: string): Promise<void> {
    this.memory.reset(key);

    if (this.isRedisConfigured()) {
      const url = process.env.UPSTASH_REDIS_REST_URL!;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
      const redisKey = `ratelimit:auth:${key}`;

      try {
        await fetch(`${url}/del/${redisKey}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(2000),
        });
      } catch (_err) {
        // Ignore deletion failures
      }
    }
  }
}

const globalForRateLimiter = globalThis as unknown as { authRateLimiter?: HybridRateLimiter };
export const authRateLimiter = globalForRateLimiter.authRateLimiter ?? new HybridRateLimiter();
if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiter.authRateLimiter = authRateLimiter;
}
