# Hybrid RAG Split Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Separate the portfolio chatbot into a static frontend (GitHub Pages) and a TypeScript backend (Vercel serverless) with hybrid Neo4j + Qdrant RAG, Cohere reranking, MongoDB session tracking, and safety guardrails.

**Architecture:** A TypeScript/Express backend deployed to Vercel via the `backend-deploy` branch, using a Vercel Ignored Build Step for folder scoping. It features a unified pipeline resolving embeddings via OpenRouter, vector search via Qdrant, graph traversal via Neo4j, Cohere reranking, and completions via NVIDIA NIM.

**Tech Stack:** Node.js, TypeScript, Express, Vitest, MongoDB, Neo4j, Qdrant, NVIDIA NIM, OpenRouter, Cohere, Vercel Serverless.

---

### Task 1: Setup Backend Infrastructure & Docker Compose

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `docker-compose.yml`

**Step 1: Write the failing test**
Create `backend/src/index.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./index";

describe("GET /health", () => {
  it("should return healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});
```

**Step 2: Run test to verify it fails**
Run: `cd backend && npm run test`
Expected: FAIL (No tests run or module not found)

**Step 3: Write minimal implementation**
Create `backend/package.json`:
```json
{
  "name": "portfolio-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.7",
    "typescript": "^5.4.5",
    "ts-node-dev": "^2.0.0",
    "vitest": "^1.6.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  }
}
```
Create `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```
Create `backend/src/index.ts`:
```typescript
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

export default app;
```
Create `docker-compose.yml` in the root:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
    depends_on:
      - mongo
      - qdrant
      - neo4j

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  neo4j:
    image: neo4j:latest
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/password
    volumes:
      - neo4j_data:/data

volumes:
  mongo_data:
  qdrant_data:
  neo4j_data:
```

**Step 4: Run test to verify it passes**
Run: `cd backend && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/package.json backend/tsconfig.json backend/src/index.ts backend/src/index.test.ts docker-compose.yml
git commit -m "feat: setup backend project workspace, health check endpoint, and docker compose"
```

---

### Task 2: Database Configuration & Connector Singletons

**Files:**
- Create: `backend/src/config/db.ts`
- Create: `backend/src/config/db.test.ts`

**Step 1: Write the failing test**
Create `backend/src/config/db.test.ts` verifying database connector exports.

**Step 2: Run test to verify it fails**
Run: `cd backend && npm run test`
Expected: FAIL (Missing db.ts modules)

**Step 3: Write minimal implementation**
Create `backend/src/config/db.ts`:
```typescript
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { QdrantClient } from "@qdrant/js-client-rest";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/portfolio";
const neo4jUri = process.env.NEO4J_URI || "bolt://localhost:7687";
const neo4jUser = process.env.NEO4J_USER || "neo4j";
const neo4jPassword = process.env.NEO4J_PASSWORD || "password";
const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

export const mongoClient = new MongoClient(mongoUri);
export const neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
export const qdrantClient = new QdrantClient({ url: qdrantUrl });

export async function connectDbs() {
  await mongoClient.connect();
  await neo4jDriver.verifyConnectivity();
}
```

**Step 4: Run test to verify it passes**
Run: `cd backend && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/src/config/db.ts backend/src/config/db.test.ts
git commit -m "feat: add mongo, neo4j, and qdrant connection singletons"
```

---

### Task 3: Ingestion Pipeline Script (Knowledge Base Seeding)

**Files:**
- Create: `backend/src/scripts/ingest.ts`
- Create: `backend/src/scripts/ingest.test.ts`

**Step 1: Write the failing test**
Create tests ensuring Markdown documents are successfully parsed into nodes/relations and chunks.

**Step 2: Run test to verify it fails**
Run: `cd backend && npm run test`
Expected: FAIL

**Step 3: Write minimal implementation**
Create script `backend/src/scripts/ingest.ts` which reads `/public/resumes/master_cv.md`, extracts:
1. Skills, Projects, and Experience nodes/relations.
2. Vector text chunks (using OpenRouter Embedding API).
3. Upserts nodes to Neo4j and vectors to Qdrant.

**Step 4: Run test to verify it passes**
Run: `cd backend && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/src/scripts/ingest.ts backend/src/scripts/ingest.test.ts
git commit -m "feat: implement markdown CV database ingestion script for Neo4j and Qdrant"
```

---

### Task 4: Hybrid RAG & Cohere Reranking Service

**Files:**
- Create: `backend/src/services/rag.ts`
- Create: `backend/src/services/rag.test.ts`

**Step 1: Write the failing test**
Create test validating that when a query contains recognized entities, the service queries Neo4j and Qdrant, calls Cohere, and returns the top 5 documents.

**Step 2: Run test to verify it fails**
Run: `cd backend && npm run test`
Expected: FAIL

**Step 3: Write minimal implementation**
Create `backend/src/services/rag.ts`:
- Regex entity extraction.
- Neo4j query for matched entities (1-hop neighbors).
- OpenRouter embedding generation + Qdrant vector retrieval.
- Combined array passed to Cohere Rerank API.
- Top 5 documents returned.

**Step 4: Run test to verify it passes**
Run: `cd backend && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/src/services/rag.ts backend/src/services/rag.test.ts
git commit -m "feat: implement hybrid RAG engine with Neo4j, Qdrant, and Cohere reranking"
```

---

### Task 5: Safety Guardrails & NVIDIA NIM Integration

**Files:**
- Create: `backend/src/services/llm.ts`
- Create: `backend/src/services/llm.test.ts`
- Create: `backend/src/middleware/guardrails.ts`

**Step 1: Write the failing test**
Create tests for input prompt injection scanner and output refusal matcher.

**Step 2: Run test to verify it fails**
Run: `cd backend && npm run test`
Expected: FAIL

**Step 3: Write minimal implementation**
- `backend/src/middleware/guardrails.ts`: scans string for injection heuristics (e.g. "ignore previous instructions").
- `backend/src/services/llm.ts`: calls NVIDIA NIM completion API. Includes output buffer checks for LLM safety refusal indicators ("As an AI", "I'm sorry").

**Step 4: Run test to verify it passes**
Run: `cd backend && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/src/services/llm.ts backend/src/services/llm.test.ts backend/src/middleware/guardrails.ts
git commit -m "feat: add nvidia nim connector and input/output guardrails"
```

---

### Task 6: Session & Analytics Endpoints (MongoDB)

**Files:**
- Create: `backend/src/controllers/chatController.ts`
- Create: `backend/src/controllers/sessionController.ts`
- Create: `backend/src/controllers/analyticsController.ts`

**Step 1: Write the failing test**
Create supertest verification checking that a visitor call sets a `portfolio_session` cookie and stores analytics in MongoDB.

**Step 2: Run test to verify it fails**
Run: `cd backend && npm run test`
Expected: FAIL

**Step 3: Write minimal implementation**
- `/api/session`: resolves/initializes session ID cookie.
- `/api/chat`: processes chat query, fetches history, executes RAG, streams LLM response, saves messages to Mongo.
- `/api/analytics`: updates visitor logs.

**Step 4: Run test to verify it passes**
Run: `cd backend && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/src/controllers/chatController.ts backend/src/controllers/sessionController.ts backend/src/controllers/analyticsController.ts
git commit -m "feat: implement Express routes for sessions, chat, and analytics tracking"
```

---

### Task 7: Database Keep-Alive & Cron Config

**Files:**
- Create: `backend/src/controllers/keepaliveController.ts`
- Create: `backend/vercel.json`

**Step 1: Write the failing test**
Create verification that `/api/keepalive` returns success status when called with valid `CRON_SECRET`.

**Step 2: Run test to verify it fails**
Run: `cd backend && npm run test`
Expected: FAIL

**Step 3: Write minimal implementation**
- `backend/src/controllers/keepaliveController.ts`: checks for `CRON_SECRET`, executes ping requests to MongoDB, Neo4j, and Qdrant.
- `backend/vercel.json`: registers Vercel Serverless rewrites, ignored build settings, and crons schedule.

**Step 4: Run test to verify it passes**
Run: `cd backend && npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/src/controllers/keepaliveController.ts backend/vercel.json
git commit -m "feat: implement keepalive pinger and vercel cron scheduler configuration"
```

---

### Task 8: Frontend Chat Client Migration

**Files:**
- Modify: `frontend/lib/chatClient.ts`
- Modify: `frontend/components/ChatWidget.tsx`

**Step 1: Write the failing test**
Check that frontend `chatClient` calls backend endpoints (e.g., `/api/chat`) and updates the state.

**Step 2: Run test to verify it fails**
Run: `cd frontend && npm run build` (or execute local check)
Expected: FAIL (missing references or types)

**Step 3: Write minimal implementation**
- Modify `frontend/lib/chatClient.ts` to call backend endpoint instead of direct Firebase/OpenRouter.
- Enable cookie initialization on load.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/lib/chatClient.ts frontend/components/ChatWidget.tsx
git commit -m "feat: migrate frontend chat engine to communicate with the Vercel backend"
```
