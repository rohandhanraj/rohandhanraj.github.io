import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retrieveRAGContext, getRagStrategy } from "./ragProvider.js";
import { retrieveFactsContext } from "./factsRagAdapter.js";
import { retrieveHybridContextDetailed } from "./ragService.js";

vi.mock("./factsRagAdapter.js", () => ({
  retrieveFactsContext: vi.fn(),
}));

vi.mock("./ragService.js", () => ({
  retrieveHybridContextDetailed: vi.fn(),
}));

describe("ragProvider", () => {
  const originalEnv = process.env.RAG_STRATEGY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.RAG_STRATEGY = originalEnv;
    } else {
      delete process.env.RAG_STRATEGY;
    }
  });

  describe("getRagStrategy", () => {
    it("should return 'facts' by default when RAG_STRATEGY is unset", () => {
      delete process.env.RAG_STRATEGY;
      expect(getRagStrategy()).toBe("facts");
    });

    it("should return 'facts' when RAG_STRATEGY is 'facts'", () => {
      process.env.RAG_STRATEGY = "facts";
      expect(getRagStrategy()).toBe("facts");
    });

    it("should return 'hybrid' when RAG_STRATEGY is 'hybrid'", () => {
      process.env.RAG_STRATEGY = "hybrid";
      expect(getRagStrategy()).toBe("hybrid");
    });

    it("should normalize uppercase values like 'HYBRID' to 'hybrid'", () => {
      process.env.RAG_STRATEGY = "HYBRID";
      expect(getRagStrategy()).toBe("hybrid");
    });
  });

  describe("retrieveRAGContext", () => {
    const mockFactsResult = {
      context: "Mock facts context",
      retrievalLog: "- Mock facts log",
      matchedNodesCount: 2,
      degraded: false,
    };

    const mockHybridResult = {
      context: "Mock hybrid context",
      retrievalLog: "- Mock hybrid log",
      matchedNodesCount: 5,
      degraded: false,
    };

    it("should delegate to retrieveFactsContext by default when RAG_STRATEGY is unset", async () => {
      delete process.env.RAG_STRATEGY;
      vi.mocked(retrieveFactsContext).mockResolvedValueOnce(mockFactsResult);

      const statusCb = vi.fn();
      const result = await retrieveRAGContext("skills query", statusCb);

      expect(retrieveFactsContext).toHaveBeenCalledTimes(1);
      expect(retrieveFactsContext).toHaveBeenCalledWith("skills query", statusCb);
      expect(retrieveHybridContextDetailed).not.toHaveBeenCalled();
      expect(result).toEqual(mockFactsResult);
    });

    it("should delegate to retrieveFactsContext when RAG_STRATEGY is 'facts'", async () => {
      process.env.RAG_STRATEGY = "facts";
      vi.mocked(retrieveFactsContext).mockResolvedValueOnce(mockFactsResult);

      const result = await retrieveRAGContext("tell me about projects");

      expect(retrieveFactsContext).toHaveBeenCalledTimes(1);
      expect(retrieveFactsContext).toHaveBeenCalledWith("tell me about projects", undefined);
      expect(retrieveHybridContextDetailed).not.toHaveBeenCalled();
      expect(result).toEqual(mockFactsResult);
    });

    it("should delegate to retrieveHybridContextDetailed when RAG_STRATEGY is 'hybrid'", async () => {
      process.env.RAG_STRATEGY = "hybrid";
      vi.mocked(retrieveHybridContextDetailed).mockResolvedValueOnce(mockHybridResult);

      const statusCb = vi.fn();
      const result = await retrieveRAGContext("tell me about experience", statusCb);

      expect(retrieveHybridContextDetailed).toHaveBeenCalledTimes(1);
      expect(retrieveHybridContextDetailed).toHaveBeenCalledWith("tell me about experience", statusCb);
      expect(retrieveFactsContext).not.toHaveBeenCalled();
      expect(result).toEqual(mockHybridResult);
    });

    it("should fallback to retrieveFactsContext if RAG_STRATEGY is unknown", async () => {
      process.env.RAG_STRATEGY = "unknown_strategy";
      vi.mocked(retrieveFactsContext).mockResolvedValueOnce(mockFactsResult);

      const result = await retrieveRAGContext("hi");

      expect(retrieveFactsContext).toHaveBeenCalledTimes(1);
      expect(retrieveHybridContextDetailed).not.toHaveBeenCalled();
      expect(result).toEqual(mockFactsResult);
    });

    it("should propagate errors thrown by the delegated strategy", async () => {
      process.env.RAG_STRATEGY = "facts";
      vi.mocked(retrieveFactsContext).mockRejectedValueOnce(new Error("Facts error"));

      await expect(retrieveRAGContext("query")).rejects.toThrow("Facts error");
    });
  });
});
