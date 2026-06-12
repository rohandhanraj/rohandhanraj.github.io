# Design Document: Hybrid RAG Portfolio Backend & Frontend Split

**Date:** 2026-06-13  
**Status:** Approved  

---

## 1. Overview
The current client-side portfolio chatbot uses a flat vectorless RAG scoring system and Firestore. To improve performance, personalization, security, and scalability, we are separating the application into:
1.  **Frontend:** Static Next.js site hosted on GitHub Pages (`rohandhanraj.github.io`), which communicates with the backend via API endpoints.
2.  **Backend:** Node.js/TypeScript Express-like API endpoints deployed on Vercel (Free Tier).

### System Stack
-   **Frontend:** React 19 / Next.js 15.3.0 (Static Export) on GitHub Pages
-   **Backend:** TypeScript / Node.js on Vercel Serverless (Free Tier)
-   **LLM:** NVIDIA NIM API (Free Tier)
-   **Embeddings:** OpenRouter Free Embedding API (`nomic-ai/nomic-embed-text-v1.5`)
-   **Vector DB:** Qdrant Cloud (Free Tier)
-   **Graph DB:** Neo4j Cloud (Aura Free Tier)
-   **General DB (Sessions & Tracking):** MongoDB Atlas (Free Tier Shared Cluster)
-   **Rerank API:** Cohere Rerank API (Free Developer Tier)
-   **Local Dev Environment:** Docker Compose (local Node.js backend, Neo4j, and Qdrant)

---

## 2. Directory Structure & Deployment Flow

We use a monorepo setup on the `main` branch, deploying code to different destinations based on directories:

```
rohan-portfolio/ (Monorepo Root)
├── .github/workflows/
│   ├── deploy-frontend.yml      # CI to build Next.js & deploy static build to GitHub Pages
│   └── sync-backend.yml         # CI to push backend/ folder to the backend-deploy branch
├── backend/
│   ├── src/
│   │   ├── config/              # DB connections (Mongo, Neo4j, Qdrant)
│   │   ├── controllers/         # API business logic (chat, session, analytics, keepalive)
│   │   ├── services/            # Qdrant search, Neo4j query, Cohere Reranking, NIM LLM
│   │   ├── middleware/          # Guardrails and session verification
│   │   ├── index.ts             # Vercel Serverless entry point
│   │   └── cron.ts              # Keep-alive shuffled DB query pinger
│   ├── Dockerfile               # Node.js backend container definition
│   ├── package.json
│   └── vercel.json              # Configures API endpoints, rewrites, and cron scheduler
├── frontend/                    # Existing Next.js portfolio application
│   ├── components/              # Chat widget, Hero, etc.
│   ├── app/
│   └── package.json
├── docker-compose.yml           # Local development composition (Backend, Qdrant, Neo4j)
└── README.md
```

### CI/CD Pipeline
1.  **Frontend Deployment:** Triggered on push to `main` branch when changes are in `/frontend`. Next.js builds and exports statically, deploying to GitHub Pages.
2.  **Backend Deployment:** Triggered on push to `main` branch when changes are in `/backend`. A GitHub Action syncs the `/backend` folder directly to the `backend-deploy` git branch. Vercel is configured to build only from this branch. Vercel's Ignored Build Step ensures build triggers only proceed if `./backend` contains changes.

---

## 3. Database Schema & Data Ingestion

### A. MongoDB Atlas (Sessions & Analytics)
-   **`visitor_analytics` Collection:**
    ```typescript
    interface VisitorAnalytics {
      sessionId: string;
      createdAt: Date;
      updatedAt: Date;
      userAgent: string;
      referrer: string;
      ipCountry?: string;
      ipCity?: string;
      ipTimezone?: string;
      pageHistory: Array<{
        path: string;
        timestamp: Date;
      }>;
    }
    ```
-   **`chat_sessions` Collection:**
    ```typescript
    interface ChatMessage {
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }
    interface ChatSession {
      sessionId: string;
      messages: ChatMessage[];
      updatedAt: Date;
    }
    ```

### B. Qdrant Cloud (Vector DB)
-   **Collection Name:** `resume_chunks` (1536-dimensional or 768-dimensional depending on Nomic embedding)
-   **Payload:**
    ```json
    {
      "id": "skills_languages_1",
      "text": "Languages: Python, TypeScript, SQL, JavaScript...",
      "section": "Skills",
      "category": "technical"
    }
    ```

### C. Neo4j Cloud (Graph DB)
-   **Nodes:**
    -   `(:Project {name: string, description: string})`
    -   `(:Skill {name: string, category: string})`
    -   `(:Experience {company: string, role: string, duration: string})`
    -   `(:Section {title: string})`
-   **Edges:**
    -   `(:Project)-[:USES_SKILL]->(:Skill)`
    -   `(:Experience)-[:APPLIED_SKILL]->(:Skill)`
    -   `(:Section)-[:CONTAINS]->(:Project|:Experience)`

---

## 4. Hybrid Graph + Vector RAG Pipeline

For every incoming chat query:

1.  **Input Guardrail Execution:** Check the query for prompt injection or abuse. If flagged, return the standard safety refusal directly.
2.  **Graph Retrieval (Neo4j):**
    -   Extract recognized entities (skills, companies, project names) from the query using a fast regex keyword mapper.
    -   Execute a Cypher query on Neo4j:
        ```cypher
        MATCH (s:Skill) WHERE toLower(s.name) IN $entities
        MATCH (s)<-[r]-(related)
        RETURN related.name AS source, type(r) AS relation, s.name AS target
        LIMIT 10
        ```
    -   Format retrieved graph paths into readable text sentences (e.g., *"Rohan utilized Python in the Omodore project."*).
3.  **Vector Search (Qdrant):**
    -   Generate a query embedding via OpenRouter Free Embedding API.
    -   Search Qdrant for top 15 closest text chunks using Cosine Similarity.
4.  **Reranking (Cohere Rerank API):**
    -   Combine all graph path text blocks and vector chunks into a single document candidate array.
    -   Call Cohere Rerank API:
        ```javascript
        cohere.rerank({
          query: userQuery,
          documents: candidateTexts,
          topN: 5,
          model: 'rerank-english-v3.0'
        });
        ```
5.  **LLM Execution (NVIDIA NIM):**
    -   Assemble the system prompt containing the top 5 reranked context blocks.
    -   Combine system prompt, last 6 historical messages (retrieved from MongoDB using the session cookie), and user query.
    -   Stream the response from NVIDIA NIM.
6.  **Output Guardrail Execution:**
    -   Buffer the beginning of the LLM stream. If a refusal prefix is detected, cancel the stream and output Rohan's custom fallback contact information.

---

## 5. Security & Safety Guardrails
-   **Prompt Injection Filter:** Check query for substrings like "ignore previous instructions", "system instructions", "you are now a...", or SQL/script injections.
-   **Output Sanitization:** Check LLM stream for words like "sorry", "unable to comply", "violates guidelines", "as an AI", or topics unrelated to Rohan's portfolio. If triggered, replace the output with the fallback message.
-   **Secure Session Cookie:** Set `portfolio_session` cookie as `HttpOnly`, `Secure`, `SameSite=Lax`, and `Max-Age=31536000` (1 year).

---

## 6. DB Keep-Alive Cron
-   A Vercel cron scheduler hits `/api/keepalive` every 6 hours.
-   The endpoint runs basic queries:
    -   MongoDB: `db.command({ ping: 1 })`
    -   Qdrant: Search on a random vector.
    -   Neo4j: `MATCH (n) RETURN count(n) LIMIT 1`.

---

## 7. Local Dev Docker Compose Setup
To run local instances of Qdrant and Neo4j for development, we use `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongo:27017/portfolio
      - QDRANT_URL=http://qdrant:6333
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=password
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
      - "6334:6334"
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
