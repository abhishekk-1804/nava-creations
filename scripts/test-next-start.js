const { spawn } = require('child_process');
const http = require('http');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const guard = verifyTestDatabaseSafeguards();
console.log(`[PASS] Environment Guard: Verified target DB "${guard.database}" on "${guard.host}".`);

const env = loadEnvTest();
const serverEnv = {
  ...process.env,
  DATABASE_URL: env.DATABASE_URL,
  DIRECT_URL: env.DIRECT_URL,
  NODE_ENV: 'production',
  PORT: '3000',
};

console.log('Starting next start on port 3000 with test DB...');
const child = spawn('npx', ['next', 'start', '-p', '3000'], {
  cwd: '/mnt/d/NAVA/apps/web',
  env: serverEnv,
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdout.on('data', (d) => process.stdout.write(`[SERVER OUT] ${d}`));
child.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

async function checkServer() {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:3000/api/cart/validate', { timeout: 3000 }, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('HTTP request timeout')));
      });
      console.log(`[PASS] Server responded! Status: ${res.status}`);
      child.kill('SIGTERM');
      process.exit(0);
    } catch (e) {
      console.log(`Waiting for server... attempt ${i + 1}: ${e.message}`);
    }
  }
  console.error('[FAIL] Server did not become ready in 30s');
  child.kill('SIGKILL');
  process.exit(1);
}

checkServer();
