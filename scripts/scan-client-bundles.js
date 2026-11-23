const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.resolve(__dirname, '../apps/web/.next/static');

const FORBIDDEN_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'ADMIN_SESSION_SECRET',
  'POSTGRES_PASSWORD',
  'JWT_SECRET',
];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return fileList;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function runScan() {
  console.log(`=== BUNDLE & SECRET ISOLATION SCAN ===`);
  console.log(`Target Directory: ${STATIC_DIR}`);

  const files = getAllFiles(STATIC_DIR);
  console.log(`Scanning ${files.length} compiled client-side JavaScript / JSON bundle files...`);

  let leaksFound = 0;
  const leakedOccurrences = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(STATIC_DIR, file);

    for (const secretName of FORBIDDEN_SECRETS) {
      if (content.includes(secretName)) {
        leaksFound++;
        leakedOccurrences.push({ file: relPath, secretName });
        console.error(`[CRITICAL LEAK] Found forbidden secret identifier "${secretName}" in ${relPath}`);
      }
    }

    // Check for PostgreSQL connection string pattern postgresql://...
    if (/postgresql:\/\/[^:]+:[^@]+@/i.test(content)) {
      leaksFound++;
      leakedOccurrences.push({ file: relPath, secretName: 'RAW_DATABASE_CREDENTIALS' });
      console.error(`[CRITICAL LEAK] Found raw PostgreSQL connection credentials in ${relPath}`);
    }
  }

  console.log('\n--- SCAN RESULTS ---');
  if (leaksFound === 0) {
    console.log(`[PASS] ZERO SECRET LEAKS: 0 occurrences of backend environment secrets found across ${files.length} client bundles.`);
  } else {
    console.error(`[FAIL] Detected ${leaksFound} secret leaks in client bundles!`, leakedOccurrences);
    process.exit(1);
  }
}

runScan();
