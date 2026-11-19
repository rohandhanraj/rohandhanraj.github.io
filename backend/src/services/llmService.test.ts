import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { EventEmitter } from "events";
import { streamNvidiaNimResponse, buildSystemPrompt, generateMockResponse } from "./llmService.js";

describe("LLM Service", () => {
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
  });

  describe("buildSystemPrompt", () => {
    it("should include Digital Twin persona and first-person rules", () => {
      const prompt = buildSystemPrompt("Sample facts context");
      expect(prompt).toContain('acting as a "Digital Twin"');
      expect(prompt).toContain("FIRST PERSON CONVERSATIONAL PERSONA");
      expect(prompt).toContain('NEVER start responses with formulaic, repetitive robotic phrases');
      expect(prompt).toContain("Publicis Sapient");
      expect(prompt).toContain("Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient (September 2026 – Present)");
      expect(prompt).toContain("Senior AI/ML Engineer at R Systems International (Client: Lendistry, June 2026 – September 2026)");
      expect(prompt).toContain("7+ years of total professional experience");
      expect(prompt).toContain("4+ years of AI/ML engineering");
      expect(prompt).toContain("2+ years of Generative AI");
      expect(prompt).toContain("1+ year of Agentic AI");
      expect(prompt).toContain("rohan.dhanraj.y@gmail.com");
      expect(prompt).toContain("https://www.linkedin.com/in/rohan-dhanraj-yadav");
      expect(prompt).toContain("Sample facts context");
      expect(prompt).toContain("GREETINGS & CASUAL QUESTIONS");
      expect(prompt).toContain("STRICT FACTUAL ADHERENCE & ZERO CREATIVE FABRICATION");
      expect(prompt).toContain("without generating anything out of creativity");
      expect(prompt).toContain('Never describe a short tenure as "several years"');
      expect(prompt).toContain("EXACT TENURE & TIMELINE ACCURACY");
    });
  });

  describe("generateMockResponse", () => {
    it("should respond conversationally to greetings without dumping full context", () => {
      const greetingResponse = generateMockResponse("hello", "Some long context about projects");
      expect(greetingResponse).toMatch(/Hi! I am Rohan's Digital Twin/);
      expect(greetingResponse).not.toContain("Some long context about projects");
    });

    it("should respond conversationally without fixed formulaic prefix for regular queries", () => {
      const response = generateMockResponse("Tell me about your LLM experience", "Specialties: Generative AI, Agentic AI");
      expect(response).not.toContain("Based on my experience and records");
      expect(response).toContain("Specialties: Generative AI, Agentic AI");
    });

    it("should return default first-person intro when context is empty", () => {
      const response = generateMockResponse("What is your role?", "");
      expect(response).toContain("I am Rohan Dhanraj Yadav");
      expect(response).toContain("Publicis Sapient");
      expect(response).toContain("Senior Associate Data Science L2");
    });

    it("should format Agentic AI projects conversationally without robotic formulaic opener", () => {
      const mockProjectContext = `### Project: Omodore
- **Domain**: AI Agent Platform
- **Description**: Autonomous AI Agent Platform with LangGraph.
- **Skills Used**: Python, Agentic AI, LangGraph

### Project: Rbetraj
- **Domain**: E-commerce Data Intelligence
- **Description**: Automated Dropshipping Scraper.
- **Skills Used**: Python, Agentic AI, Playwright`;

      const response = generateMockResponse("tell me about your Agentic AI projects", mockProjectContext);
      expect(response).not.toContain("Based on my experience and records");
      expect(response).toContain("Agentic AI");
      expect(response).toContain("Omodore");
      expect(response).toContain("Rbetraj");
    });
  });

  function extractSSEContent(calls: any[][]): string {
    let full = "";
    for (const call of calls) {
      const raw = call[0];
      if (typeof raw === "string" && raw.startsWith("data: ") && !raw.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(raw.slice(6).trim());
          full += parsed.choices?.[0]?.delta?.content || "";
        } catch {}
      }
    }
    return full;
  }

  describe("streamNvidiaNimResponse", () => {
    it("should stream mock response when API key is missing or mock", async () => {
      process.env.NVIDIA_NIM_API_KEY = "mock-key";

      await streamNvidiaNimResponse("tell me about Rohan", "Context text", [], mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
      expect(mockResponse.write).toHaveBeenCalled();
      expect(mockResponse.end).toHaveBeenCalled();

      // Collect all written SSE chunks
      const allWrites = mockResponse.write.mock.calls.map((c: any[]) => c[0]).join("");
      expect(allWrites).toContain("data:");

      const text = extractSSEContent(mockResponse.write.mock.calls);
      expect(text).not.toContain("Based on my experience and records");
      expect(text).toContain("Context text");
    });

    it("should stream greeting in first person when query is a greeting", async () => {
      process.env.NVIDIA_NIM_API_KEY = "mock-key";

      await streamNvidiaNimResponse("hi", "Some context", [], mockResponse);

      const text = extractSSEContent(mockResponse.write.mock.calls);
      expect(text).toContain("I am Rohan's Digital Twin");
      expect(text).not.toContain("Some context");
    });

    it("should send temperature: 0.1 and top_p: 0.1 by default in payload", async () => {
      delete process.env.LLM_TEMPERATURE;
      delete process.env.LLM_TOP_P;
      process.env.NVIDIA_NIM_API_KEY = "valid-nvapi-key";

      const mockStream = new EventEmitter();
      const postSpy = vi.spyOn(axios, "post").mockImplementation(async () => {
        setTimeout(() => mockStream.emit("end"), 10);
        return { data: mockStream } as any;
      });

      await streamNvidiaNimResponse("tell me about projects", "Context text", [], mockResponse);

      expect(postSpy).toHaveBeenCalled();
      const payload = postSpy.mock.calls[0][1] as any;
      expect(payload.temperature).toBe(0.1);
      expect(payload.top_p).toBe(0.1);

      postSpy.mockRestore();
    });

    it("should respect LLM_TEMPERATURE and LLM_TOP_P environment variable overrides", async () => {
      process.env.LLM_TEMPERATURE = "0.2";
      process.env.LLM_TOP_P = "0.15";
      process.env.NVIDIA_NIM_API_KEY = "valid-nvapi-key";

      const mockStream = new EventEmitter();
      const postSpy = vi.spyOn(axios, "post").mockImplementation(async () => {
        setTimeout(() => mockStream.emit("end"), 10);
        return { data: mockStream } as any;
      });

      await streamNvidiaNimResponse("tell me about projects", "Context text", [], mockResponse);

      expect(postSpy).toHaveBeenCalled();
      const payload = postSpy.mock.calls[0][1] as any;
      expect(payload.temperature).toBe(0.2);
      expect(payload.top_p).toBe(0.15);

      delete process.env.LLM_TEMPERATURE;
      delete process.env.LLM_TOP_P;
      postSpy.mockRestore();
    });
  });
});
