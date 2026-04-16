// Vectorless RAG Engine
// Retrieves relevant document tree nodes based on keyword/entity matching.
// No vector embeddings needed — uses a scoring function over the document tree.

import { DocNode, ChatMessage } from "./types";
import { flattenTree } from "./documentTree";

const MAX_CONTEXT_CHARS = 6000;

// Keywords that route directly to specific sections
const SECTION_ROUTES: Record<string, string[]> = {
  projects:    ["project", "built", "created", "omodore", "rbetraj", "galambo", "salesmoji", "aisera", "evalmybrand", "inventted", "mice"],
  experience:  ["experience", "work", "job", "career", "company", "aimlytics", "ineuron", "ai tech", "history", "employment", "previous"],
  skills:      ["skill", "technology", "tech", "langchain", "langgraph", "fastapi", "flask", "python", "tensorflow", "pytorch", "airflow", "docker", "aws", "gcp", "rag", "llm", "bert", "roberta", "selenium", "playwright"],
  personal:    ["who", "about", "rohan", "person", "contact", "email", "phone", "linkedin", "summary", "bio", "profile"],
  education:   ["education", "degree", "university", "gate", "certification", "hackerrank", "kaggle", "btech"],
  achievements:["achievement", "award", "rank", "gold badge", "milestone", "accomplishment"],
};

// Entity map: specific tech/project names → exact node IDs to include
const ENTITY_MAP: Record<string, string[]> = {
  omodore:        ["projects.omodore"],
  rbetraj:        ["projects.rbetraj"],
  galambo:        ["projects.galambo"],
  salesmoji:      ["projects.salesmoji"],
  aisera:         ["projects.aisera"],
  evalmybrand:    ["projects.evalmybrand"],
  inventted:      ["projects.inventted"],
  mice:           ["projects.mice"],
  protein:        ["projects.mice"],
  "ai tech":      ["experience.aitechsolutions"],
  aimlytics:      ["experience.aimlytics"],
  ineuron:        ["experience.ineuron"],
  langchain:      ["skills.generative_ai", "experience.aimlytics", "experience.aitechsolutions"],
  langgraph:      ["skills.generative_ai", "experience.aitechsolutions"],
  fastapi:        ["skills.languages", "experience.aimlytics", "experience.aitechsolutions"],
  python:         ["skills.languages"],
  rag:            ["skills.generative_ai", "projects.omodore", "projects.salesmoji"],
  docker:         ["skills.devops"],
  kubernetes:     ["skills.devops"],
  airflow:        ["skills.data_engineering", "projects.salesmoji"],
  bert:           ["skills.ml_dl", "projects.aisera"],
  roberta:        ["skills.ml_dl", "projects.evalmybrand"],
  tensorflow:     ["skills.ml_dl"],
  pytorch:        ["skills.ml_dl"],
  selenium:       ["skills.web_scraping", "projects.rbetraj"],
  playwright:     ["skills.web_scraping", "projects.rbetraj"],
  mongodb:        ["skills.data_engineering"],
  postgres:       ["skills.data_engineering"],
  qdrant:         ["skills.data_engineering", "experience.aitechsolutions"],
  milvus:         ["skills.data_engineering"],
  weaviate:       ["skills.data_engineering"],
  cisco:          ["experience.aimlytics", "projects.aisera"],
  fortune:        ["experience.aimlytics", "projects.aisera"],
  gcp:            ["skills.devops"],
  aws:            ["skills.devops", "projects.mice"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreNode(node: DocNode, queryTokens: string[], queryFull: string): number {
  let score = 0;
  const contentLower = node.content.toLowerCase();
  const labelLower = node.label.toLowerCase();

  for (const keyword of node.keywords) {
    if (queryFull.includes(keyword)) score += 3;
    else {
      for (const token of queryTokens) {
        if (keyword.startsWith(token) || token.startsWith(keyword)) score += 1;
      }
    }
  }

  // Boost for label match
  for (const token of queryTokens) {
    if (labelLower.includes(token)) score += 2;
  }

  // Content match (weaker signal)
  for (const token of queryTokens) {
    if (contentLower.includes(token)) score += 0.5;
  }

  return score;
}

function getEntityNodes(queryFull: string, allNodes: DocNode[]): string[] {
  const targetIds = new Set<string>();
  for (const [entity, nodeIds] of Object.entries(ENTITY_MAP)) {
    if (queryFull.includes(entity)) {
      nodeIds.forEach((id) => targetIds.add(id));
    }
  }
  return Array.from(targetIds);
}

function getSectionBoostIds(queryFull: string): string[] {
  const boostIds: string[] = [];
  for (const [section, triggers] of Object.entries(SECTION_ROUTES)) {
    for (const trigger of triggers) {
      if (queryFull.includes(trigger)) {
        boostIds.push(section);
        break;
      }
    }
  }
  return boostIds;
}

export function retrieveContext(
  query: string,
  tree: DocNode[],
  chatHistory: ChatMessage[] = []
): string {
  const queryFull = query.toLowerCase().trim();
  const queryTokens = tokenize(queryFull);
  const allNodes = flattenTree(tree);

  // 1. Entity matching — high-confidence direct hits
  const entityNodeIds = getEntityNodes(queryFull, allNodes);
  const entityNodes = allNodes.filter((n) => entityNodeIds.includes(n.id));

  // 2. Section routing — broad section identification
  const sectionBoostIds = getSectionBoostIds(queryFull);

  // 3. Score every node
  const scoredNodes = allNodes.map((node) => {
    let score = scoreNode(node, queryTokens, queryFull);
    // Bonus if this node is in a boosted section
    if (sectionBoostIds.some((sid) => node.id.startsWith(sid))) score += 4;
    // Bonus if it's in entity hits
    if (entityNodeIds.includes(node.id)) score += 6;
    return { node, score };
  });

  // 4. Sort and de-dup (prioritize children over parent if both scored)
  const sorted = scoredNodes
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // 5. Collect context up to MAX_CONTEXT_CHARS
  const selected: DocNode[] = [];
  const seenIds = new Set<string>();
  let totalChars = 0;

  // Always include entity nodes first
  for (const node of entityNodes) {
    if (!seenIds.has(node.id) && totalChars + node.content.length < MAX_CONTEXT_CHARS) {
      selected.push(node);
      seenIds.add(node.id);
      totalChars += node.content.length;
    }
  }

  for (const { node } of sorted) {
    if (seenIds.has(node.id)) continue;
    if (totalChars + node.content.length > MAX_CONTEXT_CHARS) continue;
    selected.push(node);
    seenIds.add(node.id);
    totalChars += node.content.length;
  }

  // 6. Fallback: if nothing matched, return personal summary
  if (selected.length === 0) {
    const fallback = allNodes.find((n) => n.id === "personal");
    if (fallback) selected.push(fallback);
  }

  // 7. Assemble context string
  const contextParts = selected.map(
    (node) => `### ${node.label}\n${node.content}`
  );

  return contextParts.join("\n\n---\n\n");
}
