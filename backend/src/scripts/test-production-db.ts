import "../config/env.js";
import { mongoClient, getNeo4jSession, qdrantClient, neo4jDriver } from "../config/db.js";

async function testDbs() {
  console.log("=== Testing Production Database Connections ===");
  console.log("Current Environment:", process.env.NODE_ENV || "development");
  
  // 1. Test MongoDB
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoClient.connect();
    const db = mongoClient.db();
    const pingResult = await db.command({ ping: 1 });
    console.log("✅ MongoDB Connection Successful! Ping result:", pingResult);
    
    const chatsCount = await db.collection("chats").countDocuments();
    const analyticsCount = await db.collection("analytics").countDocuments();
    const legacySessionsCount = await db.collection("chat_sessions").countDocuments();
    console.log(`MongoDB Stats - Chats: ${chatsCount}, Analytics: ${analyticsCount}, Legacy Chat Sessions: ${legacySessionsCount}`);
  } catch (err: any) {
    console.error("❌ MongoDB Connection Failed:", err.message);
  }

  // 2. Test Qdrant
  try {
    console.log("Connecting to Qdrant Cloud...");
    const collections = await qdrantClient.getCollections();
    console.log("✅ Qdrant Connection Successful! Collections:", collections.collections.map(c => c.name));
    
    const collectionName = "resume_chunks";
    const exists = collections.collections.some(c => c.name === collectionName);
    if (exists) {
      const info = await qdrantClient.getCollection(collectionName);
      console.log(`Qdrant Collection '${collectionName}' points count:`, info.points_count);
    }
  } catch (err: any) {
    console.error("❌ Qdrant Connection Failed:", err.message);
  }

  // 3. Test Neo4j
  const session = getNeo4jSession();
  try {
    console.log("Connecting to Neo4j Aura...");
    await neo4jDriver.verifyConnectivity();
    console.log("✅ Neo4j Connection Verification Successful!");
    
    const result = await session.run("MATCH (n) RETURN count(n) as count");
    const count = result.records[0].get("count").toNumber();
    console.log("Neo4j Node Count:", count);
  } catch (err: any) {
    console.error("❌ Neo4j Connection Failed:", err.message);
  } finally {
    await session.close();
  }

  console.log("=== Production Database Connection Tests Completed ===");
  await mongoClient.close();
  await neo4jDriver.close();
}

testDbs().catch(console.error);
