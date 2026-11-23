/**
 * Generates high-entropy local random passwords for test roles nava_migrator and nava_app.
 * Updates .env.test with URL-safe 64-character hex secrets.
 * NEVER prints passwords to console.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envTestPath = path.resolve(__dirname, '..', '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.error('ERROR: .env.test not found at', envTestPath);
  process.exit(1);
}

const migratorPw = crypto.randomBytes(32).toString('hex');
const appPw = crypto.randomBytes(32).toString('hex');

let content = fs.readFileSync(envTestPath, 'utf8');

// Preserve existing POSTGRES_ADMIN_PASSWORD if set
const adminMatch = content.match(/^POSTGRES_ADMIN_PASSWORD=(.*)$/m);
const currentAdminPw = adminMatch ? adminMatch[1] : 'REPLACE_WITH_YOUR_POSTGRES_ADMIN_PASSWORD';

const newContent = `# =============================================================================
# NAVA CREATIONS — GATE B ISOLATED TEST ENVIRONMENT CONFIGURATION
# =============================================================================
# This file is strictly GIT-IGNORED. Never commit this file or expose secrets.
# Target: Dedicated Isolated Local PostgreSQL 16 Test Database ONLY
# =============================================================================

NAVA_GATE_B_TEST_DB=true
EXPECTED_TEST_DB_HOST=127.0.0.1
EXPECTED_TEST_DB_NAME=nava_gateb_test

# -----------------------------------------------------------------------------
# 1. Administrative Bootstrap Credentials (BOOTSTRAP ONLY)
# Used exclusively by scripts/init-test-db.js to create database and roles.
# Never used by application runtime or Prisma migrations.
# -----------------------------------------------------------------------------
POSTGRES_ADMIN_PASSWORD=${currentAdminPw}

# -----------------------------------------------------------------------------
# 2. Migration Role Credentials (DIRECT_URL)
# User: nava_migrator (Owns tables, executes DDL migrations via DIRECT_URL)
# -----------------------------------------------------------------------------
NAVA_MIGRATOR_PASSWORD=${migratorPw}
DIRECT_URL="postgresql://nava_migrator:${migratorPw}@127.0.0.1:5432/nava_gateb_test?schema=public"

# -----------------------------------------------------------------------------
# 3. Application Runtime Credentials (DATABASE_URL)
# User: nava_app (Least-privilege DML only: SELECT, INSERT, UPDATE, DELETE)
# -----------------------------------------------------------------------------
NAVA_APP_PASSWORD=${appPw}
DATABASE_URL="postgresql://nava_app:${appPw}@127.0.0.1:5432/nava_gateb_test?schema=public"

# -----------------------------------------------------------------------------
# 4. Test Environment Flags
# -----------------------------------------------------------------------------
NODE_ENV=test
SKIP_ENV_VALIDATION=true
`;

fs.writeFileSync(envTestPath, newContent, 'utf8');
console.log('SUCCESS: High-entropy random passwords generated for nava_migrator and nava_app.');
console.log('DIRECT_URL and DATABASE_URL updated with URL-safe 64-char hex credentials.');
