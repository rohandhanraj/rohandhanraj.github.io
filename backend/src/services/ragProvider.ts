import "../config/env.js";
import { retrieveFactsContext, type RetrievalResult } from "./factsRagAdapter.js";
import { retrieveHybridContextDetailed } from "./ragService.js";

export type { RetrievalResult };

/**
 * Returns the currently active RAG strategy ('facts' or 'hybrid').
 * Defaults to 'facts'.
 */
export function getRagStrategy(): string {
  const strategy = process.env.RAG_STRATEGY?.trim().toLowerCase();
  return strategy || "facts";
}

/**
 * Config-driven dispatcher for RAG context retrieval.
 * Dispatches to either `factsRagAdapter` or `ragService` based on RAG_STRATEGY.
 *
 * @param query The user prompt or question
 * @param onStatusUpdate Optional callback for status streaming updates
 * @returns RetrievalResult containing context, retrievalLog, and matchedNodesCount
 */
export async function retrieveRAGContext(
  query: string,
  onStatusUpdate?: (status: string) => void
): Promise<RetrievalResult> {
  const strategy = getRagStrategy();

  if (strategy === "hybrid") {
    return retrieveHybridContextDetailed(query, onStatusUpdate);
  }

  // Default to deterministic facts-based RAG
  return retrieveFactsContext(query, onStatusUpdate);
}
