import "../config/env.js";
import { fileURLToPath } from "url";
import { qdrantClient, getNeo4jSession } from "../config/db.js";

const COLLECTION_NAME = "resume_chunks";

export async function verifyIngest(): Promise<void> {
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
  if (!exists) {
    throw new Error(`Ingestion verification failed: Qdrant collection '${COLLECTION_NAME}' does not exist.`);
  }

  const countResult = await qdrantClient.count(COLLECTION_NAME, { exact: true });
  if (!countResult.count || countResult.count === 0) {
    throw new Error(`Ingestion verification failed: Qdrant collection '${COLLECTION_NAME}' has 0 points.`);
  }
  console.log(`Qdrant verification passed: ${countResult.count} points in '${COLLECTION_NAME}'.`);

  const session = getNeo4jSession();
  try {
    const result = await session.run("MATCH (s:Section) RETURN count(s) as sectionCount");
    if (result.records.length === 0) {
      throw new Error("Ingestion verification failed: Neo4j query returned no records.");
    }
    const sectionCount = result.records[0].get("sectionCount").toNumber();
    if (!sectionCount || sectionCount === 0) {
      throw new Error("Ingestion verification failed: Neo4j has 0 Section nodes.");
    }
    console.log(`Neo4j verification passed: ${sectionCount} Section nodes.`);
  } finally {
    await session.close();
  }

  console.log("Ingestion verification succeeded.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyIngest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err.message || err);
      process.exit(1);
    });
}
