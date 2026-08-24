import { describe, it, expect, vi, beforeEach } from "vitest";
import { runKeepaliveOperations } from "./keepaliveScheduler.js";
import { mongoClient, qdrantClient, getNeo4jSession } from "../config/db.js";

vi.mock("../config/db.js", () => {
  const mockDb = {
    command: vi.fn().mockResolvedValue({ ok: 1 }),
    collection: vi.fn().mockReturnValue({
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    })
  };

  const mockSession = {
    run: vi.fn().mockResolvedValue({
      records: [{ get: () => 1 }]
    }),
    close: vi.fn().mockResolvedValue({})
  };

  return {
    mongoClient: { db: vi.fn().mockReturnValue(mockDb) },
    qdrantClient: {
      getCollections: vi.fn().mockResolvedValue({ collections: [{ name: "resume_chunks" }] }),
      search: vi.fn().mockResolvedValue([])
    },
    getNeo4jSession: vi.fn().mockReturnValue(mockSession)
  };
});

describe("Keepalive Scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should query Qdrant with a 1024-dimension dummy vector", async () => {
    await runKeepaliveOperations();

    expect(qdrantClient.search).toHaveBeenCalledWith(
      "resume_chunks",
      expect.objectContaining({ vector: expect.arrayContaining([0.01]) })
    );
    const callArgs = (qdrantClient.search as any).mock.calls[0][1];
    expect(callArgs.vector).toHaveLength(1024);
  });
});
