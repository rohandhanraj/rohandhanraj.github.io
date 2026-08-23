import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { QdrantClient } from "@qdrant/js-client-rest";

// Load production environment variables explicitly for prod DB connectivity test
const rootProdEnvPath = path.resolve(process.cwd(), "..", ".env.production");
const localProdEnvPath = path.resolve(process.cwd(), ".env.production");

const targetEnvPath = fs.existsSync(rootProdEnvPath) 
  ? rootProdEnvPath 
  : fs.existsSync(localProdEnvPath) 
    ? localProdEnvPath 
    : null;

if (targetEnvPath) {
  dotenv.config({ path: targetEnvPath, override: true });
}

describe("Production Databases Connectivity Test", () => {
  let mongoClient: MongoClient | null = null;
  let neo4jDriver: any = null;
  let qdrantClient: QdrantClient | null = null;

  beforeAll(() => {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri) {
      mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }

    const neo4jUri = process.env.NEO4J_URI;
    const neo4jUser = process.env.NEO4J_USERNAME || process.env.NEO4J_USER;
    const neo4jPassword = process.env.NEO4J_PASSWORD;

    if (neo4jUri && neo4jUser && neo4jPassword) {
      neo4jDriver = neo4j.driver(
        neo4jUri,
        neo4j.auth.basic(neo4jUser, neo4jPassword),
        { connectionTimeout: 5000 }
      );
    }

    const qdrantUrl = process.env.QDRANT_BASE_URL || process.env.QDRANT_URL;
    const qdrantApiKey = process.env.QDRANT_API_KEY;

    if (qdrantUrl) {
      qdrantClient = new QdrantClient({
        url: qdrantUrl,
        ...(qdrantApiKey ? { apiKey: qdrantApiKey } : {})
      });
    }
  });

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close().catch(() => {});
    }
    if (neo4jDriver) {
      await neo4jDriver.close().catch(() => {});
    }
  });

  it("should connect to Production MongoDB Atlas successfully", async () => {
    expect(mongoClient, "MongoDB URI not found in environment").not.toBeNull();
    if (!mongoClient) return;

    await mongoClient.connect();
    const db = mongoClient.db();
    const pingResult = await db.command({ ping: 1 });
    expect(pingResult.ok).toBe(1);
  }, 10000);

  it("should connect to Production Qdrant Cloud successfully", async () => {
    expect(qdrantClient, "Qdrant URL not found in environment").not.toBeNull();
    if (!qdrantClient) return;

    const collections = await qdrantClient.getCollections();
    expect(collections).toBeDefined();
    expect(Array.isArray(collections.collections)).toBe(true);
  }, 10000);

  it("should connect to Production Neo4j Aura successfully", async () => {
    expect(neo4jDriver, "Neo4j credentials not found in environment").not.toBeNull();
    if (!neo4jDriver) return;

    await neo4jDriver.verifyConnectivity();
    const database = process.env.NEO4J_DATABASE || process.env.NEO4J_USERNAME;
    const useDatabase = database && database !== "neo4j" ? database : undefined;
    const session = neo4jDriver.session(useDatabase ? { database: useDatabase } : undefined);

    try {
      const result = await session.run("RETURN 1 as ping");
      expect(result.records.length).toBeGreaterThan(0);
      expect(result.records[0].get("ping").toNumber()).toBe(1);
    } finally {
      await session.close();
    }
  }, 10000);
});
