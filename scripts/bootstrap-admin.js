/**
 * NAVA CREATIONS — Local Admin Bootstrap Script
 *
 * Allows the store owner to bootstrap or reset an administrator account
 * in the local prototype database (nava_prototype_dev).
 *
 * Usage:
 *   node scripts/bootstrap-admin.js
 *   node scripts/bootstrap-admin.js --email=owner@nava-creations.in --password=MySecretPassword! --name="NAVA Founder"
 */

const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

// Load environment variables from apps/web/.env.local or apps/web/.env
const envLocalPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env');
const activeEnvPath = fs.existsSync(envLocalPath) ? envLocalPath : envPath;

if (fs.existsSync(activeEnvPath)) {
  const content = fs.readFileSync(activeEnvPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Fallback to local prototype dev connection
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://nava_app:3b2133a8b9865153e6060e2506b751c5b681821a801acc69e0924c419343b2ba@127.0.0.1:5432/nava_prototype_dev?schema=public';

process.env.DATABASE_URL = DATABASE_URL;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    email: 'admin@nava-creations.internal',
    password: 'Admin@Nava2026!',
    name: 'NAVA Studio Administrator',
  };

  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      result.email = arg.slice('--email='.length).trim();
    } else if (arg.startsWith('--password=')) {
      result.password = arg.slice('--password='.length).trim();
    } else if (arg.startsWith('--name=')) {
      result.name = arg.slice('--name='.length).trim();
    }
  }

  return result;
}

// Scrypt password hasher matching apps/web/lib/customer-auth.ts
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  const { email, password, name } = parseArgs();
  console.log('=== NAVA CREATIONS — ADMIN BOOTSTRAPPER ===');
  console.log(`Database Target: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Admin Email:     ${email}`);
  console.log(`Admin Name:      ${name}`);

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const passwordHash = await hashPassword(password);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      create: {
        email,
        name,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('\n[PASS] Administrator Account Ready!');
    console.log(`  ID:    ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role:  ${admin.role}`);
    console.log('\nYou can now log into the Studio Administration Portal:');
    console.log('  URL:      http://localhost:3000/admin/login');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('============================================\n');
  } catch (err) {
    console.error('[FAIL] Error bootstrapping admin account:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
