# NAVA CREATIONS — CI/CD PIPELINE, RELEASE ENGINEERING & ROLLBACK PROCEDURES
**Document ID:** `DOC-G2-PHASE12-CICD`  
**Generated At:** 2026-11-15T09:57:40+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** DevSecOps Lead & Principal Software Architect  

---

## 1. CONTINUOUS INTEGRATION & RELEASE ARCHITECTURE

NAVA CREATIONS enforces an automated, multi-stage CI/CD pipeline built on **GitHub Actions**, **Turborepo**, and **Vercel**. Every code change must pass four sequential quality gates before deployment:

```
+--------------------------------------------------------------------------------------------------+
|                                    GITHUB ACTIONS CI PIPELINE                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
| [ GATE 1: STATIC ANALYSIS ]                                                                      |
|   ├── pnpm lint         (ESLint 8 across apps & packages - 0 warnings, 0 errors)                 |
|   └── pnpm typecheck    (TypeScript 5.7 tsc --noEmit across 5 packages - 0 errors)               |
|            │                                                                                     |
|            v                                                                                     |
| [ GATE 2: DOMAIN & UNIT TESTS ]                                                                  |
|   ├── @nava/shared vitest run (3/3 passing)                                                      |
|   └── @nava/domain vitest run (73/73 passing)                                                     |
|            │                                                                                     |
|            v                                                                                     |
| [ GATE 3: APPLICATION BUILD ]                                                                    |
|   └── pnpm --filter @nava/web build (Next.js 15 production build - 38 routes compiled)           |
|            │                                                                                     |
|            v                                                                                     |
| [ GATE 4: FULL E2E AUTOMATION ]                                                                  |
|   ├── Spin up isolated PostgreSQL 16 container (nava_gateb_test)                                 |
|   ├── Execute forward Prisma migrations                                                          |
|   ├── Seed deterministic catalog & order fixtures                                                |
|   └── Execute Playwright Suite (162/162 passing tests in 4 parallel workers)                     |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
                                             │
                       (All 4 Gates PASS)    │
                                             v
+--------------------------------------------------------------------------------------------------+
|                                  DEPLOYMENT & PROMOTION MATRIX                                   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [ Feature Branch (PR) ]  ───> Vercel Preview Deployment (Ephemeral URL, Password Protected)   |
|                                                                                                  |
|   [ Merge to main ]        ───> Vercel Staging Deployment (staging.navacreations.com)            |
|                                                                                                  |
|   [ Git Tag (v*.*.*) ]     ───> Vercel Production Promotion (navacreations.com)                  |
|                                 - Required: Owner Sign-off + Smoke Probe Verification            |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. GITHUB ACTIONS WORKFLOW SPECIFICATION (`.github/workflows/ci.yml`)

```yaml
name: NAVA E-Commerce Production CI Pipeline

on:
  push:
    branches: [main, feature/production-readiness]
  pull_request:
    branches: [main]

jobs:
  verify:
    name: Monorepo Quality & E2E Verification
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: nava_test_user
          POSTGRES_PASSWORD: nava_test_password
          POSTGRES_DB: nava_gateb_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 12.18.0

      - name: Get pnpm Store Directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm Cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install Monorepo Dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify Code Quality (Lint & Typecheck)
        run: |
          pnpm lint
          pnpm typecheck

      - name: Execute Domain Unit Tests
        run: pnpm test

      - name: Verify Next.js Production Build
        run: pnpm --filter @nava/web build
        env:
          NEXT_PUBLIC_APP_URL: https://navacreations.com

      - name: Install Playwright Browsers
        run: pnpm --filter @nava/web exec playwright install --with-deps chromium

      - name: Execute Playwright E2E Suite (162 Tests)
        run: node scripts/run-e2e-suite.js e2e
        env:
          DATABASE_URL: postgresql://nava_test_user:nava_test_password@127.0.0.1:5432/nava_gateb_test
          ADMIN_AUTH_SECRET: d1c3e5f7a9b2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4
          CRON_SECRET: a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2
```

---

## 3. ZERO-DOWNTIME PROMOTION & DEPLOYMENT STRATEGY

1. **Immutable Build Artifacts:** Next.js produces standalone, immutable build bundles pinned to the Git commit SHA.
2. **Atomic Traffic Shift:** When promoting a new build, Vercel's global edge Anycast routers re-route incoming HTTP requests to the new lambda function instances within **$< 100\text{ milliseconds}$**. Existing in-flight requests finish on the prior deployment.
3. **Database Pre-Migration Compatibility:** Database schema changes must follow the **Expand/Contract Pattern**:
   - *Phase 1 (Expand):* Add new nullable columns or tables. Deploy code that writes to both old and new columns.
   - *Phase 2 (Contract):* Remove legacy columns in a subsequent release once all active code branches no longer read from them.

---

## 4. DUAL-TRACK ROLLBACK RUNBOOK

### 4.1 Track 1: Instant Application Code Rollback ($< 60$ Seconds)
If an unexpected edge crash, UI regression, or client-side defect occurs in production:
1. Open the Vercel Dashboard $\rightarrow$ **Deployments**.
2. Identify the previous certified production deployment (e.g. `Deployment #412`).
3. Click **Instant Rollback**.
4. Vercel shifts 100% of Anycast traffic back to `Deployment #412` instantly.
5. Zero rebuild or recompilation time required.

### 4.2 Track 2: Database Rollback Protocol (Forward-Only Compensating Migrations)
> [!CAUTION]
> **Why Downward Migrations Are Prohibited:**
> Running `prisma migrate down` or dropping columns in a production database destroys customer order history, active UTR references, and transaction audit trails.

**Safe Database Compensating Procedure:**
1. If an index or constraint causes unforeseen lock contention, draft a **forward compensating migration** (e.g. `20261115_drop_redundant_index`).
2. Verify migration on Staging database.
3. Apply to production via direct connection `DIRECT_URL`.
4. Document the incident in the system audit log.
