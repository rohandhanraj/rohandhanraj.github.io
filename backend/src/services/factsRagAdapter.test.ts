import { describe, it, expect, vi } from "vitest";
import { retrieveFactsContext, RetrievalResult } from "./factsRagAdapter.js";

describe("Facts RAG Adapter (Pluggable In-Memory RAG)", () => {
  describe("Greeting Queries", () => {
    it.each([
      "hi",
      "hello",
      "who are you",
      "introduce yourself",
      "hey there",
    ])("should return concise identity and role for greeting '%s' without project or experience dumps", async (greeting) => {
      const result: RetrievalResult = await retrieveFactsContext(greeting);

      expect(result.context).toBeDefined();
      expect(result.context).toContain("Rohan Dhanraj Yadav");
      expect(result.context).toContain("Publicis Sapient");
      expect(result.context).toContain("Senior Associate Data Science L2");

      // Verify no context bloat / dumps
      expect(result.context).not.toContain("### Project:");
      expect(result.context).not.toContain("Bureau Veritas Group");
      expect(result.context).not.toContain("Aimlytics Technology");
      expect(result.context).not.toContain("Mice Protein Expression Analysis");

      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toMatch(/greeting|identity/i);
    });
  });

  describe("Skills & Tech Stack Queries", () => {
    it("should return matching specialties for tech stack inquiry", async () => {
      const result = await retrieveFactsContext("What is your tech stack?");

      expect(result.context).toContain("Generative AI & LLMs");
      expect(result.context).toContain("Agentic AI & Multi-Agent Systems");
      expect(result.context).toContain("Python");
      expect(result.context).toContain("LangGraph");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toMatch(/skills|specialties/i);
    });

    it("should return matching specialties and relevant projects with skills_used for specific skills", async () => {
      const result = await retrieveFactsContext("tell me about Python and LangGraph");

      expect(result.context).toContain("LangGraph");
      expect(result.context).toContain("Python");
      // Relevant project using LangGraph & Python
      expect(result.context).toContain("Omodore");
      expect(result.context).toContain("Skills Used");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Project Queries", () => {
    it("should return exact project details, skills, and responsibilities for Omodore", async () => {
      const result = await retrieveFactsContext("Tell me about Omodore");

      expect(result.context).toContain("Omodore");
      expect(result.context).toContain("AI Agent Platform");
      expect(result.context).toContain("No-code AI agent platform");
      expect(result.context).toContain("LangGraph");
      expect(result.context).toContain("FastAPI");
      expect(result.context).toContain("Led 15-member team");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toContain("Omodore");
    });

    it("should return project details for Rbetraj and AI Tech Crawler", async () => {
      const result = await retrieveFactsContext("Tell me about Rbetraj and web scraping");

      expect(result.context).toContain("Rbetraj");
      expect(result.context).toContain("AI Tech Crawler");
      expect(result.context).toContain("Playwright");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Company & Experience Queries", () => {
    it("should return Publicis Sapient role and responsibilities", async () => {
      const result = await retrieveFactsContext("Tell me about your work at Publicis Sapient");

      expect(result.context).toContain("Publicis Sapient");
      expect(result.context).toContain("Senior Associate Data Science L2");
      expect(result.context).toContain("September 2026");
      expect(result.context).toContain("Enterprise data science delivery");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toContain("Publicis Sapient");
    });

    it("should return R Systems experience when asked", async () => {
      const result = await retrieveFactsContext("What did you do at R Systems?");

      expect(result.context).toContain("R Systems International");
      expect(result.context).toContain("Lendistry");
      expect(result.context).toContain("Model Context Protocol (MCP)");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Numeric Experience Queries", () => {
    it("should return exact years of experience for Generative AI and total experience", async () => {
      const result = await retrieveFactsContext("How many years of experience in Generative AI?");

      expect(result.context).toMatch(/2\+?\s*years?.*(?:Generative AI|GenAI)/i);
      expect(result.context).toMatch(/7\+?\s*years?.*total/i);
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toMatch(/experience|years/i);
    });

    it("should return total years of experience when asked", async () => {
      const result = await retrieveFactsContext("What is your total years of experience?");

      expect(result.context).toMatch(/7\+?\s*years?/);
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Status Update Callback", () => {
    it("should invoke onStatusUpdate callback with progress messages if provided", async () => {
      const onStatusUpdate = vi.fn();
      const result = await retrieveFactsContext("Tell me about Omodore", onStatusUpdate);

      expect(onStatusUpdate).toHaveBeenCalled();
      expect(onStatusUpdate.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(result.context).toContain("Omodore");
    });
  });
});
