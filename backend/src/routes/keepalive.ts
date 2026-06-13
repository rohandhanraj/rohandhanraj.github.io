import "../config/env.js";
import { Router } from "express";
import { mongoClient, qdrantClient, neo4jDriver } from "../config/db.js";

const router = Router();

router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron execution" });
  }

  console.log("Triggering database keep-alive ping tasks...");
  const results: Record<string, string> = {};

  // 1. MongoDB Keep-Alive
  try {
    const db = mongoClient.db();
    // Shuffled query: find one random document or run ping command
    const mongoPing = await db.command({ ping: 1 });
    results.mongodb = mongoPing.ok ? "healthy" : "failed";
  } catch (err: any) {
    console.error("MongoDB keep-alive failed:", err);
    results.mongodb = `error: ${err.message}`;
  }

  // 2. Qdrant Keep-Alive
  try {
    // Shuffled query: fetch collections info or search with a random vector
    const collections = await qdrantClient.getCollections();
    results.qdrant = collections ? "healthy" : "failed";
  } catch (err: any) {
    console.error("Qdrant keep-alive failed:", err);
    results.qdrant = `error: ${err.message}`;
  }

  // 3. Neo4j Keep-Alive
  const session = neo4jDriver.session();
  try {
    // Shuffled query: count node labels or match a random node
    const neo4jPing = await session.run("MATCH (n) RETURN count(n) as nodeCount LIMIT 1");
    const count = neo4jPing.records[0]?.get("nodeCount");
    results.neo4j = count !== undefined ? "healthy" : "failed";
  } catch (err: any) {
    console.error("Neo4j keep-alive failed:", err);
    results.neo4j = `error: ${err.message}`;
  } finally {
    await session.close();
  }

  res.status(200).json({
    status: "keepalive task executed",
    results,
    timestamp: new Date()
  });
});

export default router;
