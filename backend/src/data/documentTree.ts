// Vectorless RAG — Document Tree
// Each node represents a section of Rohan's professional profile.
// Keywords are used for query routing — no embeddings needed.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DocNode {
  id: string;
  section: string;
  label: string;
  keywords: string[];
  content: string;
  children?: DocNode[];
}

export function buildDocumentTree(): DocNode[] {
  const jsonPath = path.resolve(__dirname, "documentTree.json");
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as DocNode[];
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
