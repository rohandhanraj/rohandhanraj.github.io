import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("=== Starting Resume & PDF Sync Pipeline ===");

try {
  // 1. Regenerate RAG document tree from detailed_resume.md
  console.log("\n[1/3] Updating RAG Document Tree (documentTree.json)...");
  const updateRagPath = path.join(rootDir, "frontend/scripts/updateRAG.mjs");
  execSync(`node "${updateRagPath}"`, { stdio: "inherit", cwd: rootDir });

  // 2. Compile HTML Master CV to PDF
  console.log("\n[2/3] Compiling Master CV HTML to PDF...");
  const htmlToPdfPath = path.join(rootDir, "html_to_pdf.js");
  execSync(`node "${htmlToPdfPath}"`, { stdio: "inherit", cwd: rootDir });

  // 3. Compile Markdown Resumes (Detailed, Optimized, Master) to PDF
  console.log("\n[3/3] Compiling Markdown Resumes to PDF...");
  const toPdfPath = path.join(rootDir, "to_pdf.js");
  execSync(`node "${toPdfPath}"`, { stdio: "inherit", cwd: rootDir });

  console.log("\n=== Resume & PDF Sync Pipeline Completed Successfully! ===");
} catch (err) {
  console.error("\n[ERR] Resume sync pipeline failed:", err.message);
  process.exit(1);
}
