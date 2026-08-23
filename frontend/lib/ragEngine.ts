// Vectorless RAG Engine
// Retrieves relevant document tree nodes based on keyword/entity matching.
// No vector embeddings needed — uses a scoring function over the document tree.

import { DocNode, ChatMessage } from "./types";
import { flattenTree } from "./documentTree";

const MAX_CONTEXT_CHARS = 6000;

// Keywords that route directly to specific sections
const SECTION_ROUTES: Record<string, string[]> = {
  projects:    ["project", "built", "created", "omodore", "rbetraj", "galambo", "salesmoji", "aisera", "evalmybrand", "inventted", "mice"],
  experience:  ["experience", "work", "job", "career", "company", "r systems", "lendistry", "aimlytics", "ineuron", "ai tech", "history", "employment", "previous", "current"],
  skills:      ["skill", "technology", "tech", "mcp", "guardrails", "harness engineering", "agentic ops", "langchain", "langgraph", "fastapi", "flask", "python", "tensorflow", "pytorch", "airflow", "docker", "aws", "gcp", "rag", "llm", "bert", "roberta", "selenium", "playwright"],
  personal:    ["who", "about", "rohan", "person", "contact", "email", "phone", "linkedin", "summary", "bio", "profile"],
  education:   ["education", "degree", "university", "gate", "certification", "hackerrank", "kaggle", "btech"],
  achievements:["achievement", "award", "rank", "gold badge", "milestone", "accomplishment"],
};

// Entity map: specific tech/project/company names → exact node IDs to include
const ENTITY_MAP: Record<string, string[]> = {
  omodore:        ["1_project_name_omodore"],
  rbetraj:        ["2_project_name_rbetraj"],
  galambo:        ["3_project_name_galambo"],
  salesmoji:      ["4_project_name_salesmoji"],
  aisera:         ["5_project_name_aisera"],
  evalmybrand:    ["6_project_name_evalmybrand"],
  inventted:      ["7_project_name_inventted"],
  mice:           ["8_project_name_mice_protein_expression"],
  protein:        ["8_project_name_mice_protein_expression"],
  "r systems":    ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  rsystems:       ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  lendistry:      ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  mcp:            ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools", "generative_ai_llm_engineering"],
  guardrails:     ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools", "generative_ai_llm_engineering"],
  "agentic ops":  ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools", "agentic_ai_multi_agent_systems"],
  "harness engineering": ["1_senior_ai_ml_engineer_generative_ai_agentic_ai_mcp_tools"],
  aimlytics:      ["2_ai_ml_engineer_generative_ai_multi_agent_systems"],
  ineuron:        ["3_software_engineer_generative_ai_ml_data_science_python"],
  cisco:          ["2_ai_ml_engineer_generative_ai_multi_agent_systems", "5_project_name_aisera"],
  fortune:        ["2_ai_ml_engineer_generative_ai_multi_agent_systems", "5_project_name_aisera"],
  study:          ["education"],
  studied:        ["education"],
  education:      ["education"],
  degree:         ["education"],
  university:     ["education"],
  college:        ["education"],
  school:         ["education"],
  btech:          ["education"],
  gate:           ["education"],
  certification:  ["certifications"],
  certificates:   ["certifications"],
  award:          ["achievements_awards"],
  achievements:   ["achievements_awards"],
  honors:         ["achievements_awards"]
};

const STOPWORDS = new Set(["what", "where", "tell", "me", "about", "your", "did", "the", "and", "for", "with", "who", "are", "you", "his", "her", "has", "worked", "on", "in", "study", "job"]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function scoreNode(node: DocNode, queryTokens: string[], queryFull: string): number {
  let score = 0;
  const contentLower = (node.content || "").toLowerCase();
  const labelLower = (node.label || "").toLowerCase();
  const keywords = (node.keywords || []).map(k => k.toLowerCase());

  for (const token of queryTokens) {
    if (keywords.includes(token)) score += 5;
    else if (keywords.some(k => k.includes(token))) score += 2;
  }

  for (const token of queryTokens) {
    if (labelLower.includes(token)) score += 4;
  }

  for (const token of queryTokens) {
    if (contentLower.includes(token)) score += 1;
  }

  // Demote generic container nodes so specific leaf nodes fit into MAX_CONTEXT_CHARS
  if (["professional_experience", "professional_profile", "summary", "work_experience", "project_synopsis"].includes(node.id)) {
    score = score * 0.4;
  }

  return score;
}

function getEntityNodes(queryFull: string): string[] {
  const targetIds = new Set<string>();
  for (const [entity, nodeIds] of Object.entries(ENTITY_MAP)) {
    if (queryFull.includes(entity)) {
      nodeIds.forEach((id) => targetIds.add(id));
    }
  }
  return Array.from(targetIds);
}

export function retrieveContext(
  query: string,
  tree: DocNode[],
  chatHistory: ChatMessage[] = []
): string {
  const queryFull = query.toLowerCase().trim();
  const queryTokens = tokenize(queryFull);
  const allNodes = flattenTree(tree);

  // 1. Direct entity matching
  const entityNodeIds = getEntityNodes(queryFull);
  const entityNodes = allNodes.filter((n) => entityNodeIds.includes(n.id));

  // 2. Score every node
  const scoredNodes = allNodes.map((node) => {
    let score = scoreNode(node, queryTokens, queryFull);
    if (entityNodeIds.includes(node.id)) score += 20;
    return { node, score };
  });

  // 3. Sort by score
  const sorted = scoredNodes
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // 4. Collect context up to MAX_CONTEXT_CHARS
  const selected: DocNode[] = [];
  const seenIds = new Set<string>();
  let totalChars = 0;

  // Include entity nodes first
  for (const node of entityNodes) {
    if (node.content && !seenIds.has(node.id) && totalChars + node.content.length <= MAX_CONTEXT_CHARS) {
      selected.push(node);
      seenIds.add(node.id);
      totalChars += node.content.length;
    }
  }

  for (const { node } of sorted) {
    if (!node.content || seenIds.has(node.id)) continue;
    if (totalChars + node.content.length > MAX_CONTEXT_CHARS && selected.length > 0) continue;
    selected.push(node);
    seenIds.add(node.id);
    totalChars += node.content.length;
  }

  // 5. Fallback if nothing matched
  if (selected.length === 0) {
    const fallback = allNodes.find((n) => n.id === "professional_profile" || n.id === "summary") || allNodes[0];
    if (fallback && fallback.content) selected.push(fallback);
  }

  // 6. Assemble context string
  const contextParts = selected.map(
    (node) => `### ${node.label}\n${node.content}`
  );

  return contextParts.join("\n\n---\n\n");
}
