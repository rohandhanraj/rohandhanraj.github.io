"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";
import { streamChat, saveToFirestore } from "@/lib/chatClient";
import { getVisitorInfo } from "@/lib/visitorInfo";
import { retrieveContext } from "@/lib/ragEngine";
import { buildDocumentTree } from "@/lib/documentTree";
import type { ChatMessage, VisitorInfo } from "@/lib/types";

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Build once — reused across all queries (pure data, no side effects)
const docTree = buildDocumentTree();

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What is Rohan's tech stack?",
  "Summarize his experience in Generative AI",
  "Has he led engineering teams?",
  "Is he open to relocation or remote work?",
  "Tell me about his projects in Agentic AI",
];

const WELCOME_MSG: UIMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Rohan's AI assistant 👋 Ask me anything about his experience, projects, or skills. I'll answer based on his professional profile.",
};

// Custom premium SVG Assistant Icon with animations
function AssistantIcon({ className = "w-6 h-6", animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-cyan)" />
          <stop offset="100%" stopColor="var(--accent-purple)" />
        </linearGradient>
      </defs>
      {/* Outer Glow Ring */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="url(#aiGrad)"
        strokeWidth="1"
        strokeDasharray="4 2"
        className={animated ? "animate-spin" : ""}
        style={{ transformOrigin: "center", animationDuration: "12s" }}
      />
      {/* Head shape */}
      <rect
        x="6"
        y="7"
        width="12"
        height="10"
        rx="2"
        stroke="url(#aiGrad)"
        strokeWidth="1.5"
        fill="rgba(10, 25, 47, 0.6)"
      />
      {/* Eyes */}
      <circle
        cx="9.5"
        cy="11.5"
        r="1.2"
        fill="var(--accent-cyan)"
        className={animated ? "animate-pulse" : ""}
      />
      <circle
        cx="14.5"
        cy="11.5"
        r="1.2"
        fill="var(--accent-cyan)"
        className={animated ? "animate-pulse" : ""}
      />
      {/* Mouth/Waveform */}
      <path
        d="M9 14.5C10 15 11 14.5 12 15C13 14.5 14 15 15 14.5"
        stroke="var(--accent-cyan)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Antennas */}
      <path
        d="M12 7V4M10 4H14"
        stroke="url(#aiGrad)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Glowing antenna tip */}
      <circle
        cx="12"
        cy="3.5"
        r="1"
        fill="var(--accent-cyan)"
        className={animated ? "animate-ping" : ""}
        style={{ animationDuration: "2s" }}
      />
    </svg>
  );
}

// Synchronously parse markdown to HTML with streaming cursor support
const getHtmlContent = (content: string, streaming?: boolean) => {
  try {
    let raw = content;
    if (streaming) {
      raw += ' <span class="streaming-cursor"></span>';
    }
    return marked.parse(raw) as string;
  } catch (e) {
    console.error("Markdown parsing error:", e);
    return content;
  }
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

// Custom assistant message bubble that uses Avatar Sticker icon
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
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 mt-0.5 overflow-hidden border border-slate-700 bg-slate-900"
        >
          <img src="/avatar_sticker.png" alt="AI Assistant" className="w-full h-full object-cover" />
        </div>
      )}
      <div
        className="max-w-[80%] text-sm leading-relaxed markdown-content"
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
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: getHtmlContent(msg.content, msg.streaming) }}
      />
    </motion.div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  // Sticker Avatar and Speech Bubble States
  const [isStickerDismissed, setIsStickerDismissed] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  // 5-second auto-collapse effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
      setIsStickerDismissed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismissSticker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSpeechBubble(false);
    setIsStickerDismissed(true);
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowSpeechBubble(false);
    setIsStickerDismissed(true);
  };

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

          // Persist to Firestore (non-blocking, fire-and-forget)
          saveToFirestore(sessionId, newMsgs, visitorInfo || undefined).catch(() => {});
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
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-700 bg-slate-900">
                      <img src="/avatar_sticker.png" alt="AI Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p
                          className="font-orbitron font-bold text-xs"
                          style={{ color: "var(--accent-cyan)" }}
                      >
                        Rohan&apos;s Portfolio Assistant
                      </p>
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
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-700 bg-slate-900">
                              <img src="/avatar_sticker.png" alt="AI Assistant" className="w-full h-full object-cover" />
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

        {/* Floating Tooltip (shown on badge hover) */}
        <AnimatePresence>
          {isHovered && !isOpen && isStickerDismissed && (
              <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fixed bottom-[84px] right-5 z-50 px-3 py-1.5 text-xs font-orbitron font-semibold"
                  style={{
                    background: "rgba(10, 25, 47, 0.9)",
                    border: "1px solid var(--accent-cyan)",
                    color: "var(--accent-cyan)",
                    boxShadow: "0 0 15px rgba(0,240,255,0.2)",
                    borderRadius: "2px",
                    pointerEvents: "none",
                  }}
              >
                Rohan&apos;s Profile Assistant
              </motion.div>
          )}
        </AnimatePresence>

        {/* Greeting Speech Bubble */}
        <AnimatePresence>
          {showSpeechBubble && !isOpen && !isStickerDismissed && (
              <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  onClick={handleOpenChat}
                  className="fixed bottom-[110px] right-24 z-50 p-4 rounded-lg backdrop-blur-md cursor-pointer select-none"
                  style={{
                    background: "rgba(10, 25, 47, 0.85)",
                    border: "1px solid rgba(0, 240, 255, 0.4)",
                    boxShadow: "0 0 20px rgba(0, 240, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)",
                    color: "var(--text-primary)",
                    width: "220px",
                    fontSize: "0.85rem",
                    lineHeight: "1.35",
                    borderRadius: "12px 12px 0px 12px",
                  }}
              >
                {/* Arrow pointing to the avatar */}
                <div
                    className="absolute right-[-8px] bottom-[16px] w-0 h-0"
                    style={{
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: "8px solid rgba(0, 240, 255, 0.4)",
                    }}
                />
                <button
                    onClick={dismissSticker}
                    className="absolute top-1 right-1.5 w-4 h-4 flex items-center justify-center text-[11px] hover:text-white transition-colors"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0
                    }}
                    aria-label="Dismiss greeting"
                >
                  ✕
                </button>
                <p className="pr-3 font-medium">Hi, how can I assist with Rohan&apos;s profile?</p>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Big Sticker Waving Avatar */}
        <AnimatePresence>
          {!isStickerDismissed && !isOpen && (
              <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={handleOpenChat}
                  className="fixed bottom-5 right-5 z-50 cursor-pointer select-none"
                  style={{
                    width: "90px",
                    height: "90px",
                  }}
              >
                <img
                    src="/avatar_sticker.png"
                    alt="Rohan's Waving Avatar Sticker"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,240,255,0.45)] hover:scale-105 transition-transform"
                />
              </motion.div>
          )}
        </AnimatePresence>

        {/* Small Circular Profile Badge (collapsed state) */}
        <AnimatePresence>
          {isStickerDismissed && !isOpen && (
              <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={handleOpenChat}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="fixed bottom-5 right-5 z-50 cursor-pointer select-none"
                  style={{
                    width: "56px",
                    height: "56px",
                  }}
              >
                {/* Holographic Glowing Border Container */}
                <div
                    className="w-full h-full rounded-full p-[2px] relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                      boxShadow: "0 0 20px rgba(0, 240, 255, 0.4), 0 0 35px rgba(255, 46, 151, 0.2)",
                    }}
                >
                  {/* Pulse effect */}
                  <span
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{
                        background: "var(--accent-cyan)",
                        animationDuration: "3s"
                      }}
                  />
                  {/* Inner Profile Image */}
                  <img
                      src="/profile.png"
                      alt="Rohan Yadav Profile"
                      className="w-full h-full object-cover rounded-full bg-slate-900 border border-slate-950"
                  />
                </div>
                <span
                    className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full animate-pulse"
                    style={{
                      background: "var(--accent-green)",
                      boxShadow: "0 0 8px var(--accent-green)",
                    }}
                />
              </motion.div>
          )}
        </AnimatePresence>
      </>
  );
}
