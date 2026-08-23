import "../config/env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mongoClient, getNeo4jSession, qdrantClient } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RAGContext {
  content: string;
  source: string;
  relevanceScore?: number;
}

let cachedDocTree: any[] | null = null;

function loadDocumentTree(): any[] {
  if (cachedDocTree) return cachedDocTree;
  try {
    const treePath = path.resolve(__dirname, "../../../frontend/lib/documentTree.json");
    const altPath = path.resolve(process.cwd(), "frontend/lib/documentTree.json");
    const altPath2 = path.resolve(process.cwd(), "../frontend/lib/documentTree.json");
    
    let finalPath = "";
    if (fs.existsSync(treePath)) finalPath = treePath;
    else if (fs.existsSync(altPath)) finalPath = altPath;
    else if (fs.existsSync(altPath2)) finalPath = altPath2;

    if (finalPath) {
      cachedDocTree = JSON.parse(fs.readFileSync(finalPath, "utf-8"));
      return cachedDocTree!;
    }
  } catch (e) {
    console.error("Failed to load documentTree.json for fallback:", e);
  }
  return [];
}

function flattenDocTree(nodes: any[]): any[] {
  const result: any[] = [];
  function traverse(node: any) {
    if (!node) return;
    result.push(node);
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }
  if (Array.isArray(nodes)) {
    nodes.forEach(traverse);
  }
  return result;
}

const LOCAL_ENTITY_MAP: Record<string, string[]> = {
  omodore: ["1_project_name_omodore"],
  rbetraj: ["2_project_name_rbetraj"],
  galambo: ["3_project_name_galambo"],
  salesmoji: ["4_project_name_salesmoji"],
  aisera: ["5_project_name_aisera"],
  evalmybrand: ["6_project_name_evalmybrand"],
  inventted: ["7_project_name_inventted"],
  mice: ["8_project_name_mice_protein_expression"],
  protein: ["8_project_name_mice_protein_expression"],
  "r systems": ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  rsystems: ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  lendistry: ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  mcp: ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools", "generative_ai_llm_engineering"],
  guardrails: ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools", "generative_ai_llm_engineering"],
  "agentic ops": ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools", "agentic_ai_multi_agent_systems"],
  "harness engineering": ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  aimlytics: ["2_ai_ml_engineer_generative_ai_multi_agent_systems"],
  cisco: ["2_ai_ml_engineer_generative_ai_multi_agent_systems", "5_project_name_aisera"],
  ineuron: ["3_software_engineer_generative_ai_ml_data_science_python"],
  study: ["education"],
  studied: ["education"],
  education: ["education"],
  degree: ["education"],
  university: ["education"],
  college: ["education"],
  school: ["education"],
  btech: ["education"],
  gate: ["education"],
  certification: ["certifications"],
  certificates: ["certifications"],
  award: ["achievements_awards"],
  achievements: ["achievements_awards"],
  honors: ["achievements_awards"]
};

export interface RetrievalResult {
  context: string;
  retrievalLog: string;
  matchedNodesCount: number;
}

interface LocalFallbackDetails {
  context: string;
  nodeLogs: string[];
  matchedCount: number;
}

function fallbackToLocalProfileDetails(query: string): LocalFallbackDetails {
  console.warn("Falling back to local profile graph — vector and graph DBs unavailable");
  const tree = loadDocumentTree();
  const allNodes = flattenDocTree(tree);
  if (allNodes.length === 0) {
    return {
      context: "No context available.",
      nodeLogs: ["- **Graph Nodes**: No local nodes available"],
      matchedCount: 0
    };
  }

  const queryLower = query.toLowerCase().trim();
  const stopwords = new Set(["what", "where", "tell", "me", "about", "your", "did", "the", "and", "for", "with", "who", "are", "you", "his", "her", "has", "worked", "on", "in", "study", "job"]);
  const queryTokens = queryLower.replace(/[^\w\s]/g, " ").split(/\s+/).filter(t => t.length >= 2 && !stopwords.has(t));

  const targetIds = new Set<string>();
  for (const [entity, nodeIds] of Object.entries(LOCAL_ENTITY_MAP)) {
    if (queryLower.includes(entity)) {
      nodeIds.forEach(id => targetIds.add(id));
    }
  }

  const scored = allNodes.map(node => {
    let score = 0;
    const contentLower = (node.content || "").toLowerCase();
    const labelLower = (node.label || node.section || "").toLowerCase();
    const keywords: string[] = (node.keywords || []).map((k: string) => k.toLowerCase());

    // 1. Direct Entity / Keyword Boost
    if (targetIds.has(node.id)) score += 20;

    // 2. Exact token keyword match
    for (const token of queryTokens) {
      if (keywords.includes(token)) score += 5;
      else if (keywords.some(k => k.includes(token))) score += 2;
    }

    // 3. Label match
    for (const token of queryTokens) {
      if (labelLower.includes(token)) score += 4;
    }

    // 4. Content match
    for (const token of queryTokens) {
      if (contentLower.includes(token)) score += 1;
    }

    // 5. Container node demotion (prevent generic overview containers from hogging character budget)
    if (["professional_experience", "professional_profile", "summary", "work_experience", "project_synopsis"].includes(node.id)) {
      score = score * 0.4;
    }

    return { node, score };
  });

  const topNodes = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  let totalChars = 0;
  const MAX_CHARS = 12000;
  const selected: string[] = [];
  const nodeLogs: string[] = [];

  for (const { node, score } of topNodes) {
    const text = node.content || "";
    if (text.length === 0) continue;
    if (totalChars + text.length > MAX_CHARS && selected.length > 0) continue;
    const label = node.label || node.section || node.id;
    selected.push(`### ${label}\n${text}`);
    nodeLogs.push(`  - **Graph Node Matched**: \`[${label}]\` (Relevance Score: ${score.toFixed(1)})`);
    totalChars += text.length;
  }

  if (selected.length === 0) {
    const fallback = allNodes.find(n => n.id === "professional_profile" || n.id === "summary") || allNodes[0];
    if (fallback && fallback.content) {
      const label = fallback.label || fallback.section || "Profile Summary";
      selected.push(`### ${label}\n${fallback.content}`);
      nodeLogs.push(`  - **Fallback Node**: \`[${label}]\` (Default Profile Context)`);
    }
  }

  return {
    context: selected.join("\n\n---\n\n"),
    nodeLogs,
    matchedCount: selected.length
  };
}

function fallbackToLocalProfile(query: string): string {
  return fallbackToLocalProfileDetails(query).context;
}

// Simple keyword/entity extractor from user query
function extractKeywords(query: string): string[] {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s#+]/g, " ");
  const terms = clean.split(/\s+/).filter(t => t.length > 2);
  const stopwords = new Set(["the", "and", "for", "with", "what", "how", "who", "are", "you", "him", "his", "her", "she", "they"]);
  return terms.filter(t => !stopwords.has(t));
}

// Fetch embeddings for Qdrant querying
async function getQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "nomic-ai/nomic-embed-text-v1.5";

  if (!apiKey || apiKey === "mock-key") {
    return Array.from({ length: 768 }, () => Math.random() - 0.5);
  }

  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, input: text.replace(/\n/g, " ") }),
    signal: AbortSignal.timeout(1000)
  });

  if (!res.ok) {
    throw new Error(`Embedding API failed during RAG retrieval: ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  return data.data[0].embedding;
}

// Query Cohere Rerank API
async function rerankCandidates(query: string, documents: string[]): Promise<Array<{ index: number; relevance_score: number }>> {
  const apiKey = process.env.COHERE_API_KEY?.trim();
  if (!apiKey || apiKey === "mock-key") {
    return documents.map((_, index) => ({
      index,
      relevance_score: 1.0 - index * 0.1
    }));
  }

  const res = await fetch("https://api.cohere.ai/v1/rerank", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "rerank-english-v3.0",
      query,
      documents,
      top_n: Math.min(5, documents.length)
    })
  });

  if (!res.ok) {
    console.error("Cohere Rerank API failed, falling back to original list.", await res.text());
    return documents.map((_, index) => ({
      index,
      relevance_score: 1.0 - index * 0.1
    }));
  }

  const data = (await res.json()) as any;
  return data.results;
}

function withTimeout<T>(promise: Promise<T>, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("DB operation timed out")), ms))
  ]);
}

export async function retrieveHybridContextDetailed(
  query: string,
  onStatusUpdate?: (status: string) => void
): Promise<RetrievalResult> {
  if (onStatusUpdate) onStatusUpdate("retrieving");
  console.log(`Retrieving context for query: "${query}"`);
  
  const keywords = extractKeywords(query);
  const candidates: RAGContext[] = [];
  const candidateTexts: string[] = [];
  const seenContent = new Set<string>();
  const retrievalLogs: string[] = [];

  retrievalLogs.push(`- **Extracted Query Entities**: [${keywords.length ? keywords.join(", ") : "general profile"}]`);

  const addCandidate = (content: string, source: string) => {
    const trimmed = content.trim();
    if (!trimmed || seenContent.has(trimmed)) return;
    seenContent.add(trimmed);
    candidates.push({ content: trimmed, source });
    candidateTexts.push(trimmed);
  };

  // 1. Vector Search (Qdrant)
  try {
    const queryVector = await withTimeout(getQueryEmbedding(query), 1500);
    const vectorResults = await withTimeout(
      qdrantClient.search("resume_chunks", {
        vector: queryVector,
        limit: 5,
        with_payload: true
      }),
      1500
    );

    let vectorCount = 0;
    for (const hit of vectorResults) {
      const payload = hit.payload as any;
      if (payload?.content) {
        addCandidate(payload.content, `Vector-Similarity (${hit.score.toFixed(2)})`);
        vectorCount++;
      }
    }
    if (vectorCount > 0) {
      retrievalLogs.push(`- **Qdrant Vector Search**: Retrieved ${vectorCount} candidate embedding chunks from \`resume_chunks\``);
    }
  } catch (err: any) {
    console.error("Qdrant retrieval failed:", err?.message || err);
  }

  // 2. Graph Search (Neo4j)
  if (keywords.length > 0) {
    try {
      await withTimeout((async () => {
        const session = getNeo4jSession();
        try {
          let graphMatches = 0;
          for (const kw of keywords) {
            const regexPattern = `(?i).*${kw}.*`;
            
            const skillRes = await session.run(
              `
              MATCH (sk:Skill) WHERE sk.name =~ $pattern
              OPTIONAL MATCH (connected)-[:USES_SKILL|APPLIED_SKILL]->(sk)
              RETURN sk.name as skill, labels(connected)[0] as type, connected.name as projName, connected.company as compName
              LIMIT 5
              `,
              { pattern: regexPattern }
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
              graphMatches++;
            }

            const projRes = await session.run(
              `
              MATCH (p:Project) WHERE p.name =~ $pattern OR p.domain =~ $pattern
              RETURN p.name as name, p.description as desc, p.domain as domain
              LIMIT 3
              `,
              { pattern: regexPattern }
            );

            for (const record of projRes.records) {
              const name = record.get("name");
              const desc = record.get("desc");
              const domain = record.get("domain");
              addCandidate(`Project ${name} (${domain}): ${desc}`, "Graph-Project-Direct");
              graphMatches++;
            }

            const expRes = await session.run(
              `
              MATCH (e:Experience) WHERE e.company =~ $pattern OR e.role =~ $pattern
              RETURN e.company as company, e.role as role, e.duration as duration
              LIMIT 3
              `,
              { pattern: regexPattern }
            );

            for (const record of expRes.records) {
              const company = record.get("company");
              const role = record.get("role");
              const duration = record.get("duration");
              addCandidate(`Experience at ${company} as ${role} (${duration}).`, "Graph-Experience-Direct");
              graphMatches++;
            }
          }

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
      matchedNodesCount: fallback.matchedCount
    };
  }

  // 3. Cohere Reranking
  if (onStatusUpdate) onStatusUpdate("reranking");
  console.log(`Reranking ${candidateTexts.length} context candidates...`);
  try {
    const reranked = await rerankCandidates(query, candidateTexts);
    const selectedContexts: string[] = [];

    for (const result of reranked) {
      const candidate = candidates[result.index];
      selectedContexts.push(candidate.content);
    }

    retrievalLogs.push(`- 🎯 **Cohere Reranker**: Scored and ranked top ${selectedContexts.length} candidates by relevance score`);

    return {
      context: selectedContexts.join("\n\n"),
      retrievalLog: retrievalLogs.join("\n"),
      matchedNodesCount: selectedContexts.length
    };
  } catch (err) {
    console.error("Reranking process failed, combining directly:", err);
    retrievalLogs.push(`- ℹ️ **Reranking Engine**: Direct combination of ${candidateTexts.length} candidates`);
    return {
      context: candidateTexts.join("\n\n"),
      retrievalLog: retrievalLogs.join("\n"),
      matchedNodesCount: candidateTexts.length
    };
  }
}

export async function retrieveHybridContext(
  query: string,
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const result = await retrieveHybridContextDetailed(query, onStatusUpdate);
  return result.context;
}

