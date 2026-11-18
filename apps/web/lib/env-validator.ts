export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const WEAK_SECRETS = new Set([
  'placeholder',
  'placeholder_minimum_32_character_cryptographic_secret',
  'nava-default-fallback-secret-256',
  'nava-cron-secret-2026-safe',
  'change-me',
  'secret',
  'admin',
  'password',
  '1234567890',
]);

/**
 * Validates critical environment variables and secrets.
 * Enforces strict fail-closed requirements in production.
 */
export function validateEnvironment(env: Record<string, string | undefined> = process.env): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = env.NODE_ENV === 'production';

  // 1. ADMIN_AUTH_SECRET validation
  const adminSecret = env.ADMIN_AUTH_SECRET?.trim();
  if (!adminSecret) {
    if (isProduction) {
      errors.push('ADMIN_AUTH_SECRET is required in production.');
    } else {
      warnings.push('ADMIN_AUTH_SECRET is missing; using development-only dynamic secret.');
    }
  } else {
    if (adminSecret.length < 32) {
      if (isProduction) {
        errors.push(`ADMIN_AUTH_SECRET must be at least 32 characters in production (currently ${adminSecret.length}).`);
      } else {
        warnings.push(`ADMIN_AUTH_SECRET has only ${adminSecret.length} characters (recommended >= 32).`);
      }
    }
    if (isProduction && WEAK_SECRETS.has(adminSecret.toLowerCase())) {
      errors.push('ADMIN_AUTH_SECRET is configured with a known weak or placeholder value.');
    }
  }

  // 2. CRON_SECRET validation
  const cronSecret = env.CRON_SECRET?.trim();
  if (!cronSecret) {
    if (isProduction) {
      errors.push('CRON_SECRET is required in production for scheduled reservation cleanup.');
    } else {
      warnings.push('CRON_SECRET is unconfigured.');
    }
  } else {
    if (cronSecret.length < 32) {
      if (isProduction) {
        errors.push(`CRON_SECRET must be at least 32 characters in production (currently ${cronSecret.length}).`);
      } else {
        warnings.push(`CRON_SECRET has only ${cronSecret.length} characters (recommended >= 32).`);
      }
    }
    if (isProduction && WEAK_SECRETS.has(cronSecret.toLowerCase())) {
      errors.push('CRON_SECRET is configured with a known weak or placeholder value.');
    }
  }

  // 3. Database URL validation
  const dbUrl = env.DATABASE_URL?.trim();
  if (!dbUrl) {
    if (isProduction) {
      errors.push('DATABASE_URL is required in production.');
    }
  } else {
    if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
      errors.push('DATABASE_URL must be a valid postgresql:// connection string.');
    }
    if (isProduction && (dbUrl.includes('placeholder') || dbUrl.includes('ep-sample'))) {
      errors.push('DATABASE_URL contains placeholder host credentials in production.');
    }
  }

  // 4. Anti-Bypass Guard: APP_ENV cannot downgrade production
  if (isProduction && env.APP_ENV === 'test') {
    warnings.push('APP_ENV=test detected while NODE_ENV=production. Production security guards remain strictly authoritative.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts production secrets are valid. Fails closed with an error in production.
 */
export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV === 'production') {
    const result = validateEnvironment();
    if (!result.isValid) {
      console.error('[SECURITY FATAL] Production environment validation failed:\n' + result.errors.map(e => ` - ${e}`).join('\n'));
      throw new Error(`Production environment configuration error: ${result.errors.join('; ')}`);
    }
  }
}
