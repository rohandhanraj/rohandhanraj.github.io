import { Router } from "express";
import crypto from "crypto";
import { mongoClient } from "../config/db.js";
import { retrieveHybridContext } from "../services/ragService.js";
import { isPromptInjection, SAFE_FALLBACK_RESPONSE } from "../services/guardrailService.js";
import { streamNvidiaNimResponse } from "../services/llmService.js";

const router = Router();

// Retrieve cookies or generate them
router.use((req, res, next) => {
  let chatSessionId = req.cookies.chat_session_id;
  let visitorId = req.cookies.visitor_id;

  const secure = req.secure || process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
  };

  if (!chatSessionId) {
    chatSessionId = crypto.randomUUID();
    res.cookie("chat_session_id", chatSessionId, cookieOptions);
  }
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookie("visitor_id", visitorId, cookieOptions);
  }

  req.chatSessionId = chatSessionId;
  req.visitorId = visitorId;
  next();
});

// GET /api/chat/history
router.get("/history", async (req, res) => {
  try {
    const db = mongoClient.db();
    const chatDoc = await db.collection("chats").findOne({ chat_session_id: req.chatSessionId });
    res.status(200).json({
      chat_session_id: req.chatSessionId,
      visitor_id: req.visitorId,
      messages: chatDoc?.messages || []
    });
  } catch (err) {
    console.error("Failed to fetch chat history:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// POST /api/chat
router.post("/", async (req, res) => {
  const { query, history = [] } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  // 1. Input Guardrail Check
  if (isPromptInjection(query)) {
    console.warn(`Prompt injection attempt blocked: "${query}"`);
    res.setHeader("Content-Type", "text/event-stream");
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: SAFE_FALLBACK_RESPONSE } }] })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  try {
    // 2. Retrieve Hybrid context
    const context = await retrieveHybridContext(query);

    // Create a mock/intercept response object to capture the full streamed text
    let fullResponse = "";
    const originalWrite = res.write.bind(res);
    res.write = (chunk: any, encoding?: any, callback?: any) => {
      const chunkStr = chunk.toString();
      if (chunkStr.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(chunkStr.slice(6).trim());
          fullResponse += parsed.choices?.[0]?.delta?.content || "";
        } catch {
          // ignore parsing error
        }
      }
      return originalWrite(chunk, encoding, callback);
    };

    const originalEnd = res.end.bind(res);
    res.end = (chunk?: any, encoding?: any, callback?: any) => {
      // Stream is ending, save to DB in background
      const db = mongoClient.db();
      db.collection("chats").updateOne(
        { chat_session_id: req.chatSessionId },
        {
          $push: {
            messages: {
              $each: [
                { role: "user", content: query, timestamp: new Date() },
                { role: "assistant", content: fullResponse || SAFE_FALLBACK_RESPONSE, timestamp: new Date(), contextUsed: context }
              ]
            }
          } as any,
          $setOnInsert: { visitor_id: req.visitorId, createdAt: new Date() },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      ).catch(err => console.error("Failed to save conversation history to MongoDB:", err));

      return originalEnd(chunk, encoding, callback);
    };

    // 3. Stream LLM Response
    await streamNvidiaNimResponse(query, context, history, res);
  } catch (err: any) {
    console.error("Error in chat route:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal chat completion failure" });
    }
  }
});

export default router;
