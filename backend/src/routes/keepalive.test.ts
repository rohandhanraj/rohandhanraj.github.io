import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import { mongoClient, qdrantClient, neo4jDriver } from "../config/db.js";

vi.mock("../config/db.js", () => {
  const mockDb = {
    command: vi.fn().mockResolvedValue({ ok: 1 })
  };

  const mockMongoClient = {
    connect: vi.fn().mockResolvedValue({}),
    db: vi.fn().mockReturnValue(mockDb)
  };

  const mockSession = {
    run: vi.fn().mockResolvedValue({
      records: [
        {
          get: (key: string) => {
            if (key === "nodeCount") return 42;
            return null;
          }
        }
      ]
    }),
    close: vi.fn().mockResolvedValue({})
  };

  return {
    mongoClient: mockMongoClient,
    qdrantClient: {
      getCollections: vi.fn().mockResolvedValue({ collections: [] })
    },
    neo4jDriver: {
      session: vi.fn().mockReturnValue(mockSession)
    }
  };
});

describe("Keep-Alive Cron Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("should block request without correct cron token", async () => {
    const res = await request(app).get("/api/cron/keepalive");
    expect(res.status).toBe(401);
  });

  it("should trigger keepalive ping successfully with auth header", async () => {
    const res = await request(app)
      .get("/api/cron/keepalive")
      .set("Authorization", "Bearer test-secret");
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("keepalive task executed");
    expect(res.body.results.mongodb).toBe("healthy");
    expect(res.body.results.qdrant).toBe("healthy");
    expect(res.body.results.neo4j).toBe("healthy");
  });
});
