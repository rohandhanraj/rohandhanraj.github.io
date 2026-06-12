import { mongoClient, neo4jDriver, qdrantClient } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

interface RAGContext {
  content: string;
  source: string;
  relevanceScore?: number;
}

// Simple keyword/entity extractor from user query
function extractKeywords(query: string): string[] {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s#+]/g, " ");
  const terms = clean.split(/\s+/).filter(t => t.length > 2);
  // Add common stop words removal if needed, but keeping it simple first
  const stopwords = new Set(["the", "and", "for", "with", "what", "how", "who", "are", "you", "him", "his", "her", "she", "they"]);
  return terms.filter(t => !stopwords.has(t));
}

// Fetch embeddings for Qdrant querying
async function getQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_EMBEDDING_MODEL || "nomic-ai/nomic-embed-text-v1.5";

  if (!apiKey || apiKey === "mock-key") {
    return Array.from({ length: 768 }, () => Math.random() - 0.5);
  }

  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, input: text.replace(/\n/g, " ") })
  });

  if (!res.ok) {
    throw new Error(`Embedding API failed during RAG retrieval: ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  return data.data[0].embedding;
}

// Query Cohere Rerank API
async function rerankCandidates(query: string, documents: string[]): Promise<Array<{ index: number; relevance_score: number }>> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey || apiKey === "mock-key") {
    // If no API key, return natural order with mock scores
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

export async function retrieveHybridContext(query: string): Promise<string> {
  console.log(`Retrieving context for query: "${query}"`);
  
  const keywords = extractKeywords(query);
  const candidates: RAGContext[] = [];
  const candidateTexts: string[] = [];
  const seenContent = new Set<string>();

  const addCandidate = (content: string, source: string) => {
    const trimmed = content.trim();
    if (!trimmed || seenContent.has(trimmed)) return;
    seenContent.add(trimmed);
    candidates.push({ content: trimmed, source });
    candidateTexts.push(trimmed);
  };

  // 1. Vector Search (Qdrant)
  try {
    const queryVector = await getQueryEmbedding(query);
    const vectorResults = await qdrantClient.search("resume_chunks", {
      vector: queryVector,
      limit: 5,
      with_payload: true
    });

    for (const hit of vectorResults) {
      const payload = hit.payload as any;
      if (payload?.content) {
        addCandidate(payload.content, `Vector-Similarity (${hit.score.toFixed(2)})`);
      }
    }
  } catch (err) {
    console.error("Qdrant retrieval failed:", err);
  }

  // 2. Graph Search (Neo4j)
  if (keywords.length > 0) {
    const session = neo4jDriver.session();
    try {
      // Find direct matches or connections for matching skills, projects, and experiences
      for (const kw of keywords) {
        const regexPattern = `(?i).*${kw}.*`;
        
        // Match skills and connected projects/experiences
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
        }

        // Match projects
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
        }

        // Match experiences
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
        }
      }
    } catch (err) {
      console.error("Neo4j retrieval failed:", err);
    } finally {
      await session.close();
    }
  }

  if (candidateTexts.length === 0) {
    return "No context available.";
  }

  // 3. Cohere Reranking
  console.log(`Reranking ${candidateTexts.length} context candidates...`);
  try {
    const reranked = await rerankCandidates(query, candidateTexts);
    const selectedContexts: string[] = [];

    for (const result of reranked) {
      const candidate = candidates[result.index];
      selectedContexts.push(`[Source: ${candidate.source}, ReRank Score: ${result.relevance_score.toFixed(3)}]\n${candidate.content}`);
    }

    return selectedContexts.join("\n\n");
  } catch (err) {
    console.error("Reranking process failed, combining directly:", err);
    return candidateTexts.map((text, idx) => `[Source: ${candidates[idx].source}]\n${text}`).join("\n\n");
  }
}
