# Portfolio App Improvements — Design

Date: 2026-08-24
Status: Approved (chat), pending user review of this doc

## Scope

Improve the portfolio app (`frontend/` Next.js static site + `backend/` Express/TS RAG
backend) across: RAG/chat quality, reliability/observability, CI/CD + tests + cost
control, and non-animation frontend/UX. Frontend animation work is explicitly
out of scope until a separate design is approved.

Includes swapping the embedding provider from OpenRouter to Cohere.

## Current architecture (context)

- Frontend: Next.js static export, deployed to GitHub Pages via `.github/workflows/deploy.yml`.
- Backend: Express/TS, deployed separately (Vercel, per `backend/vercel.json`).
- RAG pipeline (`backend/src/services/ragService.ts`):
  1. Vector search — Qdrant (`resume_chunks` collection), query embedding via OpenRouter `/embeddings`.
  2. Graph search — Neo4j, keyword-driven Cypher queries.
  3. Fallback — local `frontend/lib/documentTree.json` keyword scoring, used when both DBs are empty/unreachable.
  4. Rerank — Cohere `/v1/rerank` (already integrated, `COHERE_API_KEY`).
- Chat completion — OpenRouter/NVIDIA NIM, streamed (`backend/src/services/llmService.ts`), untouched by this work.
- Ingestion (`backend/src/scripts/ingest.ts`) — embeds `documentTree.json` nodes via OpenRouter, upserts to Qdrant, rebuilds Neo4j graph. Runs in CI (`deploy.yml`) whenever resume files or `documentTree.json` change, against production DBs, with no test/dry-run gate.

## 1. Embedding provider swap: OpenRouter → Cohere

**Call sites:**
- `getQueryEmbedding` — [ragService.ts:204-228](../../../backend/src/services/ragService.ts#L204-L228)
- `getEmbedding` — [ingest.ts:20-53](../../../backend/src/scripts/ingest.ts#L20-L53)

**Change:** Replace the OpenRouter `/embeddings` POST with Cohere `/v2/embed`
(reuse existing `COHERE_API_KEY` / `COHERE_BASE_URL=https://api.cohere.com/v2`,
already used by the reranker).

- Model: `embed-english-v3.0` (1024-dim). Configurable via new `COHERE_EMBEDDING_MODEL` env var, default `embed-english-v3.0`.
- `input_type: "search_query"` for query-side embedding, `"search_document"` for ingest-side.
- `embedding_types: ["float"]`.
- Response shape differs from OpenRouter/v1 (`{ embeddings: { float: [[...]] } }` vs `{ data: [{ embedding: [...] }] }`) — both call sites need their response parsing updated.
- Mock-key fallback path (random 768-dim vector) becomes a random 1024-dim vector to match.

**Side effects to handle:**
- Qdrant collection dimension is derived dynamically in `ingest.ts` from the first real embedding, so no hardcoded dimension to fix there — but old vectors (768-dim, OpenRouter model) are incompatible with the new model. `ingest.ts` already deletes and recreates the collection on each run, so a full re-ingest after deploy resolves this automatically.
- **Hardcoded dimension bug:** [keepaliveScheduler.ts:40](../../../backend/src/services/keepaliveScheduler.ts#L40) does a dummy Qdrant search with `Array(768).fill(0.01)`. Must update to 1024 (or read the live collection's configured size) or the keepalive ping silently mismatches after the switch.
- Env cleanup: remove `OPENROUTER_EMBEDDING_MODEL` from `.env.prod` and `.github/workflows/deploy.yml:71` (chat's `OPENROUTER_MODEL` / `OPENROUTER_API_KEY` stay — unrelated, still used for LLM streaming). Add `COHERE_EMBEDDING_MODEL` to both.
- Operational step: re-run `npm run ingest` (or let the next resume-touching push trigger it via CI) after this ships, since existing Qdrant vectors are stale.

## 2. RAG/chat quality

- **Silent degraded responses:** the 1500ms timeout on Qdrant/Neo4j causes a silent fallback to keyword-matched local JSON ([ragService.ts:406-419](../../../backend/src/services/ragService.ts#L406-L419)) with no visible signal beyond a log line. Add a `degraded: boolean` (or similar) field to `RetrievalResult` so callers/observability can tell when an answer used the low-quality path.
- **N+1 Neo4j queries:** the graph search runs 3 separate Cypher queries per extracted keyword ([ragService.ts:330-391](../../../backend/src/services/ragService.ts#L330-L391)). For a query with many keywords this multiplies round-trips. Consolidate into fewer parameterized queries (e.g. `UNWIND $keywords AS kw`) run once instead of once per keyword.
- **No retrieval-quality regression test:** nothing catches a quality regression when the embedding model, rerank model, or retrieval logic changes. Add a small golden-set test — a fixed list of (query, expected source/keyword) pairs — asserting expected content shows up in top-k results.

## 3. Reliability / observability

- **CORS misconfiguration:** `cors({ origin: true, credentials: true })` in [index.ts:11](../../../backend/src/index.ts#L11) reflects any request origin back and allows credentials, meaning cross-site requests can carry/read the `chat_session_id`/`visitor_id` cookies. Restrict to an explicit allowlist (env-driven, e.g. `ALLOWED_ORIGINS=https://rohandhanraj.github.io`).
- **No rate limiting:** `/api/chat` has no per-IP throttling despite triggering paid LLM + embedding + rerank calls per request — the highest-value abuse target. Add an IP-based limiter (`express-rate-limit`) on the `POST /api/chat` route only, with a custom JSON error message on `429`. Requires `app.set("trust proxy", 1)` in [index.ts](../../../backend/src/index.ts) so `req.ip` reflects the real client IP behind Vercel's proxy rather than Vercel's edge IP.
- **No structured logging:** all logging is bare `console.log`/`console.error` with no request correlation id or latency data, making prod debugging harder than necessary. Add a minimal request-scoped logger (request id, route, latency, retrieval source hit/miss) — not a full observability platform, just enough to trace a slow/failed request. **(Deferred — "Later" tier, not part of this plan.)**
- **Keepalive mechanism is broken in production (confirmed by investigation):** production backend runs on Vercel as a serverless function (`backend/vercel.json`, confirmed by `NEXT_PUBLIC_BACKEND_URL=https://project-5huqk.vercel.app` in the env reference). Three compounding problems:
  1. `startKeepaliveScheduler()` ([index.ts:26](../../../backend/src/index.ts#L26), [keepaliveScheduler.ts:78-109](../../../backend/src/services/keepaliveScheduler.ts#L78-L109)) schedules its next run via `setTimeout` 4.5–7.5 hours out. Vercel serverless functions are ephemeral — the process does not stay alive between requests, so this `setTimeout` chain effectively never fires in production. It only works in the persistent-process Docker deployment (`docker-compose.yml`), which is local-dev-only (`env_file: .env.local`), not the actual production target.
  2. The real keepalive path is meant to be a Vercel Cron hitting `/api/cron/keepalive` (`routes/keepalive.ts`, guarded by `CRON_SECRET`). But the `crons` block is defined in [frontend/vercel.json](../../../frontend/vercel.json#L17-L22) — the **frontend** project, which is static-exported to GitHub Pages and has no such route. It needs to be in `backend/vercel.json`, which currently has no `crons` block at all.
  3. Even corrected, Vercel's Hobby (free) plan has historically restricted Cron Jobs to a minimum daily interval — a `0 */6 * * *` schedule may not run as configured on a free-tier project. This is plan-dependent and worth confirming directly in the Vercel dashboard, but a GitHub Actions scheduled workflow calling the same `/api/cron/keepalive` endpoint is free regardless of Vercel plan and consistent with the rest of this repo's GitHub Actions-based tooling — the more robust fix either way.
  
  **Fix:** remove the dead in-process scheduler (`startKeepaliveScheduler`/`setTimeout` chain) entirely — it provides false confidence and has never reliably run in production. Add a `.github/workflows/keepalive.yml` scheduled workflow (`cron: '0 */6 * * *'`) that calls `GET /api/cron/keepalive` with the `CRON_SECRET` bearer token. `runKeepaliveOperations()` itself (the actual Mongo/Qdrant/Neo4j ping logic) is unaffected — only the two broken invocation paths change.

## 4. CI/CD, tests, cost

- **No test/lint gate before deploy:** `.github/workflows/deploy.yml` builds and deploys the frontend without ever running `backend`'s `npm test` (vitest suite already exists: `ragService.test.ts`, `guardrailService.test.ts`, `llmService.test.ts`, etc.) or `frontend`'s `next lint`. Add both as required steps before the GitHub Pages deploy job.
- **No frontend test coverage:** `frontend/package.json` has no test runner at all. At minimum, add a smoke test for `ChatWidget` and `ResumeModal` (the two most stateful, most likely to regress silently).
- **Ingestion inline in the deploy workflow breaks deployment:** [deploy.yml:59-72](../../../.github/workflows/deploy.yml#L59-L72) currently runs `ingest.ts` as a step inside the `build` job, gating `Upload artifact` → `deploy`. If the ingestion pipeline fails or a DB is unreachable, the whole Pages deploy fails with it, even though the ingestion result has nothing to do with whether the static site itself is deployable. Decouple:
  - **Pre-deploy health check:** add a fast step early in `build` that pings Mongo/Qdrant/Neo4j (reuse `backend/src/config/prodDbConnectivity.test.ts` or a small standalone script) and reports status — informational, does not block deploy.
  - **Ingestion moves to its own job/workflow**, triggered by the same `resume`/`documentTree.json` path filter, running independently of (not before) the Pages `build`/`deploy` jobs — so a ingestion failure no longer fails the site deployment. Add the post-ingest sanity check (row count > 0, spot-check a known node) inside that separate job so a bad run is caught without touching the deploy path.

## 5. Frontend / UX (non-animation)

- **No structured data:** no JSON-LD (`Person`/`ProfilePage` schema) alongside the existing OpenGraph/Twitter meta in [layout.tsx](../../../frontend/app/layout.tsx) — low-effort SEO improvement.
- **Accessibility check needed:** `ResumeModal` and `ChatWidget` haven't been audited for focus trapping (modal) or `aria-live` on streamed chat text (screen reader support). To be confirmed/detailed at plan time — flagged here as an open item, not yet scoped.

## Priority

- **Now:** embedding swap (#1), pre-commit hook replacing CI ingestion gate (lint + DB health + verified ingestion), CORS fix, IP-based rate limiting with custom message, keepalive/cron fix, degraded-response signal, Neo4j query consolidation, golden-set retrieval regression test.
- **Later:** structured logging, ingestion sanity-check-in-CI (superseded by pre-commit verified ingestion, revisit only if the hook is ever bypassed), SEO/accessibility polish.

## Out of scope

- Any frontend animation/motion changes (`framer-motion` usage) — separate design track.
- Chat completion provider (OpenRouter/NVIDIA NIM) — untouched by this work.
- Full observability platform (e.g. Datadog/Grafana) — minimal structured logging only.
