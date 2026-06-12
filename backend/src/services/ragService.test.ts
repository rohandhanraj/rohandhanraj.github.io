import { describe, it, expect, vi, beforeEach } from "vitest";
import { retrieveHybridContext } from "./ragService.js";
import { qdrantClient, neo4jDriver } from "../config/db.js";

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

  return {
    qdrantClient: mockQdrantClient,
    neo4jDriver: mockNeo4jDriver,
    mongoClient: {}
  };
});

describe("RAG Context Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully retrieve and combine vector and graph context", async () => {
    process.env.OPENROUTER_API_KEY = "mock-key";
    process.env.COHERE_API_KEY = "mock-key";

    const context = await retrieveHybridContext("tell me about Rohan's Python and TypeScript skills");
    
    expect(context).toContain("Rohan Yadav is a highly skilled AI Engineer");
    expect(context).toContain("Project OMODORE uses the skill TypeScript.");
    expect(context).toContain("Project OMODORE (AI Agent Platform): AI Agent Platform description");
    
    expect(qdrantClient.search).toHaveBeenCalled();
    expect(neo4jDriver.session).toHaveBeenCalled();
  });
});
