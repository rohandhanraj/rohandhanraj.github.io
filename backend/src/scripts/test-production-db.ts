import "../config/env.js";
import { mongoClient, getNeo4jSession, qdrantClient, neo4jDriver } from "../config/db.js";

async function testDbs() {
  console.log("=== Testing Database Connections ===");
  console.log("Current Environment:", process.env.NODE_ENV || "development");
  
  // 1. Test MongoDB
  try {
    console.log("Connecting to MongoDB...");
    await mongoClient.connect();
    const db = mongoClient.db();
    const pingResult = await db.command({ ping: 1 });
    console.log("✅ MongoDB Connection Successful! Ping result:", pingResult);
    
    // Check for test data in chats, analytics, or legacy chat_sessions
    const chatsCount = await db.collection("chats").countDocuments();
    const analyticsCount = await db.collection("analytics").countDocuments();
    const legacySessionsCount = await db.collection("chat_sessions").countDocuments();
    console.log(`MongoDB Stats - Chats: ${chatsCount}, Analytics: ${analyticsCount}, Legacy Chat Sessions: ${legacySessionsCount}`);
    
    if (chatsCount > 0 || analyticsCount > 0 || legacySessionsCount > 0) {
      console.log("Cleaning up test data in MongoDB collections...");
      await db.collection("chats").deleteMany({});
      await db.collection("analytics").deleteMany({});
      await db.collection("chat_sessions").deleteMany({});
      console.log("✅ MongoDB Test Data Cleaned Up!");
    }
  } catch (err: any) {
    console.error("❌ MongoDB Connection Failed:", err.message);
  }

  // 2. Test Qdrant
  try {
    console.log("Connecting to Qdrant...");
    const collections = await qdrantClient.getCollections();
    console.log("✅ Qdrant Connection Successful! Collections:", collections.collections.map(c => c.name));
    
    // Check if resume_chunks has any test data
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
    console.log("Connecting to Neo4j...");
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

  console.log("=== Database Connection Tests Completed ===");
  // Close database drivers/connections
  await mongoClient.close();
  await neo4jDriver.close();
}

testDbs().catch(console.error);
