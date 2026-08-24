import { describe, it, expect, vi, beforeEach } from "vitest";
import { retrieveHybridContext, retrieveHybridContextDetailed } from "./ragService.js";
import { qdrantClient, getNeo4jSession } from "../config/db.js";

vi.mock("../config/db.js", () => {
  const mockSession = {
    run: vi.fn().mockResolvedValue({
      records: [
        {
          get: (key: string) => {
            if (key === "skill") return "TypeScript";
            if (key === "type") return "Project";
            if (key === "projName") return "OMODORE";
            if (key === "name") return "OMODORE";
            if (key === "desc") return "AI Agent Platform description";
            if (key === "domain") return "AI Agent Platform";
            if (key === "company") return "AI Tech Solutions Ltd.";
            if (key === "role") return "AI/ML Engineer";
            if (key === "duration") return "November 2024 – October 2025";
            return null;
          }
        }
      ]
    }),
    close: vi.fn().mockResolvedValue({})
  };

  const mockNeo4jDriver = {
    session: vi.fn().mockReturnValue(mockSession)
  };

  const mockQdrantClient = {
    search: vi.fn().mockResolvedValue([
      {
        score: 0.92,
        payload: {
          content: "Rohan Yadav is a highly skilled AI Engineer based in Bengaluru.",
          section: "PROFESSIONAL PROFILE",
          label: "PROFESSIONAL PROFILE"
        }
      }
    ])
  };

  const mockGetNeo4jSession = vi.fn().mockReturnValue(mockSession);

  return {
    qdrantClient: mockQdrantClient,
    neo4jDriver: mockNeo4jDriver,
    getNeo4jSession: mockGetNeo4jSession,
    mongoClient: {}
  };
});

describe("RAG Context Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully retrieve and combine vector and graph context", async () => {
    process.env.COHERE_API_KEY = "mock-key";

    const context = await retrieveHybridContext("tell me about Rohan's Python and TypeScript skills");
    
    expect(context).toContain("Rohan Yadav is a highly skilled AI Engineer");
    expect(context).toContain("Project OMODORE uses the skill TypeScript.");
    expect(context).toContain("Project OMODORE (AI Agent Platform): AI Agent Platform description");
    
    expect(qdrantClient.search).toHaveBeenCalled();
    expect(getNeo4jSession).toHaveBeenCalled();
  });
});

describe("Degraded response signal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COHERE_API_KEY = "mock-key";
  });

  it("should mark the result as degraded when both DBs return nothing", async () => {
    (qdrantClient.search as any).mockResolvedValue([]);
    const session = getNeo4jSession();
    (session.run as any).mockResolvedValue({ records: [] });

    const result = await retrieveHybridContextDetailed("tell me about Rohan");

    expect(result.degraded).toBe(true);
  });

  it("should not mark the result as degraded when vector search returns candidates", async () => {
    (qdrantClient.search as any).mockResolvedValue([
      { score: 0.9, payload: { content: "Rohan is an AI engineer." } }
    ]);

    const result = await retrieveHybridContextDetailed("tell me about Rohan");

    expect(result.degraded).toBe(false);
  });
});

describe("Neo4j query consolidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COHERE_API_KEY = "mock-key";
  });

  it("should run exactly 3 Cypher queries regardless of keyword count", async () => {
    await retrieveHybridContext("Python and TypeScript and Docker and FastAPI skills");

    const session = getNeo4jSession();
    expect(session.run).toHaveBeenCalledTimes(3);
  });
});

describe("Golden-set retrieval regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COHERE_API_KEY = "mock-key";
  });

  const cases: Array<{ query: string; mockPayload: { content: string }; expectedSubstring: string }> = [
    {
      query: "what programming languages does Rohan know",
      mockPayload: { content: "Rohan is proficient in Python, TypeScript, and SQL." },
      expectedSubstring: "Python"
    },
    {
      query: "tell me about the OMODORE project",
      mockPayload: { content: "OMODORE is an AI Agent Platform for non-technical users." },
      expectedSubstring: "OMODORE"
    },
    {
      query: "where did Rohan study",
      mockPayload: { content: "Rohan holds a B.Tech degree and cleared GATE." },
      expectedSubstring: "GATE"
    }
  ];

  it.each(cases)("should surface expected content for: $query", async ({ query, mockPayload, expectedSubstring }) => {
    (qdrantClient.search as any).mockResolvedValue([{ score: 0.95, payload: mockPayload }]);

    const context = await retrieveHybridContext(query);

    expect(context).toContain(expectedSubstring);
  });
});
