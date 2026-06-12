import { describe, it, expect, vi, beforeEach } from "vitest";
import { streamNvidiaNimResponse } from "./llmService.js";

describe("LLM Service", () => {
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
  });

  it("should stream mock response when API key is missing or mock", async () => {
    process.env.NVIDIA_NIM_API_KEY = "mock-key";

    await streamNvidiaNimResponse("tell me about Rohan", "Context text", [], mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(mockResponse.write).toHaveBeenCalled();
    expect(mockResponse.end).toHaveBeenCalled();

    // Verify the data written is valid SSE chunks
    const lastWrite = mockResponse.write.mock.calls[0][0];
    expect(lastWrite).toContain("data:");
  });
});
