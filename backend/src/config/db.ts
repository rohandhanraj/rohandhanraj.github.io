import "./env.js";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { QdrantClient } from "@qdrant/js-client-rest";

// MongoDB Uri Construction
let mongoUri = process.env.MONGO_URI?.trim();
if (!mongoUri) {
  const rootUser = process.env.MONGO_ROOT_USER?.trim();
  const rootPass = process.env.MONGO_ROOT_PASSWORD?.trim();
  if (rootUser && rootPass) {
    mongoUri = `mongodb://${rootUser}:${rootPass}@localhost:27017/portfolio?authSource=admin`;
  } else {
    mongoUri = "mongodb://localhost:27017/portfolio";
  }
}

// Neo4j Uri & Credentials
const neo4jUri = (process.env.NEO4J_URI || "bolt://localhost:7687").trim();
const neo4jUser = (process.env.NEO4J_USERNAME || process.env.NEO4J_USER || "neo4j").trim();
const neo4jPassword = (process.env.NEO4J_PASSWORD || "password").trim();

// Qdrant Url & Api Key
let qdrantUrl = (process.env.QDRANT_URL || process.env.QDRANT_BASE_URL || "http://localhost:6333").trim();
if (qdrantUrl.startsWith("http:") && !qdrantUrl.startsWith("http://")) {
  qdrantUrl = qdrantUrl.replace("http:", "http://");
}
const qdrantApiKey = process.env.QDRANT_API_KEY?.trim();

export const mongoClient = new MongoClient(mongoUri);

export const neo4jDriver = neo4j.driver(
  neo4jUri,
  neo4j.auth.basic(neo4jUser, neo4jPassword)
);

export const qdrantClient = new QdrantClient({
  url: qdrantUrl,
  ...(qdrantApiKey ? { apiKey: qdrantApiKey } : {})
});

export async function connectDbs() {
  await mongoClient.connect();
  await neo4jDriver.verifyConnectivity();
  // QdrantClient verifies on the first request, but let's test a simple ping or check collections
}
