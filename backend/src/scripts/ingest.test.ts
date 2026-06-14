import { describe, it, expect, vi, beforeEach } from "vitest";
import { ingestResume } from "./ingest.js";
import { qdrantClient, getNeo4jSession } from "../config/db.js";

// Mock the DB client modules or functions
vi.mock("../config/db.js", () => {
  const mockSession = {
    run: vi.fn().mockResolvedValue({}),
    close: vi.fn().mockResolvedValue({})
  };

  const mockNeo4jDriver = {
    session: vi.fn().mockReturnValue(mockSession),
    verifyConnectivity: vi.fn().mockResolvedValue({})
  };

  const mockQdrantClient = {
    getCollections: vi.fn().mockResolvedValue({ collections: [] }),
    createCollection: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({})
  };

  const mockMongoClient = {
    connect: vi.fn().mockResolvedValue({}),
    db: vi.fn().mockReturnValue({})
  };

  const mockGetNeo4jSession = vi.fn().mockReturnValue(mockSession);

  return {
    mongoClient: mockMongoClient,
    neo4jDriver: mockNeo4jDriver,
    qdrantClient: mockQdrantClient,
    getNeo4jSession: mockGetNeo4jSession
  };
});

describe("Ingestion Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully run the ingestion logic", async () => {
    // We override process.env to ensure mock embedding is used
    process.env.OPENROUTER_API_KEY = "mock-key";
    
    await expect(ingestResume()).resolves.toBeUndefined();
    
    // Verify Qdrant creation & upsert were called
    expect(qdrantClient.getCollections).toHaveBeenCalled();
    expect(qdrantClient.createCollection).toHaveBeenCalledWith("resume_chunks", expect.any(Object));
    expect(qdrantClient.upsert).toHaveBeenCalled();
    
    // Verify Neo4j session and runs were called
    expect(getNeo4jSession).toHaveBeenCalled();
    const session = getNeo4jSession();
    expect(session.run).toHaveBeenCalled();
  });
});
