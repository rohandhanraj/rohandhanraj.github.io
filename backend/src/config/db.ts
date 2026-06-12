import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/portfolio";
const neo4jUri = process.env.NEO4J_URI || "bolt://localhost:7687";
const neo4jUser = process.env.NEO4J_USER || "neo4j";
const neo4jPassword = process.env.NEO4J_PASSWORD || "password";
const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
const qdrantApiKey = process.env.QDRANT_API_KEY;

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
