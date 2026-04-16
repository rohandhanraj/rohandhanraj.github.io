"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat, saveToMongo } from "@/lib/chatClient";
import { getVisitorInfo } from "@/lib/visitorInfo";
import { retrieveContext } from "@/lib/ragEngine";
import { buildDocumentTree } from "@/lib/documentTree";
import type { ChatMessage, VisitorInfo } from "@/lib/types";

// Build once — reused across all queries (pure data, no side effects)
const docTree = buildDocumentTree();

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Who is Rohan?",
  "What projects has he built?",
  "Does he know FastAPI?",
  "What's Omodore?",
  "Is he open to work?",
];

const WELCOME_MSG: UIMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Rohan's AI assistant 👋 Ask me anything about his experience, projects, or skills. I'll answer based on his professional profile.",
};

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-4 py-3" style={{ width: "fit-content" }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            background: "var(--accent-cyan)",
            animation: `pulse-glow 1s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      {!isUser && (
        <div
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-0.5 font-orbitron font-bold"
          style={{
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
            color: "var(--bg-primary)",
          }}
        >
          AI
        </div>
      )}
      <div
        className="max-w-[80%] text-sm leading-relaxed"
        style={{
          background: isUser
            ? "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(255,46,151,0.1))"
            : "var(--bg-card)",
          border: `1px solid ${isUser ? "rgba(0,240,255,0.3)" : "var(--border-subtle)"}`,
          color: "var(--text-primary)",
          padding: "0.625rem 0.875rem",
          borderRadius: "2px",
          borderTopRightRadius: isUser ? 0 : "2px",
          borderTopLeftRadius: isUser ? "2px" : 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
        {msg.streaming && (
          <span
            className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse"
            style={{ background: "var(--accent-cyan)" }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([WELCOME_MSG]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionIdState] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session ID and fetch visitor info
  useEffect(() => {
    const stored = localStorage.getItem("portfolio_chat_session");
    const sid = stored || crypto.randomUUID();
    if (!stored) localStorage.setItem("portfolio_chat_session", sid);
    setSessionIdState(sid);

    // Fetch visitor info in background (non-blocking)
    getVisitorInfo().then(setVisitorInfo).catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      const query = text.trim();

      setShowSuggestions(false);
      setError(null);

      // Add user message
      const userMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
      ]);
      setInput("");
      setIsLoading(true);

      // RAG: retrieve relevant context from the document tree (client-side)
      const context = retrieveContext(query, docTree);

      // Create streaming assistant message
      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", streaming: true },
      ]);

      // Stream from OpenRouter
      await streamChat(context, chatHistory, query, {
        onToken(token) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },

        onDone(fullText) {
          // Finalize the streaming message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: fullText, streaming: false }
                : m
            )
          );
          setIsLoading(false);

          // Update chat history for context
          const now = new Date().toISOString();
          const newMsgs: ChatMessage[] = [
            { role: "user", content: query, timestamp: now },
            { role: "assistant", content: fullText, timestamp: now },
          ];
          setChatHistory((prev) => [...prev, ...newMsgs]);

          // Persist to MongoDB (non-blocking, fire-and-forget)
          if (visitorInfo) {
            saveToMongo(sessionId, newMsgs, visitorInfo).catch(() => {});
          }
        },

        onError(errorMsg) {
          // Remove the empty streaming message
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          setError(errorMsg);
          setIsLoading(false);
        },
      });
    },
    [isLoading, chatHistory, sessionId, visitorInfo]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-5 z-50 flex flex-col"
            style={{
              width: "min(380px, calc(100vw - 2.5rem))",
              height: "520px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--accent-cyan)",
              boxShadow:
                "0 0 40px rgba(0,240,255,0.15), 0 20px 60px rgba(0,0,0,0.6)",
              borderRadius: "4px",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,240,255,0.1), rgba(255,46,151,0.08))",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-orbitron font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                    color: "var(--bg-primary)",
                  }}
                >
                  AI
                </div>
                <div>
                  <p
                    className="font-orbitron font-bold text-xs"
                    style={{ color: "var(--accent-cyan)" }}
                  >
                    Rohan&apos;s Portfolio AI
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "var(--accent-green)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Streaming · RAG
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4"
              style={{ overscrollBehavior: "contain" }}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {isLoading &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 mb-3"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-orbitron font-bold flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                        color: "var(--bg-primary)",
                      }}
                    >
                      AI
                    </div>
                    <div
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "2px",
                      }}
                    >
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center mb-3 px-3 py-2"
                  style={{
                    color: "var(--accent-pink)",
                    background: "rgba(255,46,151,0.08)",
                    border: "1px solid rgba(255,46,151,0.2)",
                  }}
                >
                  ⚠ {error}
                </motion.p>
              )}

              {/* Suggested questions */}
              {showSuggestions && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <p
                    className="text-xs mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 transition-all hover:opacity-80"
                        style={{
                          background: "rgba(0,240,255,0.08)",
                          border: "1px solid rgba(0,240,255,0.2)",
                          color: "var(--accent-cyan)",
                          borderRadius: "2px",
                          cursor: "pointer",
                          fontFamily: "'Fira Code', monospace",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex gap-2 p-3 flex-shrink-0"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Rohan…"
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none px-3 py-2"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontFamily: "'JetBrains Mono', monospace",
                  borderRadius: "2px",
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                  color: "var(--bg-primary)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Fira Code', monospace",
                  borderRadius: "2px",
                  minWidth: "52px",
                }}
              >
                {isLoading ? "…" : "▶"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3"
        style={{
          background: isOpen
            ? "var(--bg-card)"
            : "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
          border: `2px solid ${isOpen ? "var(--accent-cyan)" : "transparent"}`,
          color: isOpen ? "var(--accent-cyan)" : "var(--bg-primary)",
          cursor: "pointer",
          boxShadow:
            "0 0 30px rgba(0,240,255,0.3), 0 8px 32px rgba(0,0,0,0.4)",
          borderRadius: "4px",
          fontFamily: "'Fira Code', monospace",
          fontSize: "0.875rem",
          fontWeight: 700,
        }}
        aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
      >
        <span>{isOpen ? "✕" : "💬"}</span>
        <span>{isOpen ? "Close" : "Ask AI"}</span>
        {!isOpen && (
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--accent-green)" }}
          />
        )}
      </motion.button>
    </>
  );
}
