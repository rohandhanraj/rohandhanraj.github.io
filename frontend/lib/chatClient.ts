// Client-side chat engine — interacts only with the backend API
import { ChatMessage, VisitorInfo } from "./types";

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
  onStatus?: (status: "retrieving" | "reranking") => void;
}

/**
 * Streams a chat response from the backend server.
 */
export async function streamChat(
  context: string,
  history: ChatMessage[],
  query: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    callbacks.onError("AI service is not configured. Please contact the site owner.");
    return;
  }

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
          if (parsed.status && callbacks.onStatus) {
            callbacks.onStatus(parsed.status);
            continue;
          }

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
  } catch (err) {
    console.error("Backend stream error:", err);
    callbacks.onError("Connection failed. Please check your internet and try again.");
  }
}

/**
 * Logs an analytics event to the backend API.
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
