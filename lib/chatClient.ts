// Client-side chat engine — zero server dependency
// 1. Streams responses from OpenRouter (OpenAI-compatible SSE)
// 2. Persists conversations to Firebase Firestore
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
8. Format lists with bullet points when appropriate
9. Distinguish carefully between experience durations: Rohan has 7+ years of total professional experience, 4+ years of AI/ML engineering experience, 3 years of Generative AI experience, and 1.5 years of Agentic AI experience. Do not state or imply he has 7+ years of experience in Generative AI or Agentic AI.
10. When queried about experience with a specific technology, framework, or tech stack, mention all the relevant projects from the context where Rohan applied that technology.`;

// ─── OpenRouter Streaming ────────────────────────────────────────────────────

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * Checks if a streamed text segment contains safety refusal or model restriction phrases.
 */
function isRefusalPattern(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return (
    lower.startsWith("unsafe") ||
    lower.includes("unsafe content") ||
    lower.includes("cannot fulfill") ||
    lower.includes("unable to answer") ||
    lower.includes("violates") ||
    lower.includes("safety guidelines") ||
    lower.includes("content moderation") ||
    lower.includes("i'm sorry, but") ||
    lower.includes("i am sorry, but") ||
    lower.includes("as an ai") ||
    lower.includes("as a large language") ||
    lower.includes("inappropriate") ||
    lower.startsWith("sorry") ||
    lower.startsWith("i cannot") ||
    lower.startsWith("i am unable")
  );
}

/**
 * Checks if a streamed text segment is a prefix or potential start of a safety refusal.
 */
function isRefusalPrefix(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s+/g, "");
  if (!lower) return true;
  const refusalStarts = [
    "unsafe",
    "cannotfulfill",
    "unabletoanswer",
    "violates",
    "safetyguidelines",
    "contentmoderation",
    "imsorry",
    "iamsorry",
    "asanai",
    "asalargelanguage",
    "inappropriate",
    "sorry",
    "icannot",
    "iamunable"
  ];
  return refusalStarts.some(
    (prefix) => prefix.startsWith(lower) || lower.startsWith(prefix)
  );
}

/**
 * Streams a chat response. Redirects to backend if NEXT_PUBLIC_BACKEND_URL is set.
 */
export async function streamChat(
  context: string,
  history: ChatMessage[],
  query: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, history }),
      });

      if (!response.ok) {
        callbacks.onError(`AI service error (${response.status}). Please try again.`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError("Streaming not supported in this browser.");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

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
            // ignore JSON parsing errors for partial tokens
          }
        }
      }

      callbacks.onDone(fullText);
      return;
    } catch (err) {
      console.error("Backend stream error:", err);
      callbacks.onError("Connection failed. Please check your internet and try again.");
      return;
    }
  }

  // Fallback to client-side OpenRouter streaming
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const model = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "openrouter/free";
  const baseUrl = process.env.NEXT_PUBLIC_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const fallbackMsg = "I don't have that specific detail, but feel free to reach Rohan directly at rohan.dhanraj.y@gmail.com or connect on LinkedIn: https://www.linkedin.com/in/rohan-dhanraj-yadav";

  if (!apiKey) {
    callbacks.onError("AI service is not configured. The site owner needs to set the API key.");
    return;
  }

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT(context) },
    ...history.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: query },
  ];

  try {
    const fallbackModels = [
      model,
      "meta-llama/llama-3-8b-instruct:free",
      "google/gemma-2-9b-it:free"
    ].filter((m, i, self) => self.indexOf(m) === i)
     .slice(0, 3);

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
        models: fallbackModels,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let isModeration = false;
      try {
        const parsedErr = JSON.parse(errText);
        const errMsg = parsedErr.error?.message?.toLowerCase() || "";
        if (
          errMsg.includes("moderation") ||
          errMsg.includes("guardrail") ||
          errMsg.includes("blocked") ||
          errMsg.includes("flagged") ||
          errMsg.includes("unsafe") ||
          errMsg.includes("policy")
        ) {
          isModeration = true;
        }
      } catch {
        const lowerErr = errText.toLowerCase();
        if (
          lowerErr.includes("moderation") ||
          lowerErr.includes("guardrail") ||
          lowerErr.includes("blocked") ||
          lowerErr.includes("flagged") ||
          lowerErr.includes("unsafe") ||
          lowerErr.includes("policy")
        ) {
          isModeration = true;
        }
      }

      if (isModeration || response.status === 403) {
        callbacks.onToken(fallbackMsg);
        callbacks.onDone(fallbackMsg);
        return;
      }

      const isAuth = response.status === 401;
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

    let isRefusal = false;
    let isFlushed = false;
    let streamBufferedText = "";
    const BUFFER_THRESHOLD = 40;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          if (!isFlushed && !isRefusal) {
            if (isRefusalPattern(streamBufferedText)) {
              callbacks.onToken(fallbackMsg);
              callbacks.onDone(fallbackMsg);
            } else {
              callbacks.onToken(streamBufferedText);
              callbacks.onDone(fullText);
            }
          } else if (isRefusal) {
            callbacks.onDone(fallbackMsg);
          } else {
            callbacks.onDone(fullText);
          }
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullText += token;

            if (!isRefusal) {
              if (!isFlushed) {
                streamBufferedText += token;
                
                if (isRefusalPattern(streamBufferedText)) {
                  isRefusal = true;
                  callbacks.onToken(fallbackMsg);
                  fullText = fallbackMsg;
                }
                else if (!isRefusalPrefix(streamBufferedText)) {
                  callbacks.onToken(streamBufferedText);
                  isFlushed = true;
                }
                else if (streamBufferedText.length >= BUFFER_THRESHOLD) {
                  callbacks.onToken(streamBufferedText);
                  isFlushed = true;
                }
              } else {
                callbacks.onToken(token);
              }
            }
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    if (!isFlushed && !isRefusal) {
      if (isRefusalPattern(streamBufferedText)) {
        callbacks.onToken(fallbackMsg);
        callbacks.onDone(fallbackMsg);
      } else {
        callbacks.onToken(streamBufferedText);
        callbacks.onDone(fullText);
      }
    } else if (isRefusal) {
      callbacks.onDone(fallbackMsg);
    } else {
      callbacks.onDone(fullText);
    }
  } catch (err: any) {
    if (err.name === "AbortError") return;
    console.error("Stream error:", err);
    callbacks.onError("Connection failed. Please check your internet and try again.");
  }
}

import { db } from "./firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { getVisitorInfo } from "./visitorInfo";

/**
 * Persists chat messages + visitor info to Firebase Firestore.
 * Redirects to backend and logs events if NEXT_PUBLIC_BACKEND_URL is configured.
 */
export async function saveToFirestore(
  sessionId: string,
  newMessages: ChatMessage[],
  visitor?: VisitorInfo
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    // If backend is active, MongoDB persistence is handled automatically by /api/chat.
    // However, log user prompt event to backend analytics for tracking.
    const lastMsg = newMessages[newMessages.length - 2]; // The user message
    if (lastMsg && lastMsg.role === "user") {
      logAnalyticsEvent("chat_message_sent", { query: lastMsg.content }).catch(() => {});
    }
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return;
  }

  try {
    const chatRef = doc(db, "chat_sessions", sessionId);
    const activeVisitor = visitor || await getVisitorInfo();

    const messagesToSave = newMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
    }));

    await setDoc(
      chatRef,
      {
        messages: arrayUnion(...messagesToSave),
        visitor: activeVisitor,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore save failed (non-fatal):", err);
  }
}

/**
 * Logs an analytics event to the backend API if configured.
 */
export async function logAnalyticsEvent(eventType: string, details: Record<string, any> = {}): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) return;

  try {
    await fetch(`${backendUrl}/api/analytics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ eventType, details })
    });
  } catch (err) {
    console.warn("Failed to log analytics event:", err);
  }
}

/**
 * Retrieves historical chat messages from backend history endpoint.
 */
export async function getChatHistory(): Promise<ChatMessage[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) return [];

  try {
    const res = await fetch(`${backendUrl}/api/chat/history`, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error("Failed to load chat history:", err);
    return [];
  }
}
