const { loadEnvTest } = require('./test-db-guard');
const { execFileSync } = require('child_process');

const env = loadEnvTest();
const PSQL = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

const out = execFileSync(PSQL, [
  '-h', '127.0.0.1',
  '-p', '5432',
  '-U', 'nava_migrator',
  '-d', 'nava_gateb_test',
  '-w',
  '-c', 'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at;'
], {
  env: { ...process.env, PGPASSWORD: env.NAVA_MIGRATOR_PASSWORD },
  encoding: 'utf8'
});

console.log(out);
