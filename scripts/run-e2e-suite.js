/**
 * NAVA CREATIONS — E2E TEST RUNNER WITH TEST DATABASE ISOLATION
 * Starts the production-built Next.js server with isolated test DB credentials from .env.test,
 * waits for HTTP readiness, runs the specified Playwright spec(s), and cleanly tears down.
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

async function main() {
  const targetSpec = process.argv[2] || 'e2e/orders-checkout.spec.ts';
  console.log('=============================================================');
  console.log('NAVA CREATIONS — PLAYWRIGHT E2E TEST RUNNER');
  console.log(`Target Spec: ${targetSpec}`);
  console.log('=============================================================');

  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Guard verified: Target DB "${guard.database}" on "${guard.host}".`);

  // Ensure database fixtures are seeded and reset to known initial state
  console.log('\n[0/3] Resetting test database fixtures...');
  const { execFileSync } = require('child_process');
  execFileSync('node', [path.resolve(__dirname, 'seed-test-database.js')], { stdio: 'inherit' });

  const env = loadEnvTest();
  const serverEnv = {
    ...process.env,
    DATABASE_URL: env.DATABASE_URL,
    DIRECT_URL: env.DIRECT_URL,
    ADMIN_AUTH_SECRET: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    CRON_SECRET: 'c1d2e3f4a5b60718293a4b5c6d7e8f90c1d2e3f4a5b60718293a4b5c6d7e8f90',
    MERCHANT_UPI_VPA: 'bharatpe.9886000000@fbpe',
    MERCHANT_ONBOARDING_APPROVED: 'true',
    MERCHANT_DISPLAY_NAME: 'NAVA CREATIONS',
    COD_ENABLED: 'true',
    COD_POLICY_APPROVED: 'true',
    NODE_ENV: 'production',
    APP_ENV: 'test',
    TRUST_PROXY: 'true',
    PORT: '3000',
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
  };

  console.log('\n[1/3] Starting Next.js server on port 3000...');
  const webAppDir = path.resolve(__dirname, '../apps/web');
  const serverProc = spawn('npx', ['next', 'start', '-p', '3000'], {
    cwd: webAppDir,
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  serverProc.stdout.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg.includes('Ready') || msg.includes('Starting')) {
      console.log(`[SERVER] ${msg}`);
    }
  });

  serverProc.stderr.on('data', (d) => {
    console.error(`[SERVER ERR] ${d.toString().trim()}`);
  });

  // Wait for server to become responsive
  console.log('[2/3] Waiting for server readiness at http://127.0.0.1:3000...');
  let ready = false;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:3000/api/cart/validate', { timeout: 2000 }, (res) => {
          // Any HTTP status indicates the server is alive and answering
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('timeout')));
      });
      ready = true;
      console.log(`[PASS] Server is READY after ${i + 1}s.`);
      break;
    } catch {
      if ((i + 1) % 5 === 0) {
        console.log(`       Waiting... ${i + 1}s`);
      }
    }
  }

  if (!ready) {
    serverProc.kill('SIGKILL');
    console.error('[FAIL] Server failed to become ready within 60s.');
    process.exit(1);
  }

  // Run Playwright
  console.log(`\n[3/3] Executing Playwright: ${targetSpec}...`);
  const testProc = spawn(
    'npx',
    ['playwright', 'test', targetSpec, '--project=chromium', '--reporter=list'],
    {
      cwd: webAppDir,
      env: {
        ...process.env,
        ADMIN_AUTH_SECRET: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
        CRON_SECRET: 'c1d2e3f4a5b60718293a4b5c6d7e8f90c1d2e3f4a5b60718293a4b5c6d7e8f90',
        NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
      },
      stdio: 'inherit',
      shell: true,
    }
  );

  testProc.on('close', (code) => {
    console.log(`\n[CLEANUP] Stopping Next.js server (PID ${serverProc.pid})...`);
    serverProc.kill('SIGTERM');
    setTimeout(() => {
      try {
        serverProc.kill('SIGKILL');
      } catch {}
    }, 2000);

    console.log(`=============================================================`);
    if (code === 0) {
      console.log(`[PASS] Playwright spec "${targetSpec}" PASSED (Exit code: 0)`);
    } else {
      console.error(`[FAIL] Playwright spec "${targetSpec}" FAILED (Exit code: ${code})`);
    }
    console.log(`=============================================================`);
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
