# Portfolio App "Now"-Tier Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap the embedding provider from OpenRouter to Cohere, lock down CORS, add IP-based rate limiting to `/api/chat`, fix retrieval quality (degraded-response signal, Neo4j N+1 queries, a golden-set regression test), repair the broken production keepalive mechanism, and gate commits to `main` on lint + production DB health + verified ingestion via a local pre-commit hook — instead of the current setup where a broken ingestion step inside the GitHub Actions `build` job fails the whole deploy.

**Architecture:** Two backend service functions (`ragService.ts`, `ingest.ts`) switch their embedding HTTP call from OpenRouter's `/embeddings` to Cohere's `/v2/embed`, reusing the `COHERE_API_KEY`/`COHERE_BASE_URL` already wired for reranking. `.github/workflows/deploy.yml` drops resume ingestion entirely — it goes back to just building and deploying the static frontend. In its place, a committed `.githooks/pre-commit` script blocks `git commit` on the `main` branch unless frontend lint passes, the production databases are reachable, and — only when resume/profile files are staged — the ingestion pipeline runs and a new verification script confirms it actually wrote data. A new `express-rate-limit` middleware protects the costly `/api/chat` endpoint. `ragService.ts`'s Neo4j graph search collapses from O(keywords) queries to a fixed 3, and `RetrievalResult` gains a `degraded` flag. The in-process `setTimeout`-based keepalive scheduler (dead in Vercel's serverless runtime) is removed in favor of a GitHub Actions scheduled workflow hitting the existing `/api/cron/keepalive` route.

**Tech Stack:** TypeScript, Express, Vitest, Cohere REST API (`/v2/embed`), Neo4j Cypher, `express-rate-limit`, Bash, native Git hooks (`core.hooksPath`), GitHub Actions (including scheduled workflows).

**Spec:** `docs/superpowers/specs/2026-08-24-portfolio-app-improvements-design.md` (sections 1, 2, 3, and 4 — this plan implements the full "Now" priority tier as revised in-conversation: the CI/CD gate moved from GitHub Actions to a local pre-commit hook, and RAG-quality/rate-limiting/keepalive items were pulled forward from "Next"/"Later" into this plan. Structured logging and SEO/accessibility polish remain separate future work.)

## Global Constraints

- Chat completion (OpenRouter/NVIDIA NIM via `llmService.ts`) is untouched — only embedding calls move to Cohere.
- Frontend animation code (`framer-motion` usage) is untouched.
- Reuse the existing `COHERE_API_KEY` / `COHERE_BASE_URL` env vars (already used by `rerankCandidates` in `ragService.ts`) — don't introduce a second Cohere credential.
- New embedding model: `embed-english-v3.0`, dimension **1024**. Every place that currently assumes 768 (mock embedding arrays, keepalive dummy vector) must move to 1024.
- The `apiKey === "mock-key"` short-circuit pattern (used throughout the codebase for tests/local dev without real credentials) must be preserved for the new Cohere embedding calls.
- CI (`deploy.yml`) no longer runs ingestion, backend tests, or a DB health check — that gate now lives entirely in the pre-commit hook. Deploy only ever depends on the frontend building and linting successfully.
- The pre-commit hook only runs its checks when committing directly to `main`; other branches are unaffected.
- Ingestion inside the hook only runs when staged files touch `frontend/public/resumes/**` or `frontend/lib/documentTree.json` — never on unrelated commits.
- `.env*` files are gitignored repo-wide (`.gitignore:35`) and must never be `git add`ed — edits to `.env.prod`/`.env.production` are local-only, no commit step.
- Production backend runs on Vercel as a serverless function (confirmed via `NEXT_PUBLIC_BACKEND_URL` pointing at a `.vercel.app` domain) — anything that assumes a long-lived process (e.g. `setTimeout` chains spanning hours) does not work there and must not be relied on.
- Rate limiting applies to `POST /api/chat` only (the endpoint that triggers paid embedding/rerank/LLM calls per request) — not `/api/chat/history`, `/api/analytics`, or `/api/cron/keepalive`.

---

### Task 1: Cohere embedding for query retrieval

**Files:**
- Modify: `backend/src/services/ragService.ts:204-228` (`getQueryEmbedding`)
- Test: `backend/src/services/ragService.test.ts`

**Interfaces:**
- Produces: `getQueryEmbedding(text: string): Promise<number[]>` — same signature as before, now returns a 1024-length vector via Cohere instead of a 768-length vector via OpenRouter. No callers outside this file need to change (`retrieveHybridContextDetailed` just calls it).

- [ ] **Step 1: Replace the function body**

Replace lines 204-228 of `backend/src/services/ragService.ts`:

```typescript
// Fetch embeddings for Qdrant querying
async function getQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.COHERE_API_KEY?.trim();
  const model = process.env.COHERE_EMBEDDING_MODEL?.trim() || "embed-english-v3.0";
  const baseUrl = process.env.COHERE_BASE_URL?.trim() || "https://api.cohere.com/v2";

  if (!apiKey || apiKey === "mock-key") {
    return Array.from({ length: 1024 }, () => Math.random() - 0.5);
  }

  const res = await fetch(`${baseUrl}/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      texts: [text.replace(/\n/g, " ")],
      input_type: "search_query",
      embedding_types: ["float"]
    }),
    signal: AbortSignal.timeout(1000)
  });

  if (!res.ok) {
    throw new Error(`Embedding API failed during RAG retrieval: ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  return data.embeddings.float[0];
}
```

- [ ] **Step 2: Run the existing test to confirm it still passes**

`ragService.test.ts` already sets `process.env.COHERE_API_KEY = "mock-key"` before calling `retrieveHybridContext`, which now hits the mock branch of `getQueryEmbedding` too (previously only used for rerank). No test code changes needed.

Run: `cd backend && npx vitest run src/services/ragService.test.ts`
Expected: PASS (1 test)

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/ragService.ts
git commit -m "feat: switch query embedding from OpenRouter to Cohere"
```

---

### Task 2: Cohere embedding for ingestion

**Files:**
- Modify: `backend/src/scripts/ingest.ts:20-53` (`getEmbedding`)
- Test: `backend/src/scripts/ingest.test.ts`

**Interfaces:**
- Produces: `getEmbedding(text: string): Promise<number[]>` — same signature, 1024-length vector via Cohere. `ingestResume()` still calls `getEmbedding` to determine `embeddingDim` dynamically and create the Qdrant collection at that size.

- [ ] **Step 1: Replace the function body**

Replace lines 20-53 of `backend/src/scripts/ingest.ts`:

```typescript
async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.COHERE_API_KEY?.trim();
  const model = process.env.COHERE_EMBEDDING_MODEL?.trim() || "embed-english-v3.0";
  const baseUrl = process.env.COHERE_BASE_URL?.trim() || "https://api.cohere.com/v2";

  if (!apiKey || apiKey === "mock-key") {
    // Generate a mock 1024-dimensional embedding for testing/fallback
    const embedding = Array.from({ length: 1024 }, () => Math.random() - 0.5);
    return embedding;
  }

  const res = await fetch(`${baseUrl}/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      texts: [text.replace(/\n/g, " ")],
      input_type: "search_document",
      embedding_types: ["float"]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Embedding API failed: ${res.status} ${res.statusText} - ${errorText}`);
  }

  const data = (await res.json()) as any;
  if (!data?.embeddings?.float?.[0]) {
    throw new Error(`Invalid response structure from embedding API: ${JSON.stringify(data)}`);
  }

  return data.embeddings.float[0];
}
```

- [ ] **Step 2: Update the test's mock-key env var**

In `backend/src/scripts/ingest.test.ts`, line 45 sets `process.env.OPENROUTER_API_KEY = "mock-key"` — that no longer triggers the mock branch. Change it:

```typescript
  it("should successfully run the ingestion logic", async () => {
    // We override process.env to ensure mock embedding is used
    process.env.COHERE_API_KEY = "mock-key";
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `cd backend && npx vitest run src/scripts/ingest.test.ts`
Expected: PASS (1 test)

- [ ] **Step 4: Commit**

```bash
git add backend/src/scripts/ingest.ts backend/src/scripts/ingest.test.ts
git commit -m "feat: switch ingestion embedding from OpenRouter to Cohere"
```

---

### Task 3: Fix hardcoded embedding dimension in keepalive check

**Files:**
- Modify: `backend/src/services/keepaliveScheduler.ts:40`
- Create: `backend/src/services/keepaliveScheduler.test.ts`

**Interfaces:**
- Consumes: `qdrantClient.search(collectionName, { vector, limit })` from `backend/src/config/db.js` (already mocked in `routes/keepalive.test.ts` with this same shape).
- No new exports — `runKeepaliveOperations` signature is unchanged.

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/keepaliveScheduler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runKeepaliveOperations } from "./keepaliveScheduler.js";
import { mongoClient, qdrantClient, getNeo4jSession } from "../config/db.js";

vi.mock("../config/db.js", () => {
  const mockDb = {
    command: vi.fn().mockResolvedValue({ ok: 1 }),
    collection: vi.fn().mockReturnValue({
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    })
  };

  const mockSession = {
    run: vi.fn().mockResolvedValue({
      records: [{ get: () => 1 }]
    }),
    close: vi.fn().mockResolvedValue({})
  };

  return {
    mongoClient: { db: vi.fn().mockReturnValue(mockDb) },
    qdrantClient: {
      getCollections: vi.fn().mockResolvedValue({ collections: [{ name: "resume_chunks" }] }),
      search: vi.fn().mockResolvedValue([])
    },
    getNeo4jSession: vi.fn().mockReturnValue(mockSession)
  };
});

describe("Keepalive Scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should query Qdrant with a 1024-dimension dummy vector", async () => {
    await runKeepaliveOperations();

    expect(qdrantClient.search).toHaveBeenCalledWith(
      "resume_chunks",
      expect.objectContaining({ vector: expect.arrayContaining([0.01]) })
    );
    const callArgs = (qdrantClient.search as any).mock.calls[0][1];
    expect(callArgs.vector).toHaveLength(1024);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/keepaliveScheduler.test.ts`
Expected: FAIL — `callArgs.vector` has length 768, not 1024

- [ ] **Step 3: Fix the hardcoded dimension**

In `backend/src/services/keepaliveScheduler.ts`, line 40:

```typescript
        await qdrantClient.search(collectionName, {
          vector: Array(1024).fill(0.01),
          limit: 1
        });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/services/keepaliveScheduler.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/keepaliveScheduler.ts backend/src/services/keepaliveScheduler.test.ts
git commit -m "fix: match keepalive dummy vector dimension to Cohere embedding size"
```

---

### Task 4: CORS origin allowlist

**Files:**
- Modify: `backend/src/index.ts`
- Test: `backend/src/index.test.ts`

**Interfaces:**
- No exported interface changes — `app` (default export) behavior changes: requests with an `Origin` header not in `ALLOWED_ORIGINS` now get `403` instead of being reflected and allowed.
- New env var: `ALLOWED_ORIGINS` — comma-separated list of allowed origins. If unset or empty, CORS stays permissive (matches current behavior).

- [ ] **Step 1: Write the failing tests**

Add to `backend/src/index.test.ts`:

```typescript
import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import app from "./index.js";

describe("GET /health", () => {
  it("should return healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});

describe("CORS allowlist", () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it("should allow any origin when ALLOWED_ORIGINS is unset", async () => {
    const res = await request(app).get("/health").set("Origin", "https://anything.example.com");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://anything.example.com");
  });

  it("should reject an origin not in ALLOWED_ORIGINS", async () => {
    process.env.ALLOWED_ORIGINS = "https://rohandhanraj.github.io";
    const res = await request(app).get("/health").set("Origin", "https://evil.example.com");
    expect(res.status).toBe(403);
  });

  it("should allow an origin listed in ALLOWED_ORIGINS", async () => {
    process.env.ALLOWED_ORIGINS = "https://rohandhanraj.github.io";
    const res = await request(app).get("/health").set("Origin", "https://rohandhanraj.github.io");
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `cd backend && npx vitest run src/index.test.ts`
Expected: the "reject an origin not in ALLOWED_ORIGINS" test FAILs (currently always allowed, so status is 200 not 403)

- [ ] **Step 3: Implement the allowlist**

In `backend/src/index.ts`, replace:

```typescript
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
```

with:

```typescript
const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());
```

And after the route mounts (after line `app.use("/api/cron/keepalive", keepaliveRouter);`), add an error handler so a rejected CORS origin returns `403` instead of Express's default `500`:

```typescript
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Not allowed by CORS" });
  }
  next(err);
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx vitest run src/index.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/index.ts backend/src/index.test.ts
git commit -m "fix: restrict CORS to an explicit origin allowlist"
```

---

### Task 5: Remove ingestion from the deploy workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:** None — pure CI config, no code interface.

**Why:** Ingestion now runs (and is verified) locally in the Task 7 pre-commit hook before a profile-content change ever reaches `main`. Running it again in CI — against production databases, inside the same job that gates the site deploy — is redundant and is exactly what breaks deployment today. Drop it; `deploy.yml` goes back to only building and deploying the static frontend.

- [ ] **Step 1: Replace the whole workflow file**

Replace `.github/workflows/deploy.yml` in full:

```yaml
# Deploy Next.js static export to GitHub Pages
# Secrets are injected as NEXT_PUBLIC_* env vars during build — never in source code.
#
# Resume/profile ingestion is NOT run here. It runs locally in the
# pre-commit hook (.githooks/pre-commit) before a change reaches main,
# so a bad ingest or an unreachable database never blocks this deploy.

name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Lint
        working-directory: frontend
        run: npm run lint

      - name: Build static export
        working-directory: frontend
        env:
          NEXT_PUBLIC_BASE_PATH: ${{ secrets.BASE_PATH }}
          NEXT_PUBLIC_BACKEND_URL: ${{ secrets.NEXT_PUBLIC_BACKEND_URL }}
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./frontend/out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Note what changed vs. the original: the "Check for resume modifications", "Install Ingestion Dependencies", and "Run Database Ingestion Pipeline" steps are gone entirely — no backend install, no DB secrets, no ingestion in this workflow at all. A `Lint` step was added ahead of `Build static export` (cheap, catches frontend issues before the build). `deploy` still depends only on `build`.

- [ ] **Step 2: Verify the YAML is well-formed**

Run: `cd .github/workflows && python3 -c "import yaml; yaml.safe_load(open('deploy.yml'))" && echo OK`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: remove ingestion from deploy workflow, now handled by pre-commit hook"
```

---

### Task 6: Ingestion verification script

**Files:**
- Create: `backend/src/scripts/verifyIngest.ts`
- Create: `backend/src/scripts/verifyIngest.test.ts`
- Modify: `backend/package.json`

**Interfaces:**
- Produces: `verifyIngest(): Promise<void>` — resolves if the `resume_chunks` Qdrant collection exists and has at least one point AND Neo4j has at least one `Section` node; rejects with a descriptive `Error` otherwise. Also runnable directly as `npm run verify-ingest`, consumed by Task 7's pre-commit hook.
- Consumes: `qdrantClient`, `getNeo4jSession` from `backend/src/config/db.js` (same as `ingest.ts`).

- [ ] **Step 1: Write the failing test**

Create `backend/src/scripts/verifyIngest.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyIngest } from "./verifyIngest.js";
import { qdrantClient, getNeo4jSession } from "../config/db.js";

vi.mock("../config/db.js", () => {
  const mockSession = {
    run: vi.fn().mockResolvedValue({
      records: [{ get: () => ({ toNumber: () => 12 }) }]
    }),
    close: vi.fn().mockResolvedValue({})
  };

  return {
    qdrantClient: {
      getCollections: vi.fn().mockResolvedValue({ collections: [{ name: "resume_chunks" }] }),
      count: vi.fn().mockResolvedValue({ count: 42 })
    },
    getNeo4jSession: vi.fn().mockReturnValue(mockSession)
  };
});

describe("verifyIngest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve when Qdrant has points and Neo4j has Section nodes", async () => {
    await expect(verifyIngest()).resolves.toBeUndefined();
  });

  it("should reject when the Qdrant collection is missing", async () => {
    (qdrantClient.getCollections as any).mockResolvedValue({ collections: [] });
    await expect(verifyIngest()).rejects.toThrow("resume_chunks");
  });

  it("should reject when the Qdrant collection has zero points", async () => {
    (qdrantClient.count as any).mockResolvedValue({ count: 0 });
    await expect(verifyIngest()).rejects.toThrow("0 points");
  });

  it("should reject when Neo4j has zero Section nodes", async () => {
    const session = getNeo4jSession();
    (session.run as any).mockResolvedValue({ records: [{ get: () => ({ toNumber: () => 0 }) }] });
    await expect(verifyIngest()).rejects.toThrow("Section nodes");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/scripts/verifyIngest.test.ts`
Expected: FAIL — `./verifyIngest.js` does not exist yet

- [ ] **Step 3: Implement the script**

Create `backend/src/scripts/verifyIngest.ts`:

```typescript
import "../config/env.js";
import { fileURLToPath } from "url";
import { qdrantClient, getNeo4jSession } from "../config/db.js";

const COLLECTION_NAME = "resume_chunks";

export async function verifyIngest(): Promise<void> {
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
  if (!exists) {
    throw new Error(`Ingestion verification failed: Qdrant collection '${COLLECTION_NAME}' does not exist.`);
  }

  const countResult = await qdrantClient.count(COLLECTION_NAME, { exact: true });
  if (!countResult.count || countResult.count === 0) {
    throw new Error(`Ingestion verification failed: Qdrant collection '${COLLECTION_NAME}' has 0 points.`);
  }
  console.log(`Qdrant verification passed: ${countResult.count} points in '${COLLECTION_NAME}'.`);

  const session = getNeo4jSession();
  try {
    const result = await session.run("MATCH (s:Section) RETURN count(s) as sectionCount");
    const sectionCount = result.records[0].get("sectionCount").toNumber();
    if (!sectionCount || sectionCount === 0) {
      throw new Error("Ingestion verification failed: Neo4j has 0 Section nodes.");
    }
    console.log(`Neo4j verification passed: ${sectionCount} Section nodes.`);
  } finally {
    await session.close();
  }

  console.log("Ingestion verification succeeded.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyIngest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err.message || err);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Add the npm script**

In `backend/package.json`, in `"scripts"`, add:

```json
    "ingest": "tsx src/scripts/ingest.ts",
    "verify-ingest": "tsx src/scripts/verifyIngest.ts",
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run src/scripts/verifyIngest.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/scripts/verifyIngest.ts backend/src/scripts/verifyIngest.test.ts backend/package.json
git commit -m "feat: add ingestion verification script"
```

---

### Task 7: Pre-commit hook — lint, DB health, verified ingestion, gated to main

**Files:**
- Create: `.githooks/pre-commit`

**Interfaces:**
- Consumes: `frontend`'s `npm run lint` (existing), `backend`'s `npm run test:prod-db` (existing), `npm run ingest` (existing), `npm run verify-ingest` (Task 6).
- No code interface — this is a git hook, activated per-clone by a one-time local `git config` command (see Step 4; cannot be committed, `core.hooksPath` is a local repo setting).

- [ ] **Step 1: Write the hook script**

Create `.githooks/pre-commit`:

```bash
#!/usr/bin/env bash
# Blocks `git commit` on main unless: frontend lints clean, production
# databases are reachable, and (when profile content changed) ingestion
# ran and was verified. Other branches are unaffected.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  exit 0
fi

echo "[pre-commit] Linting frontend..."
(cd frontend && npm run lint)

echo "[pre-commit] Checking production database health..."
(cd backend && NODE_ENV=production npm run test:prod-db)

CHANGED_FILES="$(git diff --cached --name-only)"
if echo "$CHANGED_FILES" | grep -qE '^frontend/public/resumes/|^frontend/lib/documentTree\.json$'; then
  echo "[pre-commit] Profile content changed — running ingestion pipeline..."
  (cd backend && NODE_ENV=production npm run ingest)

  echo "[pre-commit] Verifying ingestion..."
  (cd backend && NODE_ENV=production npm run verify-ingest)
fi

echo "[pre-commit] All checks passed."
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x .githooks/pre-commit`

- [ ] **Step 3: Commit the hook**

```bash
git add .githooks/pre-commit
git commit -m "ci: add pre-commit hook for lint, DB health, and verified ingestion on main"
```

- [ ] **Step 4: One-time local activation (manual, not a commit)**

Anyone working on this repo runs this once per clone, since `core.hooksPath` is a local git config setting and can't be shipped via a commit:

```bash
git config core.hooksPath .githooks
```

- [ ] **Step 5: Verify the hook fires**

Run: `git commit --allow-empty -m "test: verify pre-commit hook"` while on `main`
Expected: the hook's lint/db-health output prints before the commit is created. If `frontend`/`backend` dependencies aren't installed yet, or `backend/.env.production` (see Task 8) doesn't exist, the hook fails loudly rather than committing — that's the intended behavior. Once confirmed working, run `git reset --soft HEAD~1` to drop the empty test commit.

---

### Task 8: Local production env file for the pre-commit hook

**Files:**
- Rename: `.env.prod` → `.env.production` (repo root, gitignored — no commit for this task)

**Interfaces:** None — local-only credentials file, never committed.

**Why:** `backend/src/config/env.ts` and `backend/src/config/prodDbConnectivity.test.ts` both look for a file literally named `.env.production` (in `backend/` or its parent) — never `.env.prod`. Today's `.env.prod` at the repo root is dead: nothing loads it. Renaming it makes `NODE_ENV=production npm run test:prod-db` / `npm run ingest` (Task 7's hook) actually pick up real credentials from the repo root, one directory up from `backend/`.

- [ ] **Step 1: Rename the file**

Run: `mv .env.prod .env.production`

- [ ] **Step 2: Update its contents for the Cohere/CORS changes**

In `.env.production`, replace:

```
OPENROUTER_API_KEY=REDACTED-OPENROUTER-API-KEY
OPENROUTER_EMBEDDING_MODEL=google/gemini-embedding-001

COHERE_BASE_URL=https://api.cohere.com/v2
COHERE_API_KEY=REDACTED-COHERE-API-KEY
```

with:

```
OPENROUTER_API_KEY=REDACTED-OPENROUTER-API-KEY

COHERE_BASE_URL=https://api.cohere.com/v2
COHERE_API_KEY=REDACTED-COHERE-API-KEY
COHERE_EMBEDDING_MODEL=embed-english-v3.0
```

And add, in the backend variables block:

```
ALLOWED_ORIGINS=https://rohandhanraj.github.io
```

- [ ] **Step 3: Confirm it's still ignored by git**

Run: `git check-ignore -v .env.production`
Expected: prints a match against `.gitignore:35:.env*` — confirms it will never be staged, so there is no commit step for this task.

- [ ] **Step 4: Verify no code references the removed var**

Run: `grep -rn "OPENROUTER_EMBEDDING_MODEL" backend/src .github/workflows`
Expected: no matches (Tasks 1, 2, and 5 already removed every reference)

---

### Task 9: RAG quality — degraded-response signal

**Files:**
- Modify: `backend/src/services/ragService.ts`
- Test: `backend/src/services/ragService.test.ts`

**Interfaces:**
- Produces: `RetrievalResult` gains `degraded: boolean`. `retrieveHybridContextDetailed` sets it `true` only on the local-fallback path (both DBs empty/unreachable), `false` otherwise. `retrieveHybridContext` (the string-only wrapper) is unaffected.
- Consumes (Task 6's route already exists to extend): `backend/src/routes/chat.ts` persists `retrievalResult.degraded` alongside the existing `contextUsed` field so degraded answers are visible in the stored chat document.

- [ ] **Step 1: Write the failing test**

Add to `backend/src/services/ragService.test.ts` (same `vi.mock("../config/db.js", ...)` block already present — for this test, override the mocked `qdrantClient.search` and `getNeo4jSession` per-test to return nothing):

```typescript
import { retrieveHybridContextDetailed } from "./ragService.js";

describe("Degraded response signal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COHERE_API_KEY = "mock-key";
  });

  it("should mark the result as degraded when both DBs return nothing", async () => {
    (qdrantClient.search as any).mockResolvedValue([]);
    const session = getNeo4jSession();
    (session.run as any).mockResolvedValue({ records: [] });

    const result = await retrieveHybridContextDetailed("tell me about Rohan");

    expect(result.degraded).toBe(true);
  });

  it("should not mark the result as degraded when vector search returns candidates", async () => {
    (qdrantClient.search as any).mockResolvedValue([
      { score: 0.9, payload: { content: "Rohan is an AI engineer." } }
    ]);

    const result = await retrieveHybridContextDetailed("tell me about Rohan");

    expect(result.degraded).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/ragService.test.ts`
Expected: FAIL — `result.degraded` is `undefined`, not `true`/`false`

- [ ] **Step 3: Add the field**

In `backend/src/services/ragService.ts`, extend the interface (near line 91):

```typescript
export interface RetrievalResult {
  context: string;
  retrievalLog: string;
  matchedNodesCount: number;
  degraded: boolean;
}
```

Then in `retrieveHybridContextDetailed`, the local-fallback branch (currently returns without a `degraded` field):

```typescript
  // Fallback to local profile if database retrieval returned no candidates
  if (candidateTexts.length === 0) {
    if (onStatusUpdate) {
      onStatusUpdate("Please hold on — technical issue connecting to database services. Switching to local profile context...");
    }
    const fallback = fallbackToLocalProfileDetails(query);
    retrievalLogs.push("- ⚠️ **Database Connection**: Primary DB cluster unreachable/timed out.");
    retrievalLogs.push("- 📁 **Local Knowledge Graph Tree (`document_tree.json`)**: Traversed document tree nodes:");
    retrievalLogs.push(...fallback.nodeLogs);
    return {
      context: fallback.context,
      retrievalLog: retrievalLogs.join("\n"),
      matchedNodesCount: fallback.matchedCount,
      degraded: true
    };
  }
```

And the two non-degraded return statements later in the same function (Cohere-reranked success path and the reranking-failed-so-combine-directly path) each get `degraded: false` added to their returned object.

- [ ] **Step 4: Persist the flag in the chat route**

In `backend/src/routes/chat.ts`, inside the `res.end` override (around line 117), add `degraded` next to the existing `contextUsed`:

```typescript
                { role: "assistant", content: fullResponse || SAFE_FALLBACK_RESPONSE, timestamp: new Date(), contextUsed: retrievalResult.context, degraded: retrievalResult.degraded }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npx vitest run src/services/ragService.test.ts src/routes/routes.test.ts`
Expected: PASS (all tests, including the pre-existing ones — they don't assert on `degraded` so adding the field doesn't break them)

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/ragService.ts backend/src/services/ragService.test.ts backend/src/routes/chat.ts
git commit -m "feat: signal and persist degraded (local-fallback) RAG responses"
```

---

### Task 10: RAG quality — consolidate Neo4j N+1 queries

**Files:**
- Modify: `backend/src/services/ragService.ts:323-403` (graph search block inside `retrieveHybridContextDetailed`)
- Test: `backend/src/services/ragService.test.ts`

**Interfaces:** No signature changes — same `addCandidate` calls, same candidate content strings. Only the number of Cypher round-trips changes: from `3 × keywords.length` down to a fixed `3`.

- [ ] **Step 1: Write the failing test**

Add to `backend/src/services/ragService.test.ts`:

```typescript
describe("Neo4j query consolidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COHERE_API_KEY = "mock-key";
  });

  it("should run exactly 3 Cypher queries regardless of keyword count", async () => {
    await retrieveHybridContext("Python and TypeScript and Docker and FastAPI skills");

    const session = getNeo4jSession();
    expect(session.run).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/services/ragService.test.ts`
Expected: FAIL — with 4 keywords (`python`, `typescript`, `docker`, `fastapi`) extracted, the current per-keyword loop calls `session.run` 12 times (3 queries × 4 keywords), not 3

- [ ] **Step 3: Replace the per-keyword loop with 3 consolidated queries**

Replace lines 323-403 of `backend/src/services/ragService.ts` (the whole `if (keywords.length > 0) { try { ... } catch ... }` graph-search block):

```typescript
  // 2. Graph Search (Neo4j)
  if (keywords.length > 0) {
    try {
      await withTimeout((async () => {
        const session = getNeo4jSession();
        try {
          const patterns = keywords.map(kw => `(?i).*${kw}.*`);

          const skillRes = await session.run(
            `
            UNWIND $patterns AS pattern
            MATCH (sk:Skill) WHERE sk.name =~ pattern
            OPTIONAL MATCH (connected)-[:USES_SKILL|APPLIED_SKILL]->(sk)
            RETURN DISTINCT sk.name as skill, labels(connected)[0] as type, connected.name as projName, connected.company as compName
            LIMIT 15
            `,
            { patterns }
          );

          for (const record of skillRes.records) {
            const skill = record.get("skill");
            const type = record.get("type");
            if (type === "Project") {
              const projName = record.get("projName");
              addCandidate(`Project ${projName} uses the skill ${skill}.`, "Graph-Skill-Project");
            } else if (type === "Experience") {
              const compName = record.get("compName");
              addCandidate(`Rohan applied the skill ${skill} during his experience at ${compName}.`, "Graph-Skill-Experience");
            } else {
              addCandidate(`Rohan Yadav has skills in: ${skill}.`, "Graph-Skill-Direct");
            }
          }

          const projRes = await session.run(
            `
            UNWIND $patterns AS pattern
            MATCH (p:Project) WHERE p.name =~ pattern OR p.domain =~ pattern
            RETURN DISTINCT p.name as name, p.description as desc, p.domain as domain
            LIMIT 9
            `,
            { patterns }
          );

          for (const record of projRes.records) {
            const name = record.get("name");
            const desc = record.get("desc");
            const domain = record.get("domain");
            addCandidate(`Project ${name} (${domain}): ${desc}`, "Graph-Project-Direct");
          }

          const expRes = await session.run(
            `
            UNWIND $patterns AS pattern
            MATCH (e:Experience) WHERE e.company =~ pattern OR e.role =~ pattern
            RETURN DISTINCT e.company as company, e.role as role, e.duration as duration
            LIMIT 9
            `,
            { patterns }
          );

          for (const record of expRes.records) {
            const company = record.get("company");
            const role = record.get("role");
            const duration = record.get("duration");
            addCandidate(`Experience at ${company} as ${role} (${duration}).`, "Graph-Experience-Direct");
          }

          const graphMatches = skillRes.records.length + projRes.records.length + expRes.records.length;
          if (graphMatches > 0) {
            retrievalLogs.push(`- **Neo4j Knowledge Graph**: Traversed and retrieved ${graphMatches} relational graph nodes`);
          }
        } finally {
          await session.close();
        }
      })(), 1500);
    } catch (err: any) {
      console.error("Neo4j retrieval failed:", err?.message || err);
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx vitest run src/services/ragService.test.ts`
Expected: PASS (all tests — the pre-existing test's mock `session.run` returns the same static record for every call regardless of query text, so the candidate strings it asserts on are unchanged; only the call count for the new test goes from 12 to 3)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/ragService.ts backend/src/services/ragService.test.ts
git commit -m "perf: consolidate per-keyword Neo4j queries into 3 fixed queries"
```

---

### Task 11: RAG quality — golden-set retrieval regression test

**Files:**
- Test: `backend/src/services/ragService.test.ts`

**Interfaces:** No production code changes — this task only adds regression coverage so a future embedding/rerank/retrieval-logic change that silently drops expected content gets caught.

- [ ] **Step 1: Add golden-set cases**

Add to `backend/src/services/ragService.test.ts`, reusing the existing mock but overriding return values per case:

```typescript
describe("Golden-set retrieval regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COHERE_API_KEY = "mock-key";
  });

  const cases: Array<{ query: string; mockPayload: { content: string }; expectedSubstring: string }> = [
    {
      query: "what programming languages does Rohan know",
      mockPayload: { content: "Rohan is proficient in Python, TypeScript, and SQL." },
      expectedSubstring: "Python"
    },
    {
      query: "tell me about the OMODORE project",
      mockPayload: { content: "OMODORE is an AI Agent Platform for non-technical users." },
      expectedSubstring: "OMODORE"
    },
    {
      query: "where did Rohan study",
      mockPayload: { content: "Rohan holds a B.Tech degree and cleared GATE." },
      expectedSubstring: "GATE"
    }
  ];

  it.each(cases)("should surface expected content for: $query", async ({ query, mockPayload, expectedSubstring }) => {
    (qdrantClient.search as any).mockResolvedValue([{ score: 0.95, payload: mockPayload }]);

    const context = await retrieveHybridContext(query);

    expect(context).toContain(expectedSubstring);
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `cd backend && npx vitest run src/services/ragService.test.ts`
Expected: PASS (3 new cases, plus every earlier test in the file)

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/ragService.test.ts
git commit -m "test: add golden-set retrieval regression coverage"
```

---

### Task 12: IP-based rate limiting on `/api/chat`

**Files:**
- Create: `backend/src/middleware/rateLimiter.ts`
- Test: `backend/src/middleware/rateLimiter.test.ts`
- Modify: `backend/src/routes/chat.ts`
- Modify: `backend/src/index.ts`
- Modify: `backend/package.json`

**Interfaces:**
- Produces: `chatRateLimiter` — an Express `RequestHandler` (the object returned by `express-rate-limit`'s `rateLimit()`), 10 requests per IP per 60 seconds, responding `429` with `{ error: "You've reached the chat message limit. Please wait a minute and try again." }` on the 11th.
- Consumes: `req.ip`, which requires `app.set("trust proxy", 1)` in `index.ts` to reflect the real client IP behind Vercel's proxy instead of Vercel's edge IP (all requests would otherwise share one IP and rate-limit each other).

- [ ] **Step 1: Install the dependency**

Run: `cd backend && npm install express-rate-limit`

- [ ] **Step 2: Write the failing test**

Create `backend/src/middleware/rateLimiter.test.ts` — tests the limiter in isolation on a throwaway Express app, not through the full `/api/chat` route (avoids mocking the whole RAG/LLM pipeline just to test rate-limiting):

```typescript
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { chatRateLimiter } from "./rateLimiter.js";

function buildTestApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.get("/test", chatRateLimiter, (req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe("chatRateLimiter", () => {
  it("should allow requests up to the limit", async () => {
    const app = buildTestApp();
    for (let i = 0; i < 10; i++) {
      const res = await request(app).get("/test").set("X-Forwarded-For", "203.0.113.1");
      expect(res.status).toBe(200);
    }
  });

  it("should reject the 11th request from the same IP with a custom message", async () => {
    const app = buildTestApp();
    for (let i = 0; i < 10; i++) {
      await request(app).get("/test").set("X-Forwarded-For", "203.0.113.2");
    }
    const res = await request(app).get("/test").set("X-Forwarded-For", "203.0.113.2");

    expect(res.status).toBe(429);
    expect(res.body.error).toBe("You've reached the chat message limit. Please wait a minute and try again.");
  });

  it("should not rate-limit a different IP", async () => {
    const app = buildTestApp();
    for (let i = 0; i < 10; i++) {
      await request(app).get("/test").set("X-Forwarded-For", "203.0.113.3");
    }
    const res = await request(app).get("/test").set("X-Forwarded-For", "203.0.113.4");

    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx vitest run src/middleware/rateLimiter.test.ts`
Expected: FAIL — `./rateLimiter.js` does not exist yet

- [ ] **Step 4: Implement the limiter**

Create `backend/src/middleware/rateLimiter.ts`:

```typescript
import rateLimit from "express-rate-limit";

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You've reached the chat message limit. Please wait a minute and try again." }
});
```

- [ ] **Step 5: Mount it on the route and enable `trust proxy`**

In `backend/src/index.ts`, right after `const app = express();`:

```typescript
const app = express();
app.set("trust proxy", 1);
```

In `backend/src/routes/chat.ts`, add the import and mount it on the `POST /` handler only:

```typescript
import { chatRateLimiter } from "../middleware/rateLimiter.js";
```

```typescript
router.post("/", chatRateLimiter, async (req, res) => {
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && npx vitest run src/middleware/rateLimiter.test.ts`
Expected: PASS (3 tests)

Then run the full backend suite once to confirm nothing else broke:

Run: `cd backend && npm run test:unit`
Expected: PASS (all files) — note `routes.test.ts` and any chat-route tests don't send 11+ requests, so the limiter never trips there

- [ ] **Step 7: Commit**

```bash
git add backend/src/middleware/rateLimiter.ts backend/src/middleware/rateLimiter.test.ts backend/src/routes/chat.ts backend/src/index.ts backend/package.json backend/package-lock.json
git commit -m "feat: rate-limit /api/chat by IP with a custom 429 message"
```

---

### Task 13: Fix the broken production keepalive mechanism

**Files:**
- Modify: `backend/src/services/keepaliveScheduler.ts`
- Modify: `backend/src/index.ts`
- Modify: `backend/vercel.json`
- Modify: `frontend/vercel.json`
- Create: `.github/workflows/keepalive.yml`

**Interfaces:**
- Removes: `startKeepaliveScheduler` export and its call site — it schedules work via `setTimeout` hours in advance, which cannot survive Vercel's serverless execution model (the actual production runtime) and has never reliably run there.
- Keeps: `runKeepaliveOperations(): Promise<KeepaliveResults>` unchanged — still exported, still used by `routes/keepalive.ts`, still covered by `keepaliveScheduler.test.ts` (Task 3) and `routes/keepalive.test.ts`.
- Produces: a scheduled GitHub Actions workflow that pings the existing `GET /api/cron/keepalive` route every 6 hours using the existing `CRON_SECRET` bearer-token auth already implemented in that route.

- [ ] **Step 1: Remove the dead in-process scheduler**

In `backend/src/services/keepaliveScheduler.ts`, delete the `startKeepaliveScheduler` function and the `keepaliveTimer` variable (everything from `let keepaliveTimer: NodeJS.Timeout | null = null;` to the end of the file) — keep `runKeepaliveOperations` and the `KeepaliveResults` interface exactly as they are (Task 3's dimension fix stays).

- [ ] **Step 2: Remove its call site**

In `backend/src/index.ts`, remove the import and call:

```typescript
import { startKeepaliveScheduler } from "./services/keepaliveScheduler.js";
```

and inside the `if (process.env.NODE_ENV !== "test")` block, remove the `startKeepaliveScheduler();` line — leave the `app.listen(...)` call as-is (still needed for the Docker/local-dev deployment path).

- [ ] **Step 3: Run the existing backend test suite to confirm nothing depended on the removed export**

Run: `cd backend && npm run test:unit`
Expected: PASS (all files) — no test imports `startKeepaliveScheduler` directly

- [ ] **Step 4: Move the Vercel Cron config to the backend project**

In `frontend/vercel.json`, remove the `crons` block entirely (lines 17-22) — the frontend is a static export with no `/api/cron/keepalive` route, so this config has never done anything.

In `backend/vercel.json`, add it:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "crons": [
    {
      "path": "/api/cron/keepalive",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

(Kept as defense-in-depth in case the Vercel account's plan supports it — the GitHub Actions workflow in Step 5 is the mechanism this plan actually relies on, since it works regardless of Vercel plan tier.)

- [ ] **Step 5: Add the GitHub Actions scheduled keepalive**

Create `.github/workflows/keepalive.yml`:

```yaml
# Pings the backend's keepalive endpoint on a schedule so free-tier
# Mongo Atlas / Qdrant Cloud / Neo4j Aura instances don't auto-pause
# from inactivity. Runs independently of Vercel's own Cron Jobs
# (backend/vercel.json), which may be restricted on the free plan.

name: Keepalive Ping

on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Call backend keepalive endpoint
        run: |
          curl -sf -X GET "${{ secrets.BACKEND_URL }}/api/cron/keepalive" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Requires two repo secrets: `BACKEND_URL` (e.g. `https://project-5huqk.vercel.app`) and `CRON_SECRET` (already used by `routes/keepalive.ts` — reuse the same value configured on Vercel).

- [ ] **Step 6: Verify the YAML is well-formed**

Run: `cd .github/workflows && python3 -c "import yaml; yaml.safe_load(open('keepalive.yml'))" && echo OK`
Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/keepaliveScheduler.ts backend/src/index.ts backend/vercel.json frontend/vercel.json .github/workflows/keepalive.yml
git commit -m "fix: replace dead in-process keepalive scheduler with a GitHub Actions cron"
```

---

## Deployment Notes (not code, do manually after merging)

- **Vercel dashboard** (backend runtime env, since `backend/vercel.json` deploys independently of GitHub Actions and of this hook): add `COHERE_EMBEDDING_MODEL=embed-english-v3.0` and `ALLOWED_ORIGINS=https://rohandhanraj.github.io`. `OPENROUTER_EMBEDDING_MODEL` can be removed there too (harmless if left, but unused after Task 1/2).
- **First-time setup for anyone cloning this repo:** run `git config core.hooksPath .githooks` (Task 7, Step 4) once, and populate `.env.production` at the repo root (Task 8) with real credentials — the pre-commit hook will fail every commit to `main` until both exist.
- Because ingestion + verification now happen locally before the commit lands, `frontend/lib/documentTree.json`/resume edits should be committed directly to `main` from a machine that has run this setup — not from CI, not from a machine without prod DB network access.
- **GitHub repo secrets** (Task 13): add `BACKEND_URL` (the Vercel production URL, e.g. `https://project-5huqk.vercel.app`) and confirm `CRON_SECRET` already exists as a secret matching the value configured on Vercel — `keepalive.yml` needs both to authenticate against `/api/cron/keepalive`.
- **Confirm in the Vercel dashboard** whether the current plan actually executes the `crons` block added to `backend/vercel.json` in Task 13 at a 6-hour cadence (Hobby/free plans have historically restricted Cron Jobs to once/day). Either way, the GitHub Actions workflow in Task 13 is the mechanism this plan relies on — the Vercel cron is redundant defense-in-depth, not required to work.

## Self-Review Notes

- **Spec coverage:** Section 1 (embedding swap) → Tasks 1, 2, 3, 8. Section 2 (RAG quality) → Tasks 9, 10, 11. Section 3's CORS item → Task 4; rate-limiting item → Task 12; keepalive item → Task 13. Section 4's "ingestion blocks deploy" item → Task 5 (removed from CI) + Tasks 6-7 (moved to a verified local pre-commit gate, superseding the spec's original "separate CI job" idea per user direction); its ingestion-sanity-check item is pulled forward into Task 6, since "verified ingestion" was explicitly requested as part of the hook. Section 4's frontend-test-coverage item, section 3's structured-logging item, and section 5 (frontend/UX) remain out of this plan — future "Later" work. The Vercel backend deploy trigger (path-filtered on `backend/**`) was investigated and found already implemented correctly in `.github/workflows/deploy-backend.yml` — no task needed.
- **Placeholder scan:** none found — every step has concrete code/commands.
- **Type consistency:** `getQueryEmbedding`/`getEmbedding` keep their original `(text: string): Promise<number[]>` signatures across Tasks 1 and 2. `verifyIngest(): Promise<void>` is used consistently between Task 6's implementation, its test, and Task 7's hook (`npm run verify-ingest`). `RetrievalResult` (Task 9) gains `degraded: boolean` and every return path in `retrieveHybridContextDetailed` (including the two touched by Task 10) sets it, so no return path is left with a missing field. `chatRateLimiter` (Task 12) is imported by name consistently between its implementation, its test, and `chat.ts`.
- **Ordering note:** Task 10 rewrites the same code block Task 9 partially touches (the local-fallback return statement is inside the function Task 10 also edits, but Task 10's replacement range is lines 323-403, strictly after the fallback block earlier in the function) — apply Task 9 before Task 10 to avoid re-deriving the `degraded` field placement against stale line numbers; if executing out of order, use symbol/text anchors from the current file state instead of the line numbers quoted here.
- **Scope note:** backend unit tests (`vitest run`) are deliberately NOT part of the pre-commit gate — the hook only runs what was asked (lint, DB health, verified ingestion). Running the full backend test suite locally on every commit to `main` was considered and dropped as scope creep; revisit if regressions start slipping through.
