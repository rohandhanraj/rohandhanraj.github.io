// Vectorless RAG — Document Tree
// Each node represents a section of Rohan's professional profile.
// Keywords are used for query routing — no embeddings needed.

import { DocNode } from "./types";
import generatedTree from "./documentTree.json";

export function buildDocumentTree(): DocNode[] {
  return generatedTree as DocNode[];
}

// Flatten the entire tree into a list of all nodes (for scoring all nodes)
export function flattenTree(nodes: DocNode[]): DocNode[] {
  const result: DocNode[] = [];
  function traverse(node: DocNode) {
    result.push(node);
    if (node.children) node.children.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}
