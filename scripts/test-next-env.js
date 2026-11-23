const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

const guard = verifyTestDatabaseSafeguards();
console.log('[PASS] Guard passed for:', guard.database, 'on', guard.host);

const env = loadEnvTest();
process.env.DATABASE_URL = env.DATABASE_URL;
process.env.DIRECT_URL = env.DIRECT_URL;
process.env.NODE_ENV = 'test';

// Test Next.js env precedence
const { loadEnvConfig } = require('../node_modules/.pnpm/next@15.5.29_@playwright+test@1.65.0_@types+node@22.20.5_react-dom@19.3.1_react@19.3.1__react@19.3.1/node_modules/@next/env');
const projectDir = require('path').resolve(__dirname, '../apps/web');

const loaded = loadEnvConfig(projectDir);
console.log('After loadEnvConfig:');
console.log('DATABASE_URL includes neon?:', process.env.DATABASE_URL.includes('neon.tech'));
console.log('DATABASE_URL includes gateb_test?:', process.env.DATABASE_URL.includes('nava_gateb_test'));
