import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyIngest } from "./verifyIngest.js";
import { qdrantClient, getNeo4jSession } from "../config/db.js";

vi.mock("../config/db.js", () => {
  const mockSession = {
    run: vi.fn().mockResolvedValue({
      records: [{ get: () => ({ toNumber: () => 12 }) }]
    }),
    close: vi.fn().mockResolvedValue({})
  };

  return {
    qdrantClient: {
      getCollections: vi.fn().mockResolvedValue({ collections: [{ name: "resume_chunks" }] }),
      count: vi.fn().mockResolvedValue({ count: 42 })
    },
    getNeo4jSession: vi.fn().mockReturnValue(mockSession)
  };
});

describe("verifyIngest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (qdrantClient.getCollections as any).mockResolvedValue({ collections: [{ name: "resume_chunks" }] });
    (qdrantClient.count as any).mockResolvedValue({ count: 42 });
  });

  it("should resolve when Qdrant has points and Neo4j has Section nodes", async () => {
    await expect(verifyIngest()).resolves.toBeUndefined();
  });

  it("should reject when the Qdrant collection is missing", async () => {
    (qdrantClient.getCollections as any).mockResolvedValue({ collections: [] });
    await expect(verifyIngest()).rejects.toThrow("resume_chunks");
  });

  it("should reject when the Qdrant collection has zero points", async () => {
    (qdrantClient.count as any).mockResolvedValue({ count: 0 });
    await expect(verifyIngest()).rejects.toThrow("0 points");
  });

  it("should reject when Neo4j has zero Section nodes", async () => {
    const session = getNeo4jSession();
    (session.run as any).mockResolvedValue({ records: [{ get: () => ({ toNumber: () => 0 }) }] });
    await expect(verifyIngest()).rejects.toThrow("Section nodes");
  });
});
