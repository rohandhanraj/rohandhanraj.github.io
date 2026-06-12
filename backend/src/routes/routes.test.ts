import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import { mongoClient, qdrantClient, neo4jDriver } from "../config/db.js";

vi.mock("../config/db.js", () => {
  const mockFindToArray = vi.fn().mockResolvedValue([]);
  const mockFindOne = vi.fn().mockResolvedValue({ messages: [] });
  const mockUpdateOne = vi.fn().mockResolvedValue({});
  const mockInsertOne = vi.fn().mockResolvedValue({});

  const mockDb = {
    collection: vi.fn().mockReturnValue({
      find: vi.fn().mockReturnValue({ toArray: mockFindToArray }),
      findOne: mockFindOne,
      updateOne: mockUpdateOne,
      insertOne: mockInsertOne
    })
  };

  const mockMongoClient = {
    connect: vi.fn().mockResolvedValue({}),
    db: vi.fn().mockReturnValue(mockDb)
  };

  const mockSession = {
    run: vi.fn().mockResolvedValue({ records: [] }),
    close: vi.fn().mockResolvedValue({})
  };

  return {
    mongoClient: mockMongoClient,
    qdrantClient: {
      search: vi.fn().mockResolvedValue([])
    },
    neo4jDriver: {
      session: vi.fn().mockReturnValue(mockSession)
    }
  };
});

describe("Express App Routers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/chat/history", () => {
    it("should retrieve chat history and set cookies", async () => {
      const res = await request(app).get("/api/chat/history");
      expect(res.status).toBe(200);
      expect(res.body.messages).toBeInstanceOf(Array);
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("POST /api/analytics", () => {
    it("should log analytics events and return success", async () => {
      const res = await request(app)
        .post("/api/analytics")
        .send({ eventType: "page_view", details: { url: "/portfolio" } });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should reject invalid analytics events", async () => {
      const res = await request(app).post("/api/analytics").send({});
      expect(res.status).toBe(400);
    });
  });
});
