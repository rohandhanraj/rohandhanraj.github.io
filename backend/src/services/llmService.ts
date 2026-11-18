import "../config/env.js";
import axios from "axios";
import { StreamCensor } from "./guardrailService.js";
import { RetrievalResult } from "./ragService.js";

export function buildSystemPrompt(context: string): string {
  return `You are an assistant acting as a "Digital Twin", representing Rohan Dhanraj Yadav on Rohan's website, and engaging with visitors.

Your goal is to answer questions acting as Rohan (using first person: "I", "me", "my"), to the best of your knowledge based on the provided context.

Rohan Dhanraj Yadav is a Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient. He specializes in Generative AI, Agentic AI, MCP tools, and production LLM engineering.

CONTEXT — Use the key-based factual entries below to answer:
${context}

GROUNDING & PERSONALIZATION RULES:
1. Answer in the first person ("I", "my", "me") as Rohan's Digital Twin.
2. The context is structured into key-based facts from 'professionalFacts.json' (such as 'years_experience', 'specialties', 'experience', 'projects', 'education').
3. Ground all statements directly in these factual keys:
   - For experience duration, strictly cite 'years_experience': 7+ years of total professional experience, 4+ years of AI/ML engineering, 2+ years of Generative AI, and 1+ year of Agentic AI. Never claim or imply 7+ years in Generative AI or Agentic AI.
   - Current Role: Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient (September 2026 – Present).
   - Previous Role: Senior AI/ML Engineer at R Systems International (Client: Lendistry, June 2026 – September 2026).
   - For skills, refer directly to 'specialties' and relevant project 'skills_used'.
   - For projects, refer to the project's responsibilities, domain, and impact.
4. GREETINGS & CASUAL QUESTIONS:
   - If the visitor offers a simple greeting (e.g. "hi", "hello", "hey", "who are you?"), reply conversationally in 1-2 friendly sentences introducing yourself and asking what they would like to know.
   - Do NOT dump a full resume, long biography, or unsolicited project summary on greetings.
5. Answer proportionately: keep answers concise for brief queries, and detailed only when specifically requested.
6. Highlight specific metrics and achievements when relevant, and mention relevant projects where I applied specific technologies.
7. If the context does not contain the answer, say: "I don't have that specific detail in my records, but feel free to reach out to me directly at rohan.dhanraj.y@gmail.com or on LinkedIn: https://www.linkedin.com/in/rohan-dhanraj-yadav"`;
}

export function generateMockResponse(query: string, context: string): string {
  const normalized = query.trim().toLowerCase().replace(/[?!.,]/g, "");
  const greetings = ["hi", "hello", "hey", "who are you", "greetings", "good morning", "good afternoon", "good evening"];
  const isGreeting = greetings.includes(normalized) || /^(hi|hello|hey)\b/i.test(query.trim());

  if (isGreeting) {
    return "Hi! I am Rohan's Digital Twin. Welcome to my portfolio! What would you like to know about my experience, skills, or projects?";
  }

  const cleanExcerpt = context.trim();
  if (cleanExcerpt) {
    return `I am Rohan's Digital Twin. Based on my experience and records:\n\n${cleanExcerpt}`;
  }

  return "I am Rohan Dhanraj Yadav, Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient with 7+ years of total professional experience, including 4+ years in AI/ML, 2+ years in Generative AI, and 1+ year in Agentic AI. Feel free to ask me anything about my work!";
}

export async function streamNvidiaNimResponse(
  query: string,
  contextOrResult: string | RetrievalResult,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  res: any
): Promise<void> {
  let context = "";
  let retrievalLog = "";

  if (typeof contextOrResult === "string") {
    context = contextOrResult;
    retrievalLog = "- **Context Source**: Retrieved profile context nodes.";
  } else {
    context = contextOrResult.context;
    retrievalLog = contextOrResult.retrievalLog;
  }

  const apiKey = process.env.NVIDIA_NIM_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim() || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY?.trim();
  const model = process.env.NVIDIA_NIM_MODEL?.trim() || process.env.OPENROUTER_MODEL?.trim() || process.env.NEXT_PUBLIC_OPENROUTER_MODEL?.trim() || "meta/llama-3.1-70b-instruct";
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL?.trim() || process.env.OPENROUTER_BASE_URL?.trim() || process.env.NEXT_PUBLIC_OPENROUTER_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1/chat/completions";

  if (res.setHeader && !res.headersSent) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  }

  const censor = new StreamCensor();

  // Always stream detailed reasoning & graph node traversal header into the thinking palette
  const thinkingHeader = `<think>\n### 🧠 Query Reasoning & Strategy\n- **User Query**: "${query}"\n\n🔍 **Graph Knowledge & Retrieval Traversal**:\n${retrievalLog}\n\n🤖 **Model Reasoning & Synthesis**:\nProcessing retrieved context nodes and synthesizing complete response...\n`;

  let hasThinkStarted = true;
  let hasThinkEnded = false;

  const headerWords = thinkingHeader.split(" ");
  for (const word of headerWords) {
    const chunk = word + " ";
    const safe = censor.append(chunk);
    if (safe) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 8));
  }

  if (!apiKey || apiKey === "mock-key") {
    // End thinking process before streaming mock / fallback response
    const endThinkChunk = "</think>\n\n";
    const safeEndThink = censor.append(endThinkChunk);
    if (safeEndThink) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safeEndThink } }] })}\n\n`);
    }
    hasThinkEnded = true;

    // Generate dynamic response from retrieved context without any arbitrary truncation
    const mockResponseText = generateMockResponse(query, context);
    const words = mockResponseText.split(" ");
    for (const word of words) {
      const chunk = word + " ";
      const safe = censor.append(chunk);
      if (safe) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    const final = censor.append("", true);
    if (final) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: final } }] })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const systemPrompt = buildSystemPrompt(context);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: query }
  ];

  let invokeUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
  if (apiKey.startsWith("sk-or-v1-")) {
    invokeUrl = "https://openrouter.ai/api/v1/chat/completions";
  }

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Accept": "text/event-stream"
  };

  const payload = {
    model,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 4096
  };

  try {
    const response = await axios.post(invokeUrl, payload, {
      headers,
      responseType: "stream",
      timeout: 15000
    });

    const stream = response.data;
    let buffer = "";

    return new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const reasoning = parsed.choices?.[0]?.delta?.reasoning_content || "";
              const content = parsed.choices?.[0]?.delta?.content || "";

              let chunkToProcess = "";
              if (reasoning) {
                chunkToProcess += reasoning;
              } else if (content) {
                if (hasThinkStarted && !hasThinkEnded) {
                  hasThinkEnded = true;
                  chunkToProcess += "</think>\n\n";
                }
                chunkToProcess += content;
              }

              if (chunkToProcess) {
                const safe = censor.append(chunkToProcess);
                if (safe) {
                  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
                }
              }
            } catch {}
          }
        }
      });

      stream.on("end", () => {
        let endChunk = "";
        if (hasThinkStarted && !hasThinkEnded) {
          endChunk += "</think>\n\n";
        }
        const finalContent = censor.append(endChunk, true);
        if (finalContent) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: finalContent } }] })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
        resolve();
      });

      stream.on("error", (err: any) => {
        reject(err);
      });
    });
  } catch (err: any) {
    console.error("LLM Streaming failed, falling back to local context response:", err?.message || err);
    if (hasThinkStarted && !hasThinkEnded) {
      hasThinkEnded = true;
      const endThinkChunk = "</think>\n\n";
      const safeEnd = censor.append(endThinkChunk);
      if (safeEnd) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safeEnd } }] })}\n\n`);
      }
    }

    const mockResponseText = generateMockResponse(query, context);
    
    const words = mockResponseText.split(" ");
    for (const word of words) {
      const chunk = word + " ";
      const safe = censor.append(chunk);
      if (safe) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    const final = censor.append("", true);
    if (final) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: final } }] })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
