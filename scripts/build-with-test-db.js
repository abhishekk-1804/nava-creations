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
    ];
    for (const targetDir of targets) {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.copyFileSync(engineSrc, path.resolve(targetDir, 'query_engine-windows.dll.node'));
    }
  }
}

const buildEnv = {
  ...process.env,
  DATABASE_URL: env.DATABASE_URL,
  DIRECT_URL: env.DIRECT_URL,
  COD_POLICY_APPROVED: 'true',
  COD_ENABLED: 'true',
  MERCHANT_UPI_VPA: 'nava.creations@bharatpe',
  MERCHANT_ONBOARDING_APPROVED: 'true',
};

console.log('Running next build targeting test database...');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['next', 'build'], {
  cwd: webDir,
  env: buildEnv,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('[PASS] Next.js build completed successfully against test database.');
    process.exit(0);
  } else {
    console.error(`[FAIL] Next.js build failed with exit code ${code}`);
    process.exit(code || 1);
  }
});
