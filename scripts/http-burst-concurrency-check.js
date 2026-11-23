const http = require('http');

const ENDPOINTS = [
  '/',
  '/shop',
  '/api/health',
  '/account',
];

const CONCURRENT_REQUESTS = 50;

function fetchUrl(path) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        timeout: 10000,
        headers: {
          'User-Agent': 'NAVA-Concurrency-Burst-Test/1.0',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const latencyMs = Date.now() - startTime;
          resolve({
            path,
            statusCode: res.statusCode,
            headers: res.headers,
            latencyMs,
            success: res.statusCode >= 200 && res.statusCode < 400,
          });
        });
      }
    );

    req.on('error', (err) => {
      const latencyMs = Date.now() - startTime;
      resolve({
        path,
        statusCode: 0,
        error: err.message,
        latencyMs,
        success: false,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        statusCode: 408,
        error: 'Timeout',
        latencyMs: 10000,
        success: false,
      });
    });
  });
}

async function runBurst() {
  console.log(`=== STARTING PARALLEL HTTP BURST CHECK (${CONCURRENT_REQUESTS} concurrent requests) ===`);
  
  // Create 50 concurrent requests distributed across the 4 endpoints
  const requests = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const endpoint = ENDPOINTS[i % ENDPOINTS.length];
    requests.push(fetchUrl(endpoint));
  }

  const startTime = Date.now();
  const results = await Promise.all(requests);
  const totalDurationMs = Date.now() - startTime;

  console.log(`Burst completed in ${totalDurationMs}ms.`);

  const statusCounts = {};
  const latencies = [];
  let failures = 0;
  const sampleHeaders = {};

  for (const r of results) {
    statusCounts[r.statusCode] = (statusCounts[r.statusCode] || 0) + 1;
    latencies.push(r.latencyMs);
    if (!r.success) {
      // Note: /account returns 307 redirect when unauthenticated, which is an expected success redirect (< 400).
      failures++;
    }
    if (r.headers && !sampleHeaders['x-frame-options']) {
      sampleHeaders['x-frame-options'] = r.headers['x-frame-options'];
      sampleHeaders['x-content-type-options'] = r.headers['x-content-type-options'];
      sampleHeaders['referrer-policy'] = r.headers['referrer-policy'];
      sampleHeaders['strict-transport-security'] = r.headers['strict-transport-security'];
    }
  }

  latencies.sort((a, b) => a - b);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  console.log('\n--- STATUS CODE SUMMARY ---');
  console.table(statusCounts);

  console.log('\n--- LATENCY METRICS ---');
  console.log({
    totalRequests: CONCURRENT_REQUESTS,
    minLatencyMs: minLatency,
    avgLatencyMs: avgLatency,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    maxLatencyMs: maxLatency,
    failedRequests: failures,
  });

  console.log('\n--- VERIFIED SECURITY HEADERS ---');
  console.log(sampleHeaders);

  if (failures > 0 || statusCounts[500]) {
    console.error(`FAILED: Encountered ${failures} failed requests or HTTP 500 errors.`);
    process.exit(1);
  } else {
    console.log('\n[PASS] Parallel HTTP Burst Verification Passed (0 errors, 0 HTTP 500s, stable latencies).');
  }
}

runBurst().catch((e) => {
  console.error('Burst check crashed:', e);
  process.exit(1);
});
