import { mongoClient, qdrantClient, getNeo4jSession } from "../config/db.js";

export interface KeepaliveResults {
  mongodb: string;
  qdrant: string;
  neo4j: string;
}

export async function runKeepaliveOperations(): Promise<KeepaliveResults> {
  console.log("[Keepalive] Running robust database keep-alive operations...");
  const results: KeepaliveResults = {
    mongodb: "unknown",
    qdrant: "unknown",
    neo4j: "unknown"
  };

  // 1. MongoDB Keep-Alive: Ping, find sample, and upsert heart-beat metadata
  try {
    const db = mongoClient.db();
    await db.command({ ping: 1 });
    await db.collection("_system_keepalive").updateOne(
      { _id: "status" as any },
      { $set: { lastActive: new Date(), agent: "keepalive-scheduler" } },
      { upsert: true }
    );
    await db.collection("chats").find().limit(1).toArray();
    results.mongodb = "healthy";
  } catch (err: any) {
    console.error("[Keepalive] MongoDB check failed:", err.message);
    results.mongodb = `error: ${err.message}`;
  }

  // 2. Qdrant Keep-Alive: List collections and execute dummy vector query
  try {
    const collections = await qdrantClient.getCollections();
    if (collections && collections.collections.length > 0) {
      const collectionName = collections.collections[0].name;
      try {
        await qdrantClient.search(collectionName, {
          vector: Array(768).fill(0.01),
          limit: 1
        });
      } catch {
        // Ignore dimensionality or search query errors as long as collection exists
      }
    }
    results.qdrant = "healthy";
  } catch (err: any) {
    console.error("[Keepalive] Qdrant check failed:", err.message);
    results.qdrant = `error: ${err.message}`;
  }

  // 3. Neo4j Keep-Alive: Traverse relationship graph
  const session = getNeo4jSession();
  try {
    const neo4jPing = await session.run("MATCH (n)-[r]->(m) RETURN count(r) as relCount LIMIT 1");
    const count = neo4jPing.records[0]?.get("relCount");
    results.neo4j = count !== undefined ? "healthy" : "failed";
  } catch (err: any) {
    // If no relationships exist yet, fallback to node count
    try {
      const fallbackPing = await session.run("MATCH (n) RETURN count(n) as nodeCount LIMIT 1");
      results.neo4j = fallbackPing.records[0]?.get("nodeCount") !== undefined ? "healthy" : `error: ${err.message}`;
    } catch (fbErr: any) {
      console.error("[Keepalive] Neo4j check failed:", fbErr.message);
      results.neo4j = `error: ${fbErr.message}`;
    }
  } finally {
    await session.close();
  }

  console.log("[Keepalive] Check completed:", JSON.stringify(results));
  return results;
}

let keepaliveTimer: NodeJS.Timeout | null = null;

export function startKeepaliveScheduler() {
  if (keepaliveTimer) {
    clearTimeout(keepaliveTimer);
  }

  // Calculate random delay between 4.5 hours and 7.5 hours (avg ~6h)
  const minHours = 4.5;
  const maxHours = 7.5;
  const randomHours = minHours + Math.random() * (maxHours - minHours);
  const delayMs = Math.floor(randomHours * 60 * 60 * 1000);

  console.log(`[Keepalive] Scheduler started. Next execution in ${(randomHours).toFixed(2)} hours.`);

  // Initial execution after 15s server startup delay
  setTimeout(() => {
    runKeepaliveOperations().catch(err => console.error("[Keepalive] Initial run error:", err));
  }, 15000);

  const scheduleNext = () => {
    keepaliveTimer = setTimeout(async () => {
      try {
        await runKeepaliveOperations();
      } catch (err) {
        console.error("[Keepalive] Scheduled execution error:", err);
      } finally {
        scheduleNext();
      }
    }, delayMs);
  };

  scheduleNext();
}
