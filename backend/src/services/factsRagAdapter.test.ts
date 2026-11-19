import { describe, it, expect, vi } from "vitest";
import {
  retrieveFactsContext,
  RetrievalResult,
  loadProfessionalFacts,
  extractSkillAliases,
  PROJECT_ALIASES
} from "./factsRagAdapter.js";

describe("Facts RAG Adapter (Pluggable In-Memory RAG)", () => {
  describe("Asset Resolution & Loading", () => {
    it("should resolve and load professionalFacts.json across environments", () => {
      const facts = loadProfessionalFacts();
      expect(facts).toBeDefined();
      expect(facts.full_name).toBe("Rohan Dhanraj Yadav");
      expect(facts.current_role).toContain("Publicis Sapient");
      expect(facts.years_experience.total).toBe(7);
      expect(facts.years_experience.generative_ai).toBe(2);
    });
  });

  describe("Skill Aliases & Acronym Extraction", () => {
    it("should extract acronyms and clean aliases from parenthesized strings", () => {
      const ragAliases = extractSkillAliases("Retrieval-Augmented Generation (RAG)");
      expect(ragAliases).toContain("rag");
      expect(ragAliases).toContain("retrieval-augmented generation");

      const mcpAliases = extractSkillAliases("Model Context Protocol (MCP)");
      expect(mcpAliases).toContain("mcp");
      expect(mcpAliases).toContain("model context protocol");

      const gptAliases = extractSkillAliases("OpenAI (GPT-4 / GPT-4o)");
      expect(gptAliases).toContain("gpt-4");
      expect(gptAliases).toContain("gpt-4o");
      expect(gptAliases).toContain("openai");

      const awsAliases = extractSkillAliases("Amazon Web Services (AWS)");
      expect(awsAliases).toContain("aws");
      expect(awsAliases).toContain("amazon web services");
    });

    it("should extract subphrases from compound categories with '&' or '/'", () => {
      const agenticAliases = extractSkillAliases("Agentic AI & Multi-Agent Systems");
      expect(agenticAliases).toContain("agentic ai");
      expect(agenticAliases).toContain("multi-agent systems");
      expect(agenticAliases).toContain("agentic");

      const genAiAliases = extractSkillAliases("Generative AI & LLMs");
      expect(genAiAliases).toContain("generative ai");
      expect(genAiAliases).toContain("llms");
    });
  });

  describe("Greeting Queries", () => {
    it.each([
      "hi",
      "hello",
      "who are you",
      "introduce yourself",
      "hey there",
      "Hello, who are you?",
      "Hi! Introduce yourself please"
    ])("should return concise identity and role for pure greeting '%s' without project or experience dumps", async (greeting) => {
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

  describe("Compound Queries Starting with a Greeting", () => {
    it("should retrieve Publicis Sapient work when greeting is followed by company inquiry", async () => {
      const result = await retrieveFactsContext("Hello, tell me about your work at Publicis Sapient");

      expect(result.context).toContain("Publicis Sapient");
      expect(result.context).toContain("Senior Associate Data Science L2");
      expect(result.context).toContain("Enterprise data science delivery");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should retrieve tech stack when greeting is followed by skills question", async () => {
      const result = await retrieveFactsContext("Hi! What is your tech stack?");

      expect(result.context).toContain("Generative AI & LLMs");
      expect(result.context).toContain("Python");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should retrieve project details when greeting is followed by project name", async () => {
      const result = await retrieveFactsContext("Hey there, tell me about Omodore");

      expect(result.context).toContain("Omodore");
      expect(result.context).toContain("AI Agent Platform");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should retrieve numeric experience when greeting is followed by years inquiry", async () => {
      const result = await retrieveFactsContext("Hello, how many years of experience do you have in Generative AI?");

      expect(result.context).toMatch(/2\+?\s*years?.*(?:Generative AI|GenAI)/i);
      expect(result.context).toMatch(/7\+?\s*years?.*total/i);
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Skills & Tech Stack Queries (including Acronym Matching)", () => {
    it("should return matching specialties for tech stack inquiry", async () => {
      const result = await retrieveFactsContext("What is your tech stack?");

      expect(result.context).toContain("Generative AI & LLMs");
      expect(result.context).toContain("Agentic AI & Multi-Agent Systems");
      expect(result.context).toContain("Python");
      expect(result.context).toContain("LangGraph");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toMatch(/skills|specialties/i);
    });

    it("should match parenthesized acronym 'RAG' and return both specialties and projects using RAG", async () => {
      const result = await retrieveFactsContext("experience with RAG");

      expect(result.context).toContain("Retrieval-Augmented Generation (RAG)");
      // Projects using RAG
      expect(result.context).toContain("Omodore");
      expect(result.context).toContain("Skills Used");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should match parenthesized acronym 'MCP' and return specialty and related experience", async () => {
      const result = await retrieveFactsContext("tell me about MCP");

      expect(result.context).toContain("Model Context Protocol (MCP)");
      expect(result.context).toContain("R Systems International");
      expect(result.context).toContain("Lendistry");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should match 'AWS' and return specialty, experience, and relevant projects", async () => {
      const result = await retrieveFactsContext("What experience do you have with AWS?");

      expect(result.context).toContain("Amazon Web Services (AWS)");
      expect(result.context).toContain("R Systems International");
      expect(result.context).toContain("Document Intelligence");
      expect(result.context).toContain("Origen Assistant");
      expect(result.context).toContain("Mice Protein Expression Analysis");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
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
    it("should return exact project details, skills, and responsibilities for Document Intelligence", async () => {
      const result = await retrieveFactsContext("Tell me about Document Intelligence");

      expect(result.context).toContain("Document Intelligence");
      expect(result.context).toContain("Financial Lending & Document Processing");
      expect(result.context).toContain("**Client**: Lendistry");
      expect(result.context).toContain("**Company**: R Systems International");
      expect(result.context).toContain("Multi-Modal AI");
      expect(result.context).toContain("PII Redaction");
      expect(result.context).toContain("Guardrails");
      expect(result.context).toContain("AWS");
      expect(result.context).toContain("Classified complex loan and financial documents");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toContain("Document Intelligence");
    });

    it("should return exact project details, skills, and responsibilities for Origen Assistant", async () => {
      const result = await retrieveFactsContext("Tell me about Origen Assistant");

      expect(result.context).toContain("Origen Assistant");
      expect(result.context).toContain("Fintech & Lending Agent");
      expect(result.context).toContain("**Client**: Lendistry");
      expect(result.context).toContain("**Company**: R Systems International");
      expect(result.context).toContain("Conversational lending portal assistant");
      expect(result.context).toContain("Agentic Workflows");
      expect(result.context).toContain("PII Redaction");
      expect(result.context).toContain("Guardrails");
      expect(result.context).toContain("AWS");
      expect(result.context).toContain("Guided borrowers through financial terminology");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
      expect(result.retrievalLog).toContain("Origen Assistant");
    });

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

    it("should return Aisera for queries about sales intelligence and 4,500+ daily queries", async () => {
      const result = await retrieveFactsContext("Tell me about sales intelligence and 4500 daily queries");

      expect(result.context).toContain("Aisera");
      expect(result.context).toContain("4,500+ daily API requests");
      expect(result.context).toContain("100K+ daily records");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should verify PROJECT_ALIASES contains Document Intelligence and Origen Assistant", () => {
      expect(PROJECT_ALIASES["Document Intelligence"]).toContain("document intelligence");
      expect(PROJECT_ALIASES["Document Intelligence"]).toContain("document extraction");
      expect(PROJECT_ALIASES["Document Intelligence"]).toContain("lending documents");
      expect(PROJECT_ALIASES["Origen Assistant"]).toContain("origen assistant");
      expect(PROJECT_ALIASES["Origen Assistant"]).toContain("lending portal");
      expect(PROJECT_ALIASES["Origen Assistant"]).toContain("smart fill");
    });

    it("should return all Agentic AI projects and exclude Document Intelligence for 'tell me about your Agentic AI projects' query", async () => {
      const result = await retrieveFactsContext("tell me about your Agentic AI projects");

      expect(result.context).toContain("Omodore");
      expect(result.context).toContain("Rbetraj");
      expect(result.context).toContain("Salesmoji");
      expect(result.context).toContain("Aisera");
      expect(result.context).toContain("Origen Assistant");
      expect(result.context).not.toContain("### Project: Document Intelligence");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(4);
    });

    it("should return Agentic AI projects for short query 'Agentic AI projects'", async () => {
      const result = await retrieveFactsContext("Agentic AI projects");

      expect(result.context).toContain("Omodore");
      expect(result.context).toContain("Rbetraj");
      expect(result.context).toContain("Salesmoji");
      expect(result.context).toContain("Aisera");
      expect(result.context).not.toContain("### Project: Document Intelligence");
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

    it("should treat Lendistry as client and return both experience and client projects Document Intelligence and Origen Assistant", async () => {
      const result = await retrieveFactsContext("What work did you do for client Lendistry?");

      expect(result.context).toContain("**Client**: Lendistry");
      expect(result.context).toContain("R Systems International");
      expect(result.context).toContain("Document Intelligence");
      expect(result.context).toContain("Origen Assistant");
      // Must not treat Lendistry as a project
      expect(result.context).not.toMatch(/### Project:\s*Lendistry/i);
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(2);
    });

    it("should match PII redaction and return specialties, Document Intelligence, and Origen Assistant", async () => {
      const result = await retrieveFactsContext("experience with PII redaction");

      expect(result.context).toContain("PII Redaction");
      expect(result.context).toContain("Document Intelligence");
      expect(result.context).toContain("Origen Assistant");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should match Guardrails and return specialties, R Systems, and projects with guardrails", async () => {
      const result = await retrieveFactsContext("tell me about guardrails");

      expect(result.context).toContain("Guardrails");
      expect(result.context).toContain("R Systems International");
      expect(result.context).toContain("Document Intelligence");
      expect(result.context).toContain("Origen Assistant");
      expect(result.matchedNodesCount).toBeGreaterThanOrEqual(1);
    });

    it("should include Agentic AI in skills for Omodore, Rbetraj, Salesmoji, Aisera, AI Tech Solutions, and Aimlytics", async () => {
      const omodoreRes = await retrieveFactsContext("tell me about Omodore");
      expect(omodoreRes.context).toContain("Omodore");
      expect(omodoreRes.context).toContain("Agentic AI");
      expect(omodoreRes.context).toContain("AI Tech Solutions Ltd.");

      const rbetrajRes = await retrieveFactsContext("tell me about Rbetraj");
      expect(rbetrajRes.context).toContain("Rbetraj");
      expect(rbetrajRes.context).toContain("Agentic AI");
      expect(rbetrajRes.context).toContain("AI Tech Solutions Ltd.");

      const salesmojiRes = await retrieveFactsContext("tell me about Salesmoji");
      expect(salesmojiRes.context).toContain("Salesmoji");
      expect(salesmojiRes.context).toContain("Agentic AI");
      expect(salesmojiRes.context).toContain("Aimlytics Technology");

      const aiseraRes = await retrieveFactsContext("tell me about Aisera");
      expect(aiseraRes.context).toContain("Aisera");
      expect(aiseraRes.context).toContain("Agentic AI");
      expect(aiseraRes.context).toContain("Aimlytics Technology");

      const aiTechRes = await retrieveFactsContext("experience at AI Tech Solutions");
      expect(aiTechRes.context).toContain("AI Tech Solutions Ltd.");
      expect(aiTechRes.context).toContain("Agentic AI");

      const aimlyticsRes = await retrieveFactsContext("experience at Aimlytics Technology");
      expect(aimlyticsRes.context).toContain("Aimlytics Technology");
      expect(aimlyticsRes.context).toContain("Agentic AI");
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
