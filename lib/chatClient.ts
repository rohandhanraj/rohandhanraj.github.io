// Client-side chat engine — zero server dependency
// 1. Streams responses from OpenRouter (OpenAI-compatible SSE)
// 2. Persists conversations to MongoDB Atlas Data API
// All secrets are NEXT_PUBLIC_* env vars injected at build time via GitHub Secrets.

import { ChatMessage, VisitorInfo } from "./types";

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = (context: string) => `You are Rohan Dhanraj Yadav's intelligent portfolio assistant. Your job is to answer visitor questions about Rohan accurately and engagingly.

CONTEXT — Use ONLY the information below to answer:
${context}

RULES:
1. Answer ONLY based on the context provided above
2. If the context doesn't contain the answer, say: "I don't have that specific detail, but feel free to reach Rohan directly at rohan.dhanraj.y@gmail.com or connect on LinkedIn: https://www.linkedin.com/in/rohan-dhanraj-yadav"
3. Be friendly, professional, and concise
4. Refer to Rohan in third person (he, him, his)
5. Highlight specific metrics and achievements when relevant (e.g., 45% accuracy boost, 10K+ daily queries)
6. For project questions, mention the tech stack and key impact
7. Keep responses under 200 words unless a detailed breakdown is explicitly needed
8. Format lists with bullet points when appropriate`;

// ─── OpenRouter Streaming ────────────────────────────────────────────────────

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * Streams a chat response from OpenRouter.
 * Reads SSE chunks and calls onToken for each delta.
 */
export async function streamChat(
  context: string,
  history: ChatMessage[],
  query: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const model = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  const baseUrl = process.env.NEXT_PUBLIC_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  if (!apiKey) {
    callbacks.onError("AI service is not configured. The site owner needs to set the API key.");
    return;
  }

  // Build messages array: system + last 8 history messages + current query
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT(context) },
    ...history.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: query },
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://rohandhanraj.github.io",
        "X-Title": "Rohan Dhanraj Portfolio AI",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const isAuth = response.status === 401 || response.status === 403;
      callbacks.onError(
        isAuth
          ? "AI service authentication failed. Please check the API key."
          : `AI service error (${response.status}). Please try again.`
      );
      console.error("OpenRouter error:", response.status, errText);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError("Streaming not supported in this browser.");
      return;
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          callbacks.onDone(fullText);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    // Stream ended without [DONE] — still finalize
    callbacks.onDone(fullText);
  } catch (err: any) {
    if (err.name === "AbortError") return;
    console.error("Stream error:", err);
    callbacks.onError("Connection failed. Please check your internet and try again.");
  }
}

// ─── MongoDB Atlas Data API ──────────────────────────────────────────────────

/**
 * Persists chat messages + visitor info to MongoDB Atlas via the Data API (REST).
 * Non-blocking — failures are logged but don't affect the chat experience.
 */
export async function saveToMongo(
  sessionId: string,
  newMessages: ChatMessage[],
  visitor: VisitorInfo
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_MONGODB_DATA_API_KEY;
  const endpoint = process.env.NEXT_PUBLIC_MONGODB_DATA_API_ENDPOINT;

  if (!apiKey || !endpoint) {
    // MongoDB not configured — silently skip
    return;
  }

  try {
    await fetch(`${endpoint}/action/updateOne`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        collection: "chat_sessions",
        database: "portfolio",
        dataSource: "GithubPortfolio",
        filter: { sessionId },
        update: {
          $push: { messages: { $each: newMessages } },
          $set: {
            visitor,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            sessionId,
            createdAt: new Date().toISOString(),
          },
        },
        upsert: true,
      }),
    });
  } catch (err) {
    console.warn("MongoDB Data API save failed (non-fatal):", err);
  }
}
