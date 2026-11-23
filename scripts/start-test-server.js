const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const guard = verifyTestDatabaseSafeguards();
console.log(`[PASS] Environment Guard: Verified target DB "${guard.database}" on "${guard.host}".`);

const env = loadEnvTest();
const repoRoot = path.resolve(__dirname, '..');
const webDir = path.resolve(repoRoot, 'apps/web');

// Ensure Windows query engine dll is available in apps/web prisma locations
if (process.platform === 'win32') {
  const engineSrc = path.resolve(repoRoot, 'node_modules/.pnpm/@prisma+engines@6.19.3/node_modules/@prisma/engines/query_engine-windows.dll.node');
  if (fs.existsSync(engineSrc)) {
    const targets = [
      path.resolve(webDir, 'node_modules/.prisma/client'),
      path.resolve(webDir, '.prisma/client'),
      path.resolve(webDir, '.next/server'),
    ];
    for (const targetDir of targets) {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(engineSrc, path.resolve(targetDir, 'query_engine-windows.dll.node'));
    }
  }
}

const serverEnv = {
  ...process.env,
  DATABASE_URL: env.DATABASE_URL,
  DIRECT_URL: env.DIRECT_URL,
  ADMIN_AUTH_SECRET: env.ADMIN_AUTH_SECRET || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  CRON_SECRET: env.CRON_SECRET || 'c1d2e3f4a5b60718293a4b5c6d7e8f90c1d2e3f4a5b60718293a4b5c6d7e8f90',
  NODE_ENV: 'production',
  PORT: '3000',
  COD_POLICY_APPROVED: 'true',
  COD_ENABLED: 'true',
  MERCHANT_UPI_VPA: 'nava.creations@bharatpe',
  MERCHANT_ONBOARDING_APPROVED: 'true',
  TRUST_PROXY: 'true',
};

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['next', 'start', '-p', '3000'], {
  cwd: webDir,
  env: serverEnv,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code || 0);
});
